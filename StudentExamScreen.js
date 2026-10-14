import React, { useEffect, useState } from 'react';
import { Alert, ActivityIndicator, ScrollView, StyleSheet, Text, TextInput, TouchableOpacity, View } from 'react-native';
import { addDoc, collection, getDocs, query, where } from 'firebase/firestore';
import { db } from './src/firebaseConfig';

const TYPE_LABELS = {
  multiple_choice: 'اختيار من متعدد',
  true_false: 'صح / خطأ',
  text: 'إجابة قصيرة',
  multiple: 'اختيار من متعدد',
};

export default function StudentExamScreen({ studentLevel = 'first', studentId = 'guest' }) {
  const [exams, setExams] = useState([]);
  const [selected, setSelected] = useState(null);
  const [answers, setAnswers] = useState({});
  const [loading, setLoading] = useState(true);
  const [submitted, setSubmitted] = useState(false);

  useEffect(() => {
    let mounted = true;
    (async () => {
      try {
        const snap = await getDocs(query(collection(db, 'exams'), where('level', '==', studentLevel)));
        if (mounted) setExams(snap.docs.map((doc) => ({ id: doc.id, ...doc.data() })).filter((x) => x.active !== false));
      } catch (error) {
        console.error(error);
        if (mounted) Alert.alert('تنبيه', 'تعذر تحميل الاختبارات من قاعدة البيانات.');
      } finally {
        if (mounted) setLoading(false);
      }
    })();
    return () => { mounted = false; };
  }, [studentLevel]);

  const selectAnswer = (index, value) => {
    if (submitted) return;
    setAnswers((current) => ({ ...current, [index]: value }));
  };

  const submit = async () => {
    if (!selected) return;
    const unanswered = selected.questions.some((q, index) => q.type !== 'text' && !answers[index]);
    if (unanswered) return Alert.alert('تنبيه', 'أجب عن جميع أسئلة الاختيار والصح والخطأ قبل التسليم.');

    let autoScore = 0;
    selected.questions.forEach((q, index) => {
      if (q.type !== 'text' && answers[index] === (q.correctAnswer ?? q.answer)) autoScore += 1;
    });

    const textCount = selected.questions.filter((q) => q.type === 'text').length;
    try {
      await addDoc(collection(db, 'examAttempts'), {
        examId: selected.id,
        studentId,
        level: studentLevel,
        answers,
        autoScore,
        total: selected.questions.length,
        textPending: textCount,
        submittedAt: new Date(),
        status: textCount ? 'pending_review' : 'graded',
      });
      setSubmitted(true);
      Alert.alert('تم التسليم', textCount ? `الدرجة التلقائية: ${autoScore}/${selected.questions.length}. الإجابات القصيرة بانتظار مراجعة المعلم.` : `درجتك: ${autoScore}/${selected.questions.length}`);
    } catch (error) {
      console.error(error);
      Alert.alert('خطأ', 'تعذر حفظ إجابتك. حاول مرة أخرى.');
    }
  };

  if (loading) {
    return <View style={styles.center}><ActivityIndicator size="large" /><Text style={styles.muted}>جاري تحميل الاختبارات...</Text></View>;
  }

  if (!selected) {
    return (
      <ScrollView contentContainerStyle={styles.container}>
        <Text style={styles.headerTitle}>اختبارات {studentLevel === 'first' ? 'الأول الثانوي' : studentLevel === 'second' ? 'الثاني الثانوي' : 'الثالث الثانوي'}</Text>
        <Text style={styles.subtitle}>تظهر هنا الاختبارات المنشورة لهذا الصف فقط.</Text>
        {exams.length ? exams.map((exam) => (
          <TouchableOpacity key={exam.id} style={styles.examCard} onPress={() => { setSelected(exam); setAnswers({}); setSubmitted(false); }}>
            <Text style={styles.examTitle}>{exam.title}</Text>
            <Text style={styles.examMeta}>{exam.questions?.length || 0} أسئلة • محاولة واحدة</Text>
          </TouchableOpacity>
        )) : <Text style={styles.empty}>لا توجد اختبارات منشورة حاليًا.</Text>}
      </ScrollView>
    );
  }

  return (
    <ScrollView contentContainerStyle={styles.container}>
      <Text style={styles.headerTitle}>{selected.title}</Text>
      <Text style={styles.subtitle}>الاختبار مخصص لمستواك الدراسي • محاولة واحدة</Text>

      {selected.questions.map((q, index) => {
        const type = q.type === 'multiple' ? 'multiple_choice' : q.type;
        return (
          <View style={styles.card} key={q.id || index}>
            <Text style={styles.type}>{TYPE_LABELS[type] || 'سؤال'}</Text>
            <Text style={styles.question}>{index + 1}. {q.questionText || q.text}</Text>

            {type === 'text' ? (
              <TextInput
                style={styles.textAnswer}
                multiline
                value={answers[index] || ''}
                onChangeText={(value) => selectAnswer(index, value)}
                placeholder="اكتب إجابة قصيرة"
                placeholderTextColor="#8b9ab0"
                textAlign="right"
                editable={!submitted}
              />
            ) : (
              (type === 'true_false' ? ['صح', 'خطأ'] : (q.options || [])).map((option) => (
                <TouchableOpacity
                  key={option}
                  style={[styles.option, answers[index] === option && styles.selectedOption]}
                  onPress={() => selectAnswer(index, option)}
                  disabled={submitted}
                >
                  <Text style={styles.optionText}>{option}</Text>
                </TouchableOpacity>
              ))
            )}
          </View>
        );
      })}

      {submitted ? (
        <View style={styles.resultBox}>
          <Text style={styles.resultTitle}>تم تسليم الاختبار ✓</Text>
          <Text style={styles.resultText}>الأسئلة الموضوعية صُححت تلقائيًا، والإجابات القصيرة ستظهر للمعلم للمراجعة والتقييم.</Text>
        </View>
      ) : (
        <TouchableOpacity style={styles.submitBtn} onPress={submit}>
          <Text style={styles.submitBtnText}>تسليم الاختبار</Text>
        </TouchableOpacity>
      )}
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { padding: 18, backgroundColor: '#f4f7fb', flexGrow: 1 },
  center: { flex: 1, alignItems: 'center', justifyContent: 'center', padding: 30, backgroundColor: '#f4f7fb' },
  muted: { color: '#66758c', marginTop: 10 },
  headerTitle: { fontSize: 23, fontWeight: '900', color: '#12233f', textAlign: 'right', marginBottom: 5 },
  subtitle: { fontSize: 13, color: '#66758c', textAlign: 'right', marginBottom: 16 },
  examCard: { backgroundColor: '#fff', borderRadius: 16, padding: 16, marginBottom: 10, borderWidth: 1, borderColor: '#e2e8f0' },
  examTitle: { color: '#12233f', fontSize: 17, fontWeight: '900', textAlign: 'right' },
  examMeta: { color: '#77869c', fontSize: 12, textAlign: 'right', marginTop: 5 },
  empty: { color: '#77869c', backgroundColor: '#fff', padding: 25, borderRadius: 15, textAlign: 'center' },
  card: { backgroundColor: '#fff', borderRadius: 17, padding: 16, marginBottom: 12 },
  type: { color: '#1f5eff', fontSize: 11, fontWeight: '800', textAlign: 'right', marginBottom: 7 },
  question: { color: '#12233f', fontSize: 17, fontWeight: '900', textAlign: 'right', lineHeight: 24, marginBottom: 12 },
  option: { borderWidth: 1, borderColor: '#dbe3ed', borderRadius: 10, padding: 13, marginBottom: 8 },
  selectedOption: { borderColor: '#1f5eff', backgroundColor: '#eaf0ff' },
  optionText: { color: '#12233f', textAlign: 'right', fontSize: 15 },
  textAnswer: { minHeight: 100, borderWidth: 1, borderColor: '#dbe3ed', borderRadius: 11, padding: 12, color: '#12233f', textAlignVertical: 'top' },
  submitBtn: { backgroundColor: '#0f9f76', padding: 16, borderRadius: 13, alignItems: 'center', marginVertical: 8 },
  submitBtnText: { color: '#fff', fontSize: 17, fontWeight: '900' },
  resultBox: { backgroundColor: '#e8f8f2', borderRadius: 14, padding: 16, marginTop: 5 },
  resultTitle: { color: '#0f9f76', fontSize: 17, fontWeight: '900', textAlign: 'right' },
  resultText: { color: '#245b4c', lineHeight: 22, textAlign: 'right', marginTop: 7 },
});
