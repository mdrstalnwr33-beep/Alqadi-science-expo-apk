import React, { useEffect, useState } from 'react';
import { Alert, ScrollView, StyleSheet, Text, TextInput, TouchableOpacity, View } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { collection, doc, getDocs, query, serverTimestamp, setDoc, where } from 'firebase/firestore';
import { db, firebaseReady } from './firebaseConfig';

const ANSWERS_CACHE = '@alqadi/homework-answers-v1';
const normalizeAnswers = (answers, questions = []) => questions.map((q, i) => ({ questionId: q.id || String(i), answer: answers?.[i] || '' }));

export default function StudentHomeworkScreen({ studentId, studentLevel = 'first', subject = 'chemistry' }) {
  const [items, setItems] = useState([]); const [submitted, setSubmitted] = useState({}); const [selected, setSelected] = useState(null); const [answers, setAnswers] = useState({}); const [busy, setBusy] = useState(false);
  const load = async () => {
    try {
      if (!firebaseReady || !db) throw new Error('firebase-offline');
      const snap = await getDocs(query(collection(db, 'homeworks'), where('studentLevel', '==', studentLevel), where('subject', '==', subject)));
      setItems(snap.docs.map((d) => ({ id: d.id, ...d.data() })));
      if (studentId) {
        const sub = await getDocs(query(collection(db, 'homeworkSubmissions'), where('studentId', '==', studentId)));
        const map = {}; sub.docs.forEach((d) => { const x = d.data(); map[x.homeworkId] = true; }); setSubmitted(map);
      }
    } catch (e) {
      // Keep the screen usable when Firebase is temporarily unavailable.
      try {
        const raw = await AsyncStorage.getItem(ANSWERS_CACHE);
        const cached = raw ? JSON.parse(raw) : {};
        setSubmitted(cached[studentId] || {});
      } catch (_) {}
    }
  };
  useEffect(() => { load(); }, [studentId, studentLevel, subject]);
  const current = items.find((x) => x.id === selected);
  const submit = async () => {
    if (!current || submitted[current.id]) return Alert.alert('تم التسليم', 'لا يمكن إعادة إرسال هذا الواجب.');
    const questions = current.questions || [];
    if (questions.some((q, i) => q.type !== 'text' && !answers[i])) return Alert.alert('تنبيه', 'أجب عن كل الأسئلة الموضوعية.');
    setBusy(true);
    try {
      if (!firebaseReady || !db) throw new Error('firebase-offline');
      const id = `${studentId}_${current.id}`;
      const score = questions.reduce((n, q, i) => q.type !== 'text' && answers[i] === q.answer ? n + 1 : n, 0);
      await setDoc(doc(db, 'homeworkSubmissions', id), { homeworkId: current.id, studentId, studentLevel, subject, answers: normalizeAnswers(answers, questions), score, total: questions.length, status: questions.some((q) => q.type === 'text') ? 'pending_review' : 'graded', submittedAt: serverTimestamp(), locked: true });
      setSubmitted((old) => ({ ...old, [current.id]: true }));
      setSelected(null); setAnswers({});
      Alert.alert('تم التسليم', `تم حفظ الإجابة. الدرجة التلقائية: ${score}/${questions.length}`);
    } catch (e) {
      // Do not pretend that a local-only submission was sent to the teacher.
      Alert.alert('تعذر الإرسال', 'لا يوجد اتصال بقاعدة البيانات. لم يتم احتساب الواجب كمرسل.');
    } finally { setBusy(false); }
  };
  if (current) return <ScrollView contentContainerStyle={styles.container}><Text style={styles.title}>{current.title}</Text><Text style={styles.meta}>{subject} • {studentLevel}</Text>{current.note ? <View style={styles.note}><Text style={styles.noteText}>{current.note}</Text></View> : null}{(current.questions || []).map((q, i) => <View style={styles.card} key={q.id || i}><Text style={styles.question}>س{i + 1}: {q.text}</Text>{q.type === 'text' ? <TextInput style={styles.textAnswer} multiline value={answers[i] || ''} onChangeText={(v) => setAnswers((old) => ({ ...old, [i]: v }))} placeholder="اكتب إجابتك" placeholderTextColor="#8b9ab0" textAlign="right" /> : (q.type === 'true_false' ? ['صح', 'خطأ'] : q.options || []).map((opt) => <TouchableOpacity key={opt} style={[styles.option, answers[i] === opt && styles.selected]} onPress={() => setAnswers((old) => ({ ...old, [i]: opt }))}><Text style={styles.optionText}>{answers[i] === opt ? '● ' : '○ '}{opt}</Text></TouchableOpacity>)}</View>)}<TouchableOpacity style={styles.submit} onPress={submit} disabled={busy}><Text style={styles.submitText}>{busy ? 'جارٍ الحفظ...' : 'تسليم الواجب مرة واحدة'}</Text></TouchableOpacity><TouchableOpacity style={styles.back} onPress={() => setSelected(null)}><Text style={styles.backText}>رجوع للواجبات</Text></TouchableOpacity></ScrollView>;
  return <ScrollView contentContainerStyle={styles.container}><Text style={styles.title}>واجبات {subject}</Text>{items.length ? items.map((item) => <View style={styles.card} key={item.id}><Text style={styles.homeworkTitle}>{item.title}</Text><Text style={styles.meta}>{item.note || 'واجب تفاعلي'} • {(item.questions || []).length} أسئلة</Text><TouchableOpacity style={[styles.open, submitted[item.id] && styles.done]} disabled={submitted[item.id]} onPress={() => { setSelected(item.id); setAnswers({}); }}><Text style={styles.openText}>{submitted[item.id] ? '✓ تم التسليم — مغلق' : 'فتح والإجابة'}</Text></TouchableOpacity></View>) : <Text style={styles.empty}>لا يوجد واجب منشور لهذا الصف والمادة.</Text>}</ScrollView>;
}
const styles = StyleSheet.create({ container: { padding: 18, backgroundColor: '#f4f7fb', flexGrow: 1 }, title: { color: '#12233f', fontSize: 23, fontWeight: '900', textAlign: 'right', marginBottom: 6 }, meta: { color: '#77869c', textAlign: 'right', marginBottom: 8 }, card: { backgroundColor: '#fff', borderRadius: 16, padding: 15, marginBottom: 12 }, homeworkTitle: { color: '#12233f', fontSize: 17, fontWeight: '900', textAlign: 'right', marginBottom: 7 }, question: { color: '#12233f', fontWeight: '900', textAlign: 'right', lineHeight: 23, marginBottom: 12 }, option: { borderWidth: 1, borderColor: '#dbe3ed', borderRadius: 10, padding: 13, marginBottom: 8 }, selected: { borderColor: '#1f5eff', backgroundColor: '#eaf0ff' }, optionText: { color: '#12233f', textAlign: 'right', fontSize: 15 }, textAnswer: { minHeight: 100, borderWidth: 1, borderColor: '#dbe3ed', borderRadius: 11, padding: 12, color: '#12233f', textAlignVertical: 'top' }, note: { backgroundColor: '#fff5d8', padding: 12, borderRadius: 12, marginVertical: 10 }, noteText: { color: '#8a5a00', textAlign: 'right' }, open: { backgroundColor: '#1f5eff', padding: 13, borderRadius: 10, marginTop: 10, alignItems: 'center' }, done: { backgroundColor: '#64748b' }, openText: { color: '#fff', fontWeight: '900' }, submit: { backgroundColor: '#0f9f76', padding: 16, borderRadius: 13, alignItems: 'center' }, submitText: { color: '#fff', fontSize: 16, fontWeight: '900' }, back: { padding: 16, alignItems: 'center' }, backText: { color: '#66758c', fontWeight: '800' }, empty: { backgroundColor: '#fff', padding: 25, borderRadius: 16, textAlign: 'center', color: '#77869c' } });
