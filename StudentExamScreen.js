import React, { useEffect, useState } from 'react';
import { Alert, ScrollView, StyleSheet, Text, TextInput, TouchableOpacity, View } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';

const LEVELS = { first: 'الأول الثانوي', second: 'الثاني الثانوي', third: 'الثالث الثانوي' };
const DATA_KEY = '@alqadi/data-v3';
const ATTEMPTS_KEY = '@alqadi/exam-attempts-v1';

function normalizeQuestion(raw, index) {
  const q = raw && typeof raw === 'object' ? raw : {};
  const type = q.type === 'text' ? 'text' : (q.type === 'true_false' ? 'true_false' : 'multiple_choice');
  const options = type === 'true_false' ? ['صح', 'خطأ'] : (Array.isArray(q.options) ? q.options.map(String) : []);
  return { id: String(q.id || `q-${index}`), type, text: String(q.text || q.questionText || 'سؤال'), options, answer: q.answer ?? q.correctAnswer ?? '' };
}

function normalizeExam(raw, index) {
  const x = raw && typeof raw === 'object' ? raw : {};
  return { ...x, id: String(x.id || `exam-${index}`), title: String(x.title || 'اختبار شهري'), questions: Array.isArray(x.questions) ? x.questions.map(normalizeQuestion) : [] };
}

export default function StudentExamScreen({ studentLevel = 'first', studentId = 'guest', subject = 'chemistry', localItems = [], onBack }) {
  const [exams, setExams] = useState([]);
  const [attempted, setAttempted] = useState({});
  const [selected, setSelected] = useState(null);
  const [answers, setAnswers] = useState({});

  useEffect(() => {
    let alive = true;
    (async () => {
      let items = Array.isArray(localItems) ? localItems : [];
      try {
        const raw = await AsyncStorage.getItem(DATA_KEY);
        const data = raw ? JSON.parse(raw) : null;
        const cached = data?.content?.[studentLevel]?.[subject]?.exams;
        if (Array.isArray(cached)) items = cached;
        const attemptsRaw = await AsyncStorage.getItem(ATTEMPTS_KEY);
        const allAttempts = attemptsRaw ? JSON.parse(attemptsRaw) : {};
        if (alive) setAttempted(allAttempts?.[studentId] || {});
      } catch (_) {}
      const normalized = items.map(normalizeExam).filter((x) => x.questions.length && x.active !== false);
      if (alive) setExams(normalized);
    })();
    return () => { alive = false; };
  }, [studentLevel, studentId, subject]);

  const choose = (index, value) => setAnswers((old) => ({ ...old, [index]: value }));

  const submit = async () => {
    if (!selected) return;
    if (attempted[selected.id]) return Alert.alert('تم التسليم مسبقًا', 'لا يمكنك إعادة الاختبار مرة أخرى.');
    const questions = selected.questions;
    if (questions.some((q, i) => q.type !== 'text' && !answers[i])) return Alert.alert('تنبيه', 'أجب عن جميع الأسئلة الموضوعية.');
    let score = 0;
    questions.forEach((q, i) => { if (q.type !== 'text' && String(answers[i]) === String(q.answer)) score += 1; });
    const next = { ...attempted, [selected.id]: true };
    setAttempted(next);
    try {
      const raw = await AsyncStorage.getItem(ATTEMPTS_KEY);
      const all = raw ? JSON.parse(raw) : {};
      all[studentId] = next;
      await AsyncStorage.setItem(ATTEMPTS_KEY, JSON.stringify(all));
    } catch (_) {}
    Alert.alert('تم التسليم', `درجتك التلقائية: ${score}/${questions.length}`);
    setSelected(null);
    setAnswers({});
  };

  if (selected) return (
    <ScrollView contentContainerStyle={styles.container}>
      <View style={styles.headerRow}><TouchableOpacity onPress={() => setSelected(null)}><Text style={styles.back}>رجوع</Text></TouchableOpacity><View style={styles.headerCopy}><Text style={styles.title}>{selected.title}</Text><Text style={styles.meta}>{LEVELS[studentLevel] || studentLevel} • {subject}</Text></View></View>
      {selected.questions.map((q, i) => <View style={styles.card} key={q.id || i}><Text style={styles.question}>س{i + 1}: {q.text}</Text>{q.type === 'text' ? <TextInput style={styles.textInput} multiline value={answers[i] || ''} onChangeText={(v) => choose(i, v)} placeholder="اكتب إجابتك" textAlign="right"/> : (q.options.length ? q.options : ['صح', 'خطأ']).map((opt, j) => <TouchableOpacity key={`${opt}-${j}`} style={[styles.option, answers[i] === opt && styles.selected]} onPress={() => choose(i, opt)}><Text style={styles.optionText}>{answers[i] === opt ? '● ' : '○ '}{opt}</Text></TouchableOpacity>)}</View>)}
      <TouchableOpacity style={styles.submit} onPress={submit}><Text style={styles.submitText}>تسليم الاختبار النهائي 📝</Text></TouchableOpacity>
    </ScrollView>
  );

  return <ScrollView contentContainerStyle={styles.container}>
    <View style={styles.headerRow}><TouchableOpacity onPress={onBack}><Text style={styles.back}>رجوع</Text></TouchableOpacity><View style={styles.headerCopy}><Text style={styles.title}>الاختبارات الشهرية</Text><Text style={styles.meta}>{LEVELS[studentLevel] || studentLevel} • {subject}</Text></View></View>
    {exams.map((exam) => <View style={styles.card} key={exam.id}><Text style={styles.examTitle}>{exam.title}</Text><Text style={styles.meta}>{exam.questions.length} أسئلة • محاولة واحدة</Text><TouchableOpacity disabled={!!attempted[exam.id]} style={[styles.open, attempted[exam.id] && styles.disabled]} onPress={() => { setSelected(exam); setAnswers({}); }}><Text style={styles.openText}>{attempted[exam.id] ? 'تم التسليم' : 'بدء الاختبار'}</Text></TouchableOpacity></View>)}
    {!exams.length ? <View style={styles.card}><Text style={styles.notice}>لا توجد اختبارات منشورة لهذا الصف والمادة حاليًا.</Text></View> : null}
  </ScrollView>;
}

const styles = StyleSheet.create({
  container:{flexGrow:1,padding:18,backgroundColor:'#f4f7fb'},headerRow:{flexDirection:'row-reverse',alignItems:'center',marginBottom:14},headerCopy:{flex:1,alignItems:'flex-end'},title:{color:'#12233f',fontSize:22,fontWeight:'900',textAlign:'right'},meta:{color:'#77869c',textAlign:'right',marginTop:4},back:{color:'#1f5eff',fontWeight:'900',padding:10},card:{backgroundColor:'#fff',borderRadius:16,padding:15,marginBottom:12},examTitle:{color:'#12233f',fontSize:17,fontWeight:'900',textAlign:'right'},question:{color:'#12233f',fontSize:17,fontWeight:'900',textAlign:'right',lineHeight:24,marginBottom:12},option:{borderWidth:1,borderColor:'#dbe3ed',borderRadius:10,padding:13,marginBottom:8},selected:{borderColor:'#1f5eff',backgroundColor:'#eaf0ff'},optionText:{color:'#12233f',textAlign:'right',fontSize:15},textInput:{minHeight:100,borderWidth:1,borderColor:'#dbe3ed',borderRadius:10,padding:12,color:'#12233f',textAlignVertical:'top'},open:{backgroundColor:'#dc4163',padding:13,borderRadius:10,marginTop:10,alignItems:'center'},disabled:{backgroundColor:'#94a3b8'},openText:{color:'#fff',fontWeight:'900'},submit:{backgroundColor:'#0f9f76',padding:16,borderRadius:12,alignItems:'center'},submitText:{color:'#fff',fontWeight:'900',fontSize:16},notice:{backgroundColor:'#fff5d8',color:'#8a5a00',padding:14,borderRadius:12,textAlign:'right'}
});
