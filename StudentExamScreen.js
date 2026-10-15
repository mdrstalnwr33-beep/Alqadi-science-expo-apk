import React, { useEffect, useMemo, useState } from 'react';
import { ActivityIndicator, Alert, ScrollView, StyleSheet, Text, TextInput, TouchableOpacity, View } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { addDoc, collection, getDocs, query, where } from 'firebase/firestore';
import { db, firebaseReady } from './src/firebaseConfig';

const LEVELS = { first: 'الأول الثانوي', second: 'الثاني الثانوي', third: 'الثالث الثانوي' };
const ATTEMPTS_KEY = '@alqadi/exam-attempts-v1';
const normalizeQuestion = (raw, index) => {
  const q = raw && typeof raw === 'object' ? raw : {};
  const type = q.type === 'multiple' || q.type === 'multiple_choice' ? 'multiple_choice' : (q.type || 'multiple_choice');
  const options = type === 'true_false' ? ['صح', 'خطأ'] : (Array.isArray(q.options) ? q.options.filter((x) => x !== null && x !== undefined).map(String) : []);
  return { id: q.id || `q-${index}`, type, text: String(q.text || q.questionText || 'سؤال'), options, answer: q.answer ?? q.correctAnswer ?? '' };
};
const normalizeExam = (raw, id) => { const x = raw && typeof raw === 'object' ? raw : {}; const questions = Array.isArray(x.questions) ? x.questions.map(normalizeQuestion) : []; return { ...x, id: id || x.id || `exam-${Date.now()}`, title: String(x.title || 'اختبار شهري'), questions }; };

export default function StudentExamScreen({ studentLevel = 'first', studentId = 'guest', subject = 'chemistry', localItems = [], onBack }) {
  const localExams = useMemo(() => (Array.isArray(localItems) ? localItems : []).map((x) => normalizeExam(x, x?.id)).filter((x) => x.questions.length), [localItems]);
  const [exams, setExams] = useState(localExams);
  const [attemptedIds, setAttemptedIds] = useState(new Set());
  const [selected, setSelected] = useState(null);
  const [answers, setAnswers] = useState({});
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState('');
  const [submitted, setSubmitted] = useState(false);

  useEffect(() => { setExams(localExams); }, [localExams]);

  useEffect(() => {
    let alive = true;
    const load = async () => {
      // Restore one-attempt state locally first so the screen never depends on Firebase just to open.
      try {
        const raw = await AsyncStorage.getItem(ATTEMPTS_KEY);
        const saved = raw ? JSON.parse(raw) : {};
        if (alive && studentId && saved[studentId]) setAttemptedIds(new Set(saved[studentId]));
      } catch (_) {}

      if (!firebaseReady || !db) return;
      try {
        setLoading(true);
        const rows = [];
        const queries = [
          query(collection(db, 'exams'), where('level', '==', studentLevel)),
          query(collection(db, 'exams'), where('studentLevel', '==', studentLevel)),
        ];
        for (const q of queries) {
          try {
            const snap = await getDocs(q);
            rows.push(...snap.docs.map((d) => normalizeExam(d.data(), d.id)));
          } catch (_) {}
        }
        if (!alive) return;
        const cloud = rows
          .filter((x) => x.active !== false && x.questions.length && (!x.subject || x.subject === subject))
          .filter((x, i, a) => a.findIndex((y) => y.id === x.id) === i);
        if (cloud.length) setExams((old) => [...old.filter((x) => !cloud.some((c) => c.id === x.id)), ...cloud]);

        if (studentId && studentId !== 'guest') {
          try {
            const sub = await getDocs(query(collection(db, 'examAttempts'), where('studentId', '==', studentId)));
            const cloudIds = sub.docs.map((d) => d.data()?.examId).filter(Boolean);
            if (cloudIds.length) setAttemptedIds((old) => new Set([...old, ...cloudIds]));
          } catch (_) {}
        }
      } catch (_) {
        // Local exams remain usable even when Firestore is unavailable.
      } finally {
        if (alive) setLoading(false);
      }
    };
    load();
    return () => { alive = false; };
  }, [studentLevel, studentId, subject]);

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

    if (firebaseReady && db && studentId && studentId !== 'guest') {
      try {
        await addDoc(collection(db, 'examAttempts'), { examId: selected.id, studentId, level: studentLevel, subject, answers, autoScore: score, total: questions.length, submittedAt: new Date(), status: questions.some((q) => q.type === 'text') ? 'pending_review' : 'graded' });
      } catch (_) {
        // The local one-attempt record is already saved; Firebase can sync later.
      }
    }
    setSubmitted(true);
    Alert.alert('تم التسليم', `درجتك التلقائية: ${score}/${questions.length}`);
  };

  if (loading && !exams.length) return <View style={styles.center}><ActivityIndicator color="#dc4163" /><Text style={styles.muted}>جاري تحميل الاختبارات...</Text></View>;
  if (selected) return <ScrollView contentContainerStyle={styles.container}><View style={styles.headerRow}><TouchableOpacity onPress={() => setSelected(null)}><Text style={styles.back}>رجوع</Text></TouchableOpacity><View style={styles.headerCopy}><Text style={styles.title}>{selected.title}</Text><Text style={styles.meta}>{LEVELS[studentLevel] || studentLevel} • {subject}</Text></View></View>{questions.map((q, i) => <View style={styles.card} key={q.id || i}><Text style={styles.question}>س{i + 1}: {q.text}</Text>{q.type === 'text' ? <TextInput style={styles.textInput} multiline value={answers[i] || ''} onChangeText={(v) => choose(i, v)} placeholder="اكتب إجابتك" textAlign="right" /> : (q.options.length ? q.options : ['صح', 'خطأ']).map((opt, j) => <TouchableOpacity key={`${String(opt)}-${j}`} style={[styles.option, answers[i] === opt && styles.selected]} onPress={() => choose(i, opt)}><Text style={styles.optionText}>{answers[i] === opt ? '● ' : '○ '}{String(opt)}</Text></TouchableOpacity>)}</View>)}{submitted ? <Text style={styles.done}>تم تسليم الاختبار، ولا يمكن إعادة المحاولة.</Text> : <TouchableOpacity style={styles.submit} onPress={submit}><Text style={styles.submitText}>تسليم الاختبار النهائي 📝</Text></TouchableOpacity>}</ScrollView>;
  return <ScrollView contentContainerStyle={styles.container}><View style={styles.headerRow}><TouchableOpacity onPress={onBack}><Text style={styles.back}>رجوع</Text></TouchableOpacity><View style={styles.headerCopy}><Text style={styles.title}>الاختبارات الشهرية</Text><Text style={styles.meta}>{LEVELS[studentLevel] || studentLevel} • {subject}</Text></View></View>{message ? <Text style={styles.notice}>{message}</Text> : null}{exams.map((exam) => <View style={styles.card} key={exam.id}><Text style={styles.examTitle}>{exam.title}</Text><Text style={styles.meta}>{exam.questions.length} أسئلة • محاولة واحدة</Text><TouchableOpacity style={[styles.open, attemptedIds.has(exam.id) && styles.disabled]} disabled={attemptedIds.has(exam.id)} onPress={() => { setSelected(exam); setAnswers({}); setSubmitted(false); }}><Text style={styles.openText}>{attemptedIds.has(exam.id) ? 'تم التسليم' : 'بدء الاختبار'}</Text></TouchableOpacity></View>)}{!exams.length ? <View style={styles.card}><Text style={styles.notice}>لا توجد اختبارات منشورة لهذا الصف والمادة حاليًا.</Text></View> : null}</ScrollView>;
}
const styles = StyleSheet.create({ container: { flexGrow: 1, padding: 18, backgroundColor: '#f4f7fb' }, center: { flex: 1, justifyContent: 'center', alignItems: 'center', padding: 30, backgroundColor: '#f4f7fb' }, muted: { color: '#77869c', marginTop: 10 }, headerRow: { flexDirection: 'row-reverse', alignItems: 'center', marginBottom: 14 }, headerCopy: { flex: 1, alignItems: 'flex-end' }, title: { color: '#12233f', fontSize: 22, fontWeight: '900', textAlign: 'right' }, meta: { color: '#77869c', textAlign: 'right', marginTop: 4 }, back: { color: '#1f5eff', fontWeight: '900', padding: 10 }, notice: { backgroundColor: '#fff5d8', color: '#8a5a00', padding: 14, borderRadius: 12, textAlign: 'right', marginBottom: 10 }, card: { backgroundColor: '#fff', borderRadius: 16, padding: 15, marginBottom: 12 }, examTitle: { color: '#12233f', fontSize: 17, fontWeight: '900', textAlign: 'right' }, question: { color: '#12233f', fontSize: 17, fontWeight: '900', textAlign: 'right', lineHeight: 24, marginBottom: 12 }, option: { borderWidth: 1, borderColor: '#dbe3ed', borderRadius: 10, padding: 13, marginBottom: 8 }, selected: { borderColor: '#1f5eff', backgroundColor: '#eaf0ff' }, optionText: { color: '#12233f', textAlign: 'right', fontSize: 15 }, textInput: { minHeight: 100, borderWidth: 1, borderColor: '#dbe3ed', borderRadius: 10, padding: 12, color: '#12233f', textAlignVertical: 'top' }, open: { backgroundColor: '#dc4163', padding: 13, borderRadius: 10, marginTop: 10, alignItems: 'center' }, disabled: { backgroundColor: '#94a3b8' }, openText: { color: '#fff', fontWeight: '900' }, submit: { backgroundColor: '#0f9f76', padding: 16, borderRadius: 12, alignItems: 'center' }, submitText: { color: '#fff', fontWeight: '900', fontSize: 16 }, done: { color: '#0f9f76', backgroundColor: '#e8f8f2', padding: 15, borderRadius: 12, textAlign: 'right' },
});
