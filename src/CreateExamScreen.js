import React, { useState } from 'react';
import { 
  StyleSheet, Text, View, TextInput, 
  TouchableOpacity, Alert, ScrollView 
} from 'react-native';
import { db } from './firebaseConfig';
import { collection, addDoc, serverTimestamp } from 'firebase/firestore';

export default function CreateExamScreen() {
  const [title, setTitle] = useState('');
  const [questionText, setQuestionText] = useState('');
  const [studentLevel, setStudentLevel] = useState('الأول الثانوي');

  const publishExam = async () => {
    if (!title.trim() || !questionText.trim()) {
      Alert.alert('خطأ', 'الرجاء إدخال عنوان ونصف الاختبار');
      return;
    }

    try {
      await addDoc(collection(db, 'exams'), {
        title,
        questionText,
        studentLevel,
        createdAt: serverTimestamp(),
      });
      Alert.alert('نجاح', 'تم نشر الاختبار المدرسي بنجاح');
      setTitle('');
      setQuestionText('');
    } catch (error) {
      console.error(error);
      Alert.alert('خطأ', 'فشل نشر الاختبار، تأكد من الاتصال');
    }
  };

  return (
    <ScrollView contentContainerStyle={styles.container}>
      <Text style={styles.headerTitle}>إدارة الاختبارات المدرسية</Text>
      
      <Text style={styles.label}>عنوان الاختبار:</Text>
      <TextInput
        style={styles.input}
        placeholder="مثال: اختبار الشهر الأول في الكيمياء"
        placeholderTextColor="#888"
        value={title}
        onChangeText={setTitle}
      />

      <Text style={styles.label}>تفاصيل أو أسئلة الاختبار:</Text>
      <TextInput
        style={[styles.input, styles.textArea]}
        placeholder="اكتب الأسئلة أو التعليمات..."
        placeholderTextColor="#888"
        multiline
        value={questionText}
        onChangeText={setQuestionText}
      />

      <Text style={styles.label}>المستوى الدراسي:</Text>
      <View style={styles.row}>
        {['الأول الثانوي', 'الثاني الثانوي', 'الثالث الثانوي'].map((lvl) => (
          <TouchableOpacity
            key={lvl}
            style={[styles.levelBtn, studentLevel === lvl && styles.activeLevel]}
            onPress={() => setStudentLevel(lvl)}
          >
            <Text style={[styles.levelText, studentLevel === lvl && styles.activeLevelText]}>
              {lvl}
            </Text>
          </TouchableOpacity>
        ))}
      </View>

      <TouchableOpacity style={styles.publishBtn} onPress={publishExam}>
        <Text style={styles.publishBtnText}>نشر الاختبار المدرسي</Text>
      </TouchableOpacity>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { padding: 20, backgroundColor: '#0f172a', flexGrow: 1 },
  headerTitle: { fontSize: 22, fontWeight: 'bold', color: '#fff', textAlign: 'center', marginBottom: 20, marginTop: 10 },
  label: { color: '#38bdf8', fontSize: 16, marginBottom: 8, fontWeight: 'bold' },
  input: { backgroundColor: '#1e293b', color: '#fff', padding: 12, borderRadius: 8, marginBottom: 15, fontSize: 16, borderWidth: 1, borderColor: '#334155' },
  textArea: { height: 120, textAlignVertical: 'top' },
  row: { flexDirection: 'row', justifyContent: 'space-between', marginBottom: 20 },
  levelBtn: { flex: 1, padding: 10, marginHorizontal: 4, backgroundColor: '#1e293b', borderRadius: 6, alignItems: 'center', borderWidth: 1, borderColor: '#334155' },
  activeLevel: { backgroundColor: '#0284c7', borderColor: '#38bdf8' },
  levelText: { color: '#94a3b8', fontSize: 12 },
  activeLevelText: { color: '#fff', fontWeight: 'bold' },
  publishBtn: { backgroundColor: '#10b981', padding: 15, borderRadius: 8, alignItems: 'center', marginTop: 10 },
  publishBtnText: { color: '#fff', fontSize: 18, fontWeight: 'bold' }
});
    
