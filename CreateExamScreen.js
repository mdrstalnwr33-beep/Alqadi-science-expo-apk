import React, { useMemo, useState } from 'react';
import { Alert, Button, ScrollView, StyleSheet, Text, TextInput, TouchableOpacity, View } from 'react-native';
import { addDoc, collection, serverTimestamp } from 'firebase/firestore';
import { db } from './src/firebaseConfig';

const LEVELS = [
  { id: 'first', title: 'الأول الثانوي' },
  { id: 'second', title: 'الثاني الثانوي' },
  { id: 'third', title: 'الثالث الثانوي' },
];

const TYPES = [
  { id: 'multiple_choice', title: 'اختيار من متعدد' },
  { id: 'true_false', title: 'صح / خطأ' },
  { id: 'text', title: 'إجابة قصيرة' },
];

const emptyOptions = ['', '', '', ''];

export default function CreateExamScreen() {
  const [title, setTitle] = useState('');
  const [level, setLevel] = useState('first');
  const [questions, setQuestions] = useState([]);
  const [questionText, setQuestionText] = useState('');
  const [questionType, setQuestionType] = useState('multiple_choice');
  const [options, setOptions] = useState(emptyOptions);
  const [correctAnswer, setCorrectAnswer] = useState('');

  const selectedType = useMemo(() => TYPES.find((x) => x.id === questionType), [questionType]);

  const resetQuestion = () => {
    setQuestionText('');
    setOptions(emptyOptions);
    setCorrectAnswer('');
  };

  const handleAddQuestion = () => {
    const text = questionText.trim();
    if (!text) return Alert.alert('تنبيه', 'يرجى كتابة نص السؤال');

    let finalOptions = [];
    let answer = '';

    if (questionType === 'multiple_choice') {
      finalOptions = options.map((x) => x.trim()).filter(Boolean);
      if (finalOptions.length !== 4) {
        return Alert.alert('تنبيه', 'يجب إدخال أربعة خيارات بالضبط في سؤال الاختيار من متعدد');
      }
      answer = correctAnswer.trim();
      if (!answer || !finalOptions.includes(answer)) {
        return Alert.alert('تنبيه', 'حدد الإجابة الصحيحة من الخيارات الأربعة');
      }
    } else if (questionType === 'true_false') {
      finalOptions = ['صح', 'خطأ'];
      answer = correctAnswer;
      if (!['صح', 'خطأ'].includes(answer)) {
        return Alert.alert('تنبيه', 'حدد الإجابة الصحيحة: صح أو خطأ');
      }
    } else {
      // لا توجد إجابة نموذجية إلزامية؛ يمكن للمعلم مراجعة الإجابة لاحقًا.
      answer = correctAnswer.trim();
    }

    setQuestions((current) => [
      ...current,
      {
        id: `q-${Date.now()}-${current.length}`,
        type: questionType,
        questionText: text,
        options: finalOptions,
        correctAnswer: answer,
      },
    ]);
    resetQuestion();
  };

  const removeQuestion = (id) => setQuestions((current) => current.filter((q) => q.id !== id));

  const handleSaveExam = async () => {
    if (!title.trim()) return Alert.alert('تنبيه', 'يرجى إدخال عنوان الاختبار');
    if (!questions.length) return Alert.alert('تنبيه', 'أضف سؤالًا واحدًا على الأقل');

    try {
      await addDoc(collection(db, 'exams'), {
        title: title.trim(),
        level,
        active: true,
        createdAt: serverTimestamp(),
        questions,
      });
      Alert.alert('نجاح', 'تم حفظ الاختبار ونشره للمستوى المحدد');
      setTitle('');
      setQuestions([]);
    } catch (error) {
      console.error(error);
      Alert.alert('خطأ', 'تعذر حفظ الاختبار. تأكد من اتصال Firebase وصلاحيات Firestore.');
    }
  };

  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.content}>
      <Text style={styles.header}>إنشاء اختبار جديد</Text>
      <Text style={styles.helper}>اختر الصف، ثم أضف أي عدد من الأسئلة بالأنواع الثلاثة.</Text>

      <TextInput
        style={styles.input}
        placeholder="عنوان الاختبار"
        value={title}
        onChangeText={setTitle}
        textAlign="right"
      />

      <Text style={styles.label}>استهداف الصف الدراسي</Text>
      <View style={styles.wrapRow}>
        {LEVELS.map((item) => (
          <TouchableOpacity
            key={item.id}
            style={[styles.chip, level === item.id && styles.chipActive]}
            onPress={() => setLevel(item.id)}
          >
            <Text style={[styles.chipText, level === item.id && styles.chipTextActive]}>{item.title}</Text>
          </TouchableOpacity>
        ))}
      </View>

      <Text style={styles.label}>نوع السؤال</Text>
      <View style={styles.wrapRow}>
        {TYPES.map((item) => (
          <TouchableOpacity
            key={item.id}
            style={[styles.chip, questionType === item.id && styles.chipActive]}
            onPress={() => {
              setQuestionType(item.id);
              setCorrectAnswer('');
              setOptions(item.id === 'multiple_choice' ? emptyOptions : item.id === 'true_false' ? ['صح', 'خطأ'] : []);
            }}
          >
            <Text style={[styles.chipText, questionType === item.id && styles.chipTextActive]}>{item.title}</Text>
          </TouchableOpacity>
        ))}
      </View>

      <Text style={styles.currentType}>السؤال الحالي: {selectedType?.title}</Text>
      <TextInput
        style={[styles.input, styles.multiline]}
        placeholder="نص السؤال"
        value={questionText}
        onChangeText={setQuestionText}
        multiline
        textAlign="right"
      />

      {questionType === 'multiple_choice' && (
        <View>
          {options.map((option, index) => (
            <TextInput
              key={index}
              style={styles.input}
              placeholder={`الخيار ${index + 1}`}
              value={option}
              onChangeText={(value) => setOptions((current) => current.map((x, i) => (i === index ? value : x)))}
              textAlign="right"
            />
          ))}
          <Text style={styles.label}>الإجابة الصحيحة</Text>
          {options.map((option, index) => option.trim() ? (
            <TouchableOpacity key={index} style={[styles.answerRow, correctAnswer === option.trim() && styles.answerSelected]} onPress={() => setCorrectAnswer(option.trim())}>
              <Text style={styles.answerText}>{option.trim()}</Text>
              <Text>{correctAnswer === option.trim() ? '✓' : '○'}</Text>
            </TouchableOpacity>
          ) : null)}
        </View>
      )}

      {questionType === 'true_false' && (
        <View style={styles.wrapRow}>
          {['صح', 'خطأ'].map((value) => (
            <TouchableOpacity key={value} style={[styles.tfButton, correctAnswer === value && styles.answerSelected]} onPress={() => setCorrectAnswer(value)}>
              <Text style={styles.answerText}>{value}</Text>
            </TouchableOpacity>
          ))}
        </View>
      )}

      {questionType === 'text' && (
        <View>
          <TextInput
            style={styles.input}
            placeholder="إجابة نموذجية اختيارية للمعلم"
            value={correctAnswer}
            onChangeText={setCorrectAnswer}
            textAlign="right"
          />
          <Text style={styles.helper}>تُرسل إجابة الطالب للمعلم للمراجعة والتقييم، ولا تُصحح آليًا.</Text>
        </View>
      )}

      <Button title="إضافة السؤال" onPress={handleAddQuestion} />

      <Text style={styles.sectionTitle}>الأسئلة المضافة ({questions.length})</Text>
      {questions.map((q, index) => (
        <View key={q.id} style={styles.card}>
          <Text style={styles.cardTitle}>{index + 1}. {q.questionText}</Text>
          <Text style={styles.cardMeta}>{TYPES.find((x) => x.id === q.type)?.title}</Text>
          {q.options.length ? <Text style={styles.cardMeta}>{q.options.join(' • ')}</Text> : null}
          {q.correctAnswer ? <Text style={styles.correct}>الإجابة: {q.correctAnswer}</Text> : <Text style={styles.pending}>تحتاج مراجعة المعلم</Text>}
          <Button title="حذف السؤال" color="#c53045" onPress={() => removeQuestion(q.id)} />
        </View>
      ))}

      <View style={styles.saveBox}>
        <Button title="حفظ الاختبار ونشره" onPress={handleSaveExam} color="#0f9f76" />
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#f4f7fb' },
  content: { padding: 18, paddingBottom: 50 },
  header: { fontSize: 24, fontWeight: '900', textAlign: 'center', color: '#12233f', marginBottom: 8 },
  helper: { color: '#66758c', textAlign: 'right', lineHeight: 21, marginBottom: 12 },
  label: { color: '#12233f', fontWeight: '800', textAlign: 'right', marginTop: 8, marginBottom: 7 },
  currentType: { color: '#1f5eff', fontWeight: '800', textAlign: 'right', marginBottom: 8 },
  input: { minHeight: 50, borderWidth: 1, borderColor: '#dbe3ed', borderRadius: 12, backgroundColor: '#fff', paddingHorizontal: 13, paddingVertical: 10, marginBottom: 10, color: '#12233f' },
  multiline: { minHeight: 90, textAlignVertical: 'top' },
  wrapRow: { flexDirection: 'row', flexWrap: 'wrap', justifyContent: 'flex-end', gap: 8, marginBottom: 10 },
  chip: { borderWidth: 1, borderColor: '#cbd5e1', backgroundColor: '#fff', borderRadius: 12, paddingVertical: 10, paddingHorizontal: 12 },
  chipActive: { backgroundColor: '#1f5eff', borderColor: '#1f5eff' },
  chipText: { color: '#334155', fontWeight: '700' },
  chipTextActive: { color: '#fff' },
  answerRow: { flexDirection: 'row-reverse', alignItems: 'center', justifyContent: 'space-between', borderWidth: 1, borderColor: '#dbe3ed', borderRadius: 10, padding: 12, marginBottom: 7, backgroundColor: '#fff' },
  answerSelected: { borderColor: '#0f9f76', backgroundColor: '#e8f8f2' },
  answerText: { color: '#12233f', fontWeight: '700' },
  tfButton: { minWidth: 110, borderWidth: 1, borderColor: '#dbe3ed', borderRadius: 10, padding: 12, backgroundColor: '#fff', alignItems: 'center' },
  sectionTitle: { fontSize: 18, fontWeight: '900', color: '#12233f', textAlign: 'right', marginTop: 22, marginBottom: 10 },
  card: { backgroundColor: '#fff', borderRadius: 14, padding: 13, marginBottom: 9, borderWidth: 1, borderColor: '#e2e8f0' },
  cardTitle: { color: '#12233f', fontWeight: '900', textAlign: 'right', lineHeight: 21 },
  cardMeta: { color: '#66758c', textAlign: 'right', marginTop: 5 },
  correct: { color: '#0f9f76', textAlign: 'right', marginVertical: 6, fontWeight: '800' },
  pending: { color: '#b7791f', textAlign: 'right', marginVertical: 6, fontWeight: '800' },
  saveBox: { marginTop: 15 },
});
