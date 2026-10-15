import React, { useEffect, useState } from 'react';
import { Alert, ScrollView, StyleSheet, Text, TextInput, TouchableOpacity, View } from 'react-native';
import { collection, getDocs, query, updateDoc, doc, where } from 'firebase/firestore';
import { db, firebaseReady } from './firebaseConfig';

const normalizeAnswers = (answers) => {
  if (Array.isArray(answers)) return answers;
  if (answers && typeof answers === 'object') return Object.keys(answers).sort((a, b) => Number(a) - Number(b)).map((key, index) => ({ questionId: String(key), answer: answers[key], index }));
  return [];
};

export default function TeacherHomeworkReviewScreen({ studentLevel, subject }) {
  const [items, setItems] = useState([]);
  const [busy, setBusy] = useState(false);
  const [drafts, setDrafts] = useState({});

  const load = async () => {
    if (!firebaseReady || !db) {
      Alert.alert('تنبيه', 'Firebase غير متاح حاليًا.');
      return;
    }
    try {
      const snap = await getDocs(query(collection(db, 'homeworkSubmissions'), where('studentLevel', '==', studentLevel), where('subject', '==', subject)));
      setItems(snap.docs.map((d) => ({ id: d.id, ...d.data(), answers: normalizeAnswers(d.data().answers) })));
    } catch (e) { Alert.alert('تنبيه', 'تعذر تحميل تسليمات الواجبات.'); }
  };
  useEffect(() => { load(); }, [studentLevel, subject]);

  const review = async (item) => {
    const draft = drafts[item.id] || {};
    if (draft.score === undefined || draft.score === '') return Alert.alert('تنبيه', 'أدخل الدرجة أولًا.');
    if (!firebaseReady || !db) return Alert.alert('تنبيه', 'Firebase غير متاح حاليًا.');
    setBusy(true);
    try {
      await updateDoc(doc(db, 'homeworkSubmissions', item.id), { score: Number(draft.score), teacherComment: draft.comment || '', status: 'reviewed', reviewedAt: new Date() });
      setItems((old) => old.map((x) => x.id === item.id ? { ...x, score: Number(draft.score), teacherComment: draft.comment || '', status: 'reviewed' } : x));
      Alert.alert('تم الحفظ', 'تم اعتماد درجة وملاحظة الطالب.');
    } catch (e) { Alert.alert('خطأ', 'تعذر حفظ المراجعة.'); }
    finally { setBusy(false); }
  };

  return <ScrollView contentContainerStyle={styles.container}>
    <Text style={styles.title}>مراجعة الواجبات</Text>
    <Text style={styles.meta}>{subject} • {studentLevel}</Text>
    {items.length ? items.map((item) => {
      const draft = drafts[item.id] || {};
      return <View style={styles.card} key={item.id}>
        <Text style={styles.heading}>الطالب: {item.studentId}</Text>
        <Text style={styles.status}>الحالة: {item.status === 'reviewed' ? 'تمت المراجعة' : 'بانتظار المراجعة'}</Text>
        {normalizeAnswers(item.answers).map((a, i) => <View style={styles.answer} key={a.questionId || i}><Text style={styles.q}>السؤال {i + 1}</Text><Text style={styles.answerText}>{a.answer || '—'}</Text></View>)}
        {item.imageUri ? <Text style={styles.attachment}>📷 مرفق: {item.imageName || 'صورة الحل'}</Text> : null}
        <TextInput style={styles.input} keyboardType="numeric" value={draft.score !== undefined ? String(draft.score) : item.score == null ? '' : String(item.score)} onChangeText={(v) => setDrafts((old) => ({ ...old, [item.id]: { ...old[item.id], score: v } }))} placeholder="الدرجة" placeholderTextColor="#8b9ab0" textAlign="right" />
        <TextInput style={[styles.input, styles.comment]} multiline value={draft.comment !== undefined ? draft.comment : item.teacherComment || ''} onChangeText={(v) => setDrafts((old) => ({ ...old, [item.id]: { ...old[item.id], comment: v } }))} placeholder="ملاحظة المعلم" placeholderTextColor="#8b9ab0" textAlign="right" />
        <TouchableOpacity style={styles.button} onPress={() => review(item)} disabled={busy}><Text style={styles.buttonText}>اعتماد الدرجة والملاحظة</Text></TouchableOpacity>
      </View>;
    }) : <Text style={styles.empty}>لا توجد تسليمات لهذا الصف والمادة.</Text>}
  </ScrollView>;
}
const styles = StyleSheet.create({ container:{padding:18,backgroundColor:'#f4f7fb',flexGrow:1},title:{fontSize:23,fontWeight:'900',color:'#12233f',textAlign:'right',marginBottom:5},meta:{color:'#64748b',textAlign:'right',marginBottom:14},card:{backgroundColor:'#fff',borderRadius:16,padding:15,marginBottom:12},heading:{fontWeight:'900',color:'#12233f',textAlign:'right'},status:{color:'#0f9f76',textAlign:'right',marginVertical:7},answer:{backgroundColor:'#f8fafc',borderRadius:10,padding:10,marginTop:7},q:{fontWeight:'800',color:'#475569',textAlign:'right'},answerText:{color:'#12233f',textAlign:'right',marginTop:4},attachment:{color:'#1d4ed8',textAlign:'right',marginTop:10},input:{height:50,borderWidth:1,borderColor:'#dbe3ed',borderRadius:11,padding:12,color:'#12233f',marginTop:10},comment:{height:85,textAlignVertical:'top'},button:{backgroundColor:'#7c3aed',padding:14,borderRadius:11,alignItems:'center',marginTop:10},buttonText:{color:'#fff',fontWeight:'900'},empty:{backgroundColor:'#fff',padding:25,borderRadius:15,textAlign:'center',color:'#64748b'} });
