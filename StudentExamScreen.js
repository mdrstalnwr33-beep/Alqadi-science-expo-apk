import React, { useEffect, useState } from 'react';
import { ActivityIndicator, Alert, ScrollView, StyleSheet, Text, TextInput, TouchableOpacity, View } from 'react-native';
import { addDoc, collection, getDocs, query, where } from 'firebase/firestore';
import { db, firebaseReady } from './src/firebaseConfig';

const TYPE_LABELS = { multiple_choice: 'اختيار من متعدد', true_false: 'صح / خطأ', text: 'إجابة قصيرة', multiple: 'اختيار من متعدد' };
const LEVELS = { first: 'الأول الثانوي', second: 'الثاني الثانوي', third: 'الثالث الثانوي' };

export default function StudentExamScreen({ studentLevel = 'first', studentId = 'guest', subject = 'chemistry' }) {
  const [exams, setExams] = useState([]);
  const [attemptedIds, setAttemptedIds] = useState(new Set());
  const [selected, setSelected] = useState(null);
  const [answers, setAnswers] = useState({});
  const [loading, setLoading] = useState(true);
  const [submitted, setSubmitted] = useState(false);
  const [firebaseError, setFirebaseError] = useState(false);

  useEffect(() => {
    let mounted = true;
    const load = async () => {
      try {
        if (!firebaseReady || !db) {
          if (mounted) setFirebaseError(true);
          return;
        }
        const examSnap = await getDocs(query(collection(db, 'exams'), where('level', '==', studentLevel)));
        let attemptSnap = { docs: [] };
        if (studentId && studentId !== 'guest') {
          attemptSnap = await getDocs(query(collection(db, 'examAttempts'), where('studentId', '==', studentId)));
        }
        if (mounted) {
          setExams(examSnap.docs.map((d) => ({ id: d.id, ...d.data() })).filter((x) => x.active !== false && (!x.subject || x.subject === subject)));
          setAttemptedIds(new Set(attemptSnap.docs.map((d) => d.data().examId).filter(Boolean)));
        }
      } catch (error) {
        console.error('load exams', error);
        if (mounted) setFirebaseError(true);
      } finally {
        if (mounted) setLoading(false);
      }
    };
    load();
    return () => { mounted = false; };
  }, [studentLevel, studentId, subject]);

  const selectAnswer = (index, value) => {
    if (!submitted) setAnswers((current) => ({ ...current, [index]: value }));
  };

  const openExam = (exam) => {
    if (!Array.isArray(exam.questions) || exam.questions.length === 0) {
      Alert.alert('تنبيه', 'هذا الاختبار لا يحتوي على أسئلة صالحة.');
      return;
    }
    if (attemptedIds.has(exam.id)) {
      Alert.alert('تم التسليم مسبقًا', 'لا يمكنك إجراء هذا الاختبار مرة أخرى.');
      return;
    }
    setSelected(exam);
    setAnswers({});
    setSubmitted(false);
  };

  const submit = async () => {
    if (!selected) return;
    if (!firebaseReady || !db) {
      Alert.alert('Firebase غير مفعّل', 'لا يمكن تسليم الاختبار حتى يتم ربط التطبيق بـ Firebase.');
      return;
    }
    const questions = Array.isArray(selected.questions) ? selected.questions : [];
    if (!questions.length) {
      Alert.alert('تنبيه', 'لا توجد أسئلة صالحة.');
      return;
    }
    if (attemptedIds.has(selected.id)) {
      Alert.alert('تم التسليم مسبقًا', 'لا يمكنك إجراء هذا الاختبار مرة أخرى.');
      return;
    }
    const unanswered = questions.some((q, i) => {
      const type = q.type === 'multiple' ? 'multiple_choice' : q.type;
      return type !== 'text' && (answers[i] === undefined || answers[i] === '');
    });
    if (unanswered) {
      Alert.alert('تنبيه', 'أجب عن جميع الأسئلة الموضوعية قبل التسليم.');
      return;
    }
    let autoScore = 0;
    questions.forEach((q, i) => {
      const type = q.type === 'multiple' ? 'multiple_choice' : q.type;
      if (type !== 'text' && answers[i] === (q.correctAnswer ?? q.answer)) autoScore += 1;
    });
    const textCount = questions.filter((q) => q.type === 'text').length;
    try {
      await addDoc(collection(db, 'examAttempts'), {
        examId: selected.id,
        studentId,
        level: studentLevel,
        answers,
        autoScore,
        total: questions.length,
        textPending: textCount,
        submittedAt: new Date(),
        status: textCount ? 'pending_review' : 'graded',
      });
      setAttemptedIds((previous) => new Set([...previous, selected.id]));
      setSubmitted(true);
      Alert.alert('تم التسليم', textCount ? `الدرجة التلقائية: ${autoScore}/${questions.length}. الإجابات القصيرة بانتظار مراجعة المعلم.` : `درجتك: ${autoScore}/${questions.length}`);
    } catch (error) {
      console.error('submit exam', error);
      Alert.alert('خطأ في Firebase', 'تعذر حفظ إجابتك. تحقق من صلاحيات Firestore والإنترنت.');
    }
  };

  const renderOption = (option, index, optionIndex) => (
    <TouchableOpacity
      key={`${String(option)}-${optionIndex}`}
      style={[styles.option, answers[index] === option && styles.selectedOption]}
      onPress={() => selectAnswer(index, option)}
      disabled={submitted}
    >
      <Text style={styles.radio}>{answers[index] === option ? '●' : '○'}</Text>
      <Text style={styles.optionText}>{String(option)}</Text>
    </TouchableOpacity>
  );

  if (loading) {
    return <View style={styles.center}><ActivityIndicator size="large" /><Text style={styles.muted}>جاري تحميل الاختبارات...</Text></View>;
  }

  if (firebaseError && !selected) {
    return (
      <ScrollView contentContainerStyle={styles.container}>
        <Text style={styles.headerTitle}>اختبارات {LEVELS[studentLevel] || studentLevel}</Text>
        <View style={styles.errorBox}>
          <Text style={styles.errorTitle}>تعذر الاتصال بقاعدة البيانات</Text>
          <Text style={styles.errorText}>Firebase غير مفعّل في نسخة التطبيق أو تعذر الاتصال. لن يتم إغلاق التطبيق.</Text>
        </View>
      </ScrollView>
    );
  }

  if (!selected) {
    return (
      <ScrollView contentContainerStyle={styles.container}>
        <Text style={styles.headerTitle}>اختبارات {LEVELS[studentLevel] || studentLevel}</Text>
        <Text style={styles.subtitle}>تظهر هنا الاختبارات المنشورة لهذا الصف فقط.</Text>
        {exams.length === 0 ? <Text style={styles.empty}>لا توجد اختبارات منشورة حاليًا.</Text> : exams.map((exam) => {
          const attempted = attemptedIds.has(exam.id);
          const count = Array.isArray(exam.questions) ? exam.questions.length : 0;
          return (
            <TouchableOpacity key={exam.id} style={[styles.examCard, attempted && styles.attemptedCard]} onPress={() => openExam(exam)}>
              <Text style={styles.examTitle}>{exam.title || 'اختبار'}</Text>
              <Text style={styles.examMeta}>{count} أسئلة • محاولة واحدة فقط</Text>
              <Text style={attempted ? styles.attemptedText : styles.availableText}>{attempted ? '✓ تم التسليم — لا يمكن إعادة الاختبار' : 'متاح — لم يتم التسليم بعد'}</Text>
            </TouchableOpacity>
          );
        })}
      </ScrollView>
    );
  }

  const questions = Array.isArray(selected.questions) ? selected.questions : [];

  return (
    <ScrollView contentContainerStyle={styles.container}>
      <View style={styles.header}>
        <Text style={styles.headerTitle}>📄 {selected.title || 'اختبار'}</Text>
        <Text style={styles.subtitle}>المستوى: {LEVELS[studentLevel] || studentLevel}{selected.duration ? ` | الزمن: ${selected.duration} دقيقة` : ''}</Text>
      </View>
      {questions.map((q, index) => {
        const type = q.type === 'multiple' ? 'multiple_choice' : q.type;
        let answerContent;
        if (type === 'text') {
          answerContent = <TextInput style={styles.textAnswer} multiline value={answers[index] || ''} onChangeText={(value) => selectAnswer(index, value)} placeholder="اكتب إجابتك هنا..." placeholderTextColor="#8b9ab0" textAlign="right" editable={!submitted} />;
        } else if (type === 'true_false') {
          answerContent = ['صح', 'خطأ'].map((option, optionIndex) => renderOption(option, index, optionIndex));
        } else {
          const options = Array.isArray(q.options) ? q.options : [];
          answerContent = options.map((option, optionIndex) => renderOption(option, index, optionIndex));
        }
        return (
          <View style={styles.card} key={q.id || index}>
            <Text style={styles.question}>س{index + 1}: {q.questionText || q.text || 'سؤال'}</Text>
            <Text style={styles.type}>{TYPE_LABELS[type] || 'سؤال'}</Text>
            {answerContent}
          </View>
        );
      })}
      {submitted ? (
        <View style={styles.resultBox}><Text style={styles.resultTitle}>تم تسليم الاختبار ✓</Text><Text style={styles.resultText}>تم منع إعادة المحاولة لهذا الاختبار.</Text></View>
      ) : (
        <TouchableOpacity style={styles.submitBtn} onPress={submit}><Text style={styles.submitBtnText}>تسليم الاختبار النهائي 📝</Text></TouchableOpacity>
      )}
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { padding: 18, backgroundColor: '#f4f7fb', flexGrow: 1 },
  center: { flex: 1, alignItems: 'center', justifyContent: 'center', padding: 30, backgroundColor: '#f4f7fb' },
  muted: { color: '#66758c', marginTop: 10 },
  header: { backgroundColor: '#fff', borderRadius: 16, padding: 16, marginBottom: 12 },
  headerTitle: { fontSize: 22, fontWeight: '900', color: '#12233f', textAlign: 'right', marginBottom: 6 },
  subtitle: { fontSize: 13, color: '#66758c', textAlign: 'right' },
  examCard: { backgroundColor: '#fff', borderRadius: 16, padding: 16, marginBottom: 10, borderWidth: 1, borderColor: '#e2e8f0' },
  attemptedCard: { backgroundColor: '#f1f5f9', borderColor: '#cbd5e1' },
  examTitle: { color: '#12233f', fontSize: 17, fontWeight: '900', textAlign: 'right' },
  examMeta: { color: '#77869c', fontSize: 12, textAlign: 'right', marginTop: 5 },
  availableText: { color: '#0f9f76', fontSize: 12, fontWeight: '800', textAlign: 'right', marginTop: 8 },
  attemptedText: { color: '#64748b', fontSize: 12, fontWeight: '800', textAlign: 'right', marginTop: 8 },
  empty: { color: '#77869c', backgroundColor: '#fff', padding: 25, borderRadius: 15, textAlign: 'center' },
  card: { backgroundColor: '#fff', borderRadius: 17, padding: 16, marginBottom: 12 },
  question: { color: '#12233f', fontSize: 17, fontWeight: '900', textAlign: 'right', lineHeight: 25, marginBottom: 5 },
  type: { color: '#1f5eff', fontSize: 11, fontWeight: '800', textAlign: 'right', marginBottom: 12 },
  option: { flexDirection: 'row-reverse', alignItems: 'center', borderWidth: 1, borderColor: '#dbe3ed', borderRadius: 10, padding: 13, marginBottom: 8 },
  selectedOption: { borderColor: '#1f5eff', backgroundColor: '#eaf0ff' },
  radio: { color: '#1f5eff', fontSize: 18, width: 26, textAlign: 'center' },
  optionText: { color: '#12233f', textAlign: 'right', fontSize: 15, flex: 1 },
  textAnswer: { minHeight: 100, borderWidth: 1, borderColor: '#dbe3ed', borderRadius: 11, padding: 12, color: '#12233f', textAlignVertical: 'top' },
  submitBtn: { backgroundColor: '#0f9f76', padding: 16, borderRadius: 13, alignItems: 'center', marginVertical: 8 },
  submitBtnText: { color: '#fff', fontSize: 17, fontWeight: '900' },
  resultBox: { backgroundColor: '#e8f8f2', borderRadius: 14, padding: 16, marginTop: 5 },
  resultTitle: { color: '#0f9f76', fontSize: 17, fontWeight: '900', textAlign: 'right' },
  resultText: { color: '#245b4c', lineHeight: 22, textAlign: 'right', marginTop: 7 },
  errorBox: { backgroundColor: '#fff5d8', borderRadius: 15, padding: 18, marginTop: 18 },
  errorTitle: { color: '#92400e', fontSize: 17, fontWeight: '900', textAlign: 'right' },
  errorText: { color: '#92400e', lineHeight: 23, textAlign: 'right', marginTop: 8 },
});
