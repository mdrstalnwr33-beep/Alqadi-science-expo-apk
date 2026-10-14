import React, { useState } from 'react';
import { View, Text, TextInput, Button, ScrollView, Alert, StyleSheet } from 'react-native';
import { collection, addDoc, serverTimestamp } from 'firebase/firestore';
import { db } from './firebaseConfig'; // تأكد من صحة مسار ملف فايربيس لديك

export default function CreateExamScreen() {
  const [title, setTitle] = useState('');
  const [level, setLevel] = useState('first'); // 'first', 'second', 'third'
  const [questions, setQuestions] = useState([]);
  
  // حقول السؤال الحالي
  const [questionText, setQuestionText] = useState('');
  const [questionType, setQuestionType] = useState('multiple_choice');
  const [options, setOptions] = useState(['', '', '', '']);
  const [correctAnswer, setCorrectAnswer] = useState('');

  // إضافة سؤال إلى القائمة المؤقتة
  const handleAddQuestion = () => {
    if (!questionText.trim()) {
      Alert.alert('تنبيه', 'يرجى كتابة نص السؤال');
      return;
    }

    let finalOptions = [];
    if (questionType === 'multiple_choice') {
      finalOptions = options.map(o => o.trim()).filter(o => o !== '');
      if (finalOptions.length < 2) {
        Alert.alert('تنبيه', 'يرجى إدخال خيارين على الأقل');
        return;
      }
    } else {
      finalOptions = ['صح', 'خطأ'];
    }

    if (!correctAnswer) {
      Alert.alert('تنبيه', 'يرجى تحديد الإجابة الصحيحة');
      return;
    }

    const newQuestion = {
      id: Date.now().toString(),
      type: questionType,
      questionText: questionText.trim(),
      options: finalOptions,
      correctAnswer: correctAnswer,
    };

    setQuestions([...questions, newQuestion]);
    setQuestionText('');
    setOptions(['', '', '', '']);
    setCorrectAnswer('');
  };

  // حفظ الاختبار النهائي في Firestore
  const handleSaveExam = async () => {
    if (!title.trim()) {
      Alert.alert('تنبيه', 'يرجى إدخال عنوان الاختبار');
      return;
    }
    if (questions.length === 0) {
      Alert.alert('تنبيه', 'يرجى إضافة سؤال واحد على الأقل');
      return;
    }

    try {
      await addDoc(collection(db, 'exams'), {
        title: title.trim(),
        level: level,
        createdAt: serverTimestamp(),
        questions: questions,
        active: true,
      });

      Alert.alert('نجاح', 'تم حفظ الاختبار بنجاح في قاعدة البيانات!');
      setTitle('');
      setQuestions([]);
    } catch (error) {
      Alert.alert('خطأ', 'حدث خطأ أثناء حفظ الاختبار');
      console.error(error);
    }
  };

  return (
    <ScrollView style={styles.container}>
      <Text style={styles.header}>إضافة اختبار / واجب جديد</Text>
      
      <TextInput
        style={styles.input}
        placeholder="عنوان الاختبار (مثال: اختبار الكيمياء - الفصل الأول)"
        value={title}
        onChangeText={setTitle}
      />

      <Text style={styles.subHeader}>إضافة سؤال جديد:</Text>
      <TextInput
        style={styles.input}
        placeholder="نص السؤال"
        value={questionText}
        onChangeText={setQuestionText}
      />

      <View style={styles.row}>
        <Button 
          title="اختيار من متعدد" 
          onPress={() => { setQuestionType('multiple_choice'); setCorrectAnswer(''); }} 
          color={questionType === 'multiple_choice' ? '#007AFF' : '#ccc'}
        />
        <Button 
          title="صح / خطأ" 
          onPress={() => { setQuestionType('true_false'); setCorrectAnswer(''); }} 
          color={questionType === 'true_false' ? '#007AFF' : '#ccc'}
        />
      </View>

      {questionType === 'multiple_choice' ? (
        <View style={{ marginVertical: 10 }}>
          {options.map((opt, idx) => (
            <TextInput
              key={idx}
              style={styles.input}
              placeholder={`الخيار ${idx + 1}`}
              value={opt}
              onChangeText={(txt) => {
                const newOpts = [...options];
                newOpts[idx] = txt;
                setOptions(newOpts);
              }}
            />
          ))}
          <Text style={styles.label}>اختر الإجابة الصحيحة:</Text>
          {options.map((opt, idx) => opt.trim() !== '' && (
            <Button
              key={idx}
              title={`الإجابة الصحيحة: ${opt}`}
              color={correctAnswer === opt ? '#28a745' : '#6c757d'}
              onPress={() => setCorrectAnswer(opt)}
            />
          ))}
        </View>
      ) : (
        <View style={{ marginVertical: 10 }}>
          <Text style={styles.label}>اختر الإجابة الصحيحة:</Text>
          <View style={styles.row}>
            <Button title="صح" color={correctAnswer === 'صح' ? '#28a745' : '#6c757d'} onPress={() => setCorrectAnswer('صح')} />
            <Button title="خطأ" color={correctAnswer === 'خطأ' ? '#28a745' : '#6c757d'} onPress={() => setCorrectAnswer('خطأ')} />
          </View>
        </View>
      )}

      <Button title="إضافة السؤال للقائمة" onPress={handleAddQuestion} color="#17a2b8" />

      <Text style={styles.subHeader}>الأسئلة المضافة ({questions.length}):</Text>
      {questions.map((q, idx) => (
        <View key={q.id} style={styles.card}>
          <Text>{idx + 1}. {q.questionText} ({q.type === 'multiple_choice' ? 'اختيار من متعدد' : 'صح وخطأ'})</Text>
          <Text style={{ color: 'green' }}>الإجابة: {q.correctAnswer}</Text>
        </View>
      ))}

      <View style={{ marginTop: 20, marginBottom: 50 }}>
        <Button title="حفظ الاختبار ونشره للطلاب" onPress={handleSaveExam} color="#28a745" />
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, padding: 16, backgroundColor: '#f9f9f9' },
  header: { fontSize: 20, fontWeight: 'bold', textAlign: 'center', marginBottom: 15 },
  subHeader: { fontSize: 16, fontWeight: 'bold', marginTop: 15, marginBottom: 5 },
  input: { backgroundColor: '#fff', borderBottomWidth: 1, borderColor: '#ccc', padding: 8, marginBottom: 10 },
  row: { flexDirection: 'row', justifyContent: 'space-around', marginVertical: 8 },
  label: { marginTop: 10, marginBottom: 5, fontWeight: 'bold' },
  card: { backgroundColor: '#fff', padding: 10, borderRadius: 5, marginVertical: 4, borderWidth: 1, borderColor: '#ddd' }
});
      
