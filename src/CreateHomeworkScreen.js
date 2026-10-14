import React, { useState } from 'react';
import { 
  StyleSheet, Text, View, TextInput, 
  TouchableOpacity, Alert, ScrollView 
} from 'react-native';
import { db } from './firebaseConfig';
import { collection, addDoc, serverTimestamp } from 'firebase/firestore';

export default function CreateHomeworkScreen() {
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [studentLevel, setStudentLevel] = useState('الأول الثانوي');

  const publishHomework = async () => {
    if (!title.trim() || !description.trim()) {
      Alert.alert('خطأ', 'الرجاء إدخال عنوان وصف الواجب');
      return;
    }

    try {
      await addDoc(collection(db, 'homeworks'), {
        title,
        description,
        studentLevel,
        createdAt: serverTimestamp(),
      });
      Alert.alert('نجاح', 'تم نشر الواجب بنجاح');
      setTitle('');
      setDescription('');
    } catch (error) {
      console.error(error);
      Alert.alert('خطأ', 'فشل نشر الواجب');
    }
  };

  return (
    <ScrollView contentContainerStyle={styles.container}>
      <Text style={styles.headerTitle}>إدارة الواجبات</Text>
      
      <Text style={styles.label}>عنوان الواجب:</Text>
      <TextInput
        style={styles.input}
        placeholder="أدخل العنوان..."
        placeholderTextColor="#888"
        value={title}
        onChangeText={setTitle}
      />

      <Text style={styles.label}>التفاصيل:</Text>
      <TextInput
        style={[styles.input, styles.textArea]}
        placeholder="اكتب تفاصيل الواجب..."
        placeholderTextColor="#888"
        multiline
        value={description}
        onChangeText={setDescription}
      />

      <Text style={styles.label}>المستوى:</Text>
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

      <TouchableOpacity style={styles.publishBtn} onPress={publishHomework}>
        <Text style={styles.publishBtnText}>نشر الواجب</Text>
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
          
