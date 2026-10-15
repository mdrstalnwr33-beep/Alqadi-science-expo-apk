import React, { useEffect, useMemo, useState } from 'react';
import { Alert, ScrollView, StyleSheet, Text, TextInput, TouchableOpacity, View } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';

const LEVELS = { first: 'الأول الثانوي', second: 'الثاني الثانوي', third: 'الثالث الثانوي' };
const DATA_KEY = '@alqadi/data-v3';
const ATTEMPTS_KEY = '@alqadi/exam-attempts-v1';

const normalizeQuestion = (raw, index) => {
  const q = raw && typeof raw === 'object' ? raw : {};
  const type = q.type === 'multiple' || q.type === 'multiple_choice' ? 'multiple_choice' : (q.type || 'multiple_choice');
  const options = type === 'true_false' ? ['صح', 'خطأ'] : (Array.isArray(q.options) ? q.options.filter((x) => x !== null && x !== undefined).map(String) : []);
  return { id: q.id || `q-${index}`, type, text: String(q.text || q.questionText || 'سؤال'), options, answer: q.answer ?? q.correctAnswer ?? '' };
};

const normalizeExam = (raw, id) => {
  const x = raw && typeof raw === 'object' ? raw : {};
  const questions = Array.isArray(x.questions) ? x.questions.map(normalizeQuestion) : [];
  return { ...x, id: id || x.id || `exam-${Date.now()}`, title: String(x.title || 'اختبار شهري'), questions };
};

export default function StudentExamScreen({ studentLevel = 'first', studentId = 'guest', subject = 'chemistry', localItems = [], onBack }) {
  const [exams, setExams] = useState([]);
  const [attemptedIds, setAttemptedIds] = useState(new Set());
  const [selected, setSelected] = useState(null);
  const [answers, setAnswers] = useState({});
  const [submitted, setSubmitted] = useState(false);

  const mergeLocal = (items) => {
    const normalized = (Array.isArray(items) ? items : [])
      .map((x) => normalizeExam(x, x?.id))
      .filter((x) => x.questions.length && x.active !== false);
    setExams((old) => [...old.filter((x) => !normalized.some((n) => n.id === x.id)), ...normalized]);
  };

  useEffect(() => {
    mergeLocal(localItems);
    (async () => {
      try {
        const raw = await AsyncStorage.getItem(DATA_KEY);
        const data = raw ? JSON.parse(raw) : null;
        mergeLocal(data?.content?.[studentLevel]?.[subject]?.exams);
      } catch (_) {}
    })();
  }, [studentLevel, subject, localItems]);

  useEffect(() => {
    (async () => {
      try {
        const raw = await AsyncStorage.getItem(ATTEMPTS_KEY);
        const saved = raw ? JSON.parse(raw) : {};
        if (studentId && saved[studentId]) setAttemptedIds(new Set(saved[studentId]));
      } catch (_) {}
    })();
  }, [studentId]);

  const questions = useMemo(() => selected && Array.isArray(selected.questions) ? selected.questions.map(normalizeQuestion) : [], [selected]);
  const choose = (i, value) => setAnswers((old) => ({ ...old, [i]: value }));

  const submit = async () => {
    if (!selected || !questions.length) return;
    if (attemptedIds.has(selected.id)) return Alert.alert('تم التسليم مسبقًا', 'لا يمكنك إعادة الاختبار مرة أخرى.');
    if (questions.some((q, i) => q.type !== 'text' && !answers[i])) return Alert.alert('تنبيه', 'أجب عن جميع الأسئلة الموضوعية.');
    let score = 0;
    questions.forEach((q, i) => { if (q.type !== 'text' && String(answers[i]) === String(q.answer)) score += 1; });
    const nextAttempted = new Set([...attemptedIds, selected.id]);
    setAttemptedIds(nextAttempted);
    try {
      const raw = await AsyncStorage.getItem(ATTEMPTS_KEY);
      const saved = raw ? JSON.parse(raw) : {};
      saved[studentId || 'guest'] = [...nextAttempted];
      await AsyncStorage.setItem(ATTEMPTS_KEY, JSON.stringify(saved));
    } catch (_) {}
    setSubmitted(true);
    Alert.alert('تم التسليم', `درجتك التلقائية: ${score}/${questions.length}`);
  };

  if (selected) {
    return (
      <ScrollView contentContainerStyle={styles.container}>
        <View style={styles.headerRow}>
          <TouchableOpacity onPress={() => setSelected(null)}><Text style={styles.back}>رجوع</Text></TouchableOpacity>
          <View style={styles.headerCopy}><Text style={styles.title}>{selected.title}</Text><Text style={styles.meta}>{LEVELS[studentLevel] || studentLevel} • {subject}</Text></View>
        </View>
        {questions.map((q, i) => (
          <View style={styles.card} key={q.id || i}>
            <Text style={styles.question}>س{i + 1}: {q.text}</Text>
            {q.type === 'text' ? (
              <TextInput style={styles.textInput} multiline value={answers[i] || ''} onChangeText={(v) => choose(i, v)} placeholder="اكتب إجابتك" textAlign="right" />
            ) : (q.options.length ? q.options : ['صح', 'خطأ']).map((opt, j) => (
              <TouchableOpacity key={`${String(opt)}-${j}`} style={[styles.option, answers[i] === opt && styles.selected]} onPress={() => choose(i, opt)}>
                <Text style={styles.optionText}>{answers[i] === opt ? '● ' : '○ '}{String(opt)}</Text>
              </TouchableOpacity>
            ))}
          </View>
        ))}
        {submitted ? <Text style={styles.done}>تم تسليم الاختبار، ولا يمكن إعادة المحاولة.</Text> : <TouchableOpacity style={styles.submit} onPress={submit}><Text style={styles.submitText}>تسليم الاختبار النهائي 📝</Text></TouchableOpacity>}
      </ScrollView>
    );
  }

  return (
    <ScrollView contentContainerStyle={styles.container}>
      <View style={styles.headerRow}>
        <TouchableOpacity onPress={onBack}><Text style={styles.back}>رجوع</Text></TouchableOpacity>
        <View style={styles.headerCopy}><Text style={styles.title}>الاختبارات الشهرية</Text><Text style={styles.meta}>{LEVELS[studentLevel] || studentLevel} • {subject}</Text></View>
      </View>
      {exams.map((exam) => (
        <View style={styles.card} key={exam.id}>
          <Text style={styles.examTitle}>{exam.title}</Text>
          <Text style={styles.meta}>{exam.questions.length} أسئلة • محاولة واحدة</Text>
          <TouchableOpacity style={[styles.open, attemptedIds.has(exam.id) && styles.disabled]} disabled={attemptedIds.has(exam.id)} onPress={() => { setSelected(exam); setAnswers({}); setSubmitted(false); }}>
            <Text style={styles.openText}>{attemptedIds.has(exam.id) ? 'تم التسليم' : 'بدء الاختبار'}</Text>
          </TouchableOpacity>
        </View>
      ))}
      {!exams.length ? <View style={styles.card}><Text style={styles.notice}>لا توجد اختبارات منشورة لهذا الصف والمادة حاليًا.</Text></View> : null}
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { flexGrow: 1, padding: 18, backgroundColor: '#f4f7fb' },
  headerRow: { flexDirection: 'row-reverse', alignItems: 'center', marginBottom: 14 },
  headerCopy: { flex: 1, alignItems: 'flex-end' },
  title: { color: '#12233f', fontSize: 22, fontWeight: '900', textAlign: 'right' },
  meta: { color: '#77869c', textAlign: 'right', marginTop: 4 },
  back: { color: '#1f5eff', fontWeight: '900', padding: 10 },
  notice: { backgroundColor: '#fff5d8', color: '#8a5a00', padding: 14, borderRadius: 12, textAlign: 'right', marginBottom: 10 },
  card: { backgroundColor: '#fff', borderRadius: 16, padding: 15, marginBottom: 12 },
  examTitle: { color: '#12233f', fontSize: 17, fontWeight: '900', textAlign: 'right' },
  question: { color: '#12233f', fontSize: 17, fontWeight: '900', textAlign: 'right', lineHeight: 24, marginBottom: 12 },
  option: { borderWidth: 1, borderColor: '#dbe3ed', borderRadius: 10, padding: 13, marginBottom: 8 },
  selected: { borderColor: '#1f5eff', backgroundColor: '#eaf0ff' },
  optionText: { color: '#12233f', textAlign: 'right', fontSize: 15 },
  textInput: { minHeight: 100, borderWidth: 1, borderColor: '#dbe3ed', borderRadius: 10, padding: 12, color: '#12233f', textAlignVertical: 'top' },
  open: { backgroundColor: '#dc4163', padding: 13, borderRadius: 10, marginTop: 10, alignItems: 'center' },
  disabled: { backgroundColor: '#94a3b8' },
  openText: { color: '#fff', fontWeight: '900' },
  submit: { backgroundColor: '#0f9f76', padding: 16, borderRadius: 12, alignItems: 'center' },
  submitText: { color: '#fff', fontWeight: '900', fontSize: 16 },
  done: { color: '#0f9f76', backgroundColor: '#e8f8f2', padding: 15, borderRadius: 12, textAlign: 'right' },
});
