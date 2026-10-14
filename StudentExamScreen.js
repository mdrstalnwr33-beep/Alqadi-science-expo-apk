import React, { useState } from 'react';
import { StyleSheet, Text, View, TouchableOpacity, ScrollView, Alert } from 'react-native';

export default function StudentExamScreen({ studentLevel = 'الأول الثانوي' }) {
  const [selectedAnswer, setSelectedAnswer] = useState(null);
  const [submitted, setSubmitted] = useState(false);

  // نموذج سؤال تجريبي أو تفاعلي للطالب
  const questionData = {
    title: 'اختبار مادة العلوم - ' + studentLevel,
    question: 'أي مما يلي يعد من المخاليط المتجانسة؟',
    options: ['الماء والزيت', 'المحلول الملحي', 'الرمل والماء', 'برادة الحديد والسراميك'],
    correctAnswer: 'المحلول الملحي'
  };

  const handleAnswer = (option) => {
    if (submitted) return;
    setSelectedAnswer(option);
  };

  const submitAnswer = () => {
    if (!selectedAnswer) {
      Alert.alert('تنبيه', 'الرجاء اختيار إجابة قبل التسليم');
      return;
    }
    setSubmitted(true);
  };

  return (
    <ScrollView contentContainerStyle={styles.container}>
      <Text style={styles.headerTitle}>{questionData.title}</Text>
      
      <View style={styles.card}>
        <Text style={styles.questionText}>{questionData.question}</Text>
        
        {questionData.options.map((opt, index) => {
          const isSelected = selectedAnswer === opt;
          return (
            <TouchableOpacity 
              key={index} 
              style={[styles.optionBtn, isSelected && styles.selectedOption]}
              onPress={() => handleAnswer(opt)}
            >
              <Text style={[styles.optionText, isSelected && styles.selectedOptionText]}>
                {opt}
              </Text>
            </TouchableOpacity>
          );
        })}
      </View>

      {!submitted ? (
        <TouchableOpacity style={styles.submitBtn} onPress={submitAnswer}>
          <Text style={styles.submitBtnText}>إرسال الإجابة</Text>
        </TouchableOpacity>
      ) : (
        <Text style={styles.scoreText}>
          {selectedAnswer === questionData.correctAnswer ? 'إجابة صحيحة! أحسنت 🌟' : 'إجابة خاطئة، حاول مرة أخرى ❌'}
        </Text>
      )}
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { padding: 20, backgroundColor: '#0f172a', flexGrow: 1, justifyContent: 'center' },
  headerTitle: { fontSize: 20, fontWeight: 'bold', color: '#fff', textAlign: 'center', marginBottom: 20 },
  card: { backgroundColor: '#1e293b', padding: 20, borderRadius: 12, borderWidth: 1, borderColor: '#334155', marginBottom: 20 },
  questionText: { fontSize: 18, color: '#38bdf8', marginBottom: 20, fontWeight: 'bold', textAlign: 'right' },
  optionBtn: { backgroundColor: '#0f172a', padding: 15, borderRadius: 8, marginBottom: 10, borderWidth: 1, borderColor: '#334155' },
  selectedOption: { backgroundColor: '#0284c7', borderColor: '#38bdf8' },
  optionText: { color: '#94a3b8', fontSize: 16, textAlign: 'right' },
  selectedOptionText: { color: '#fff', fontWeight: 'bold' },
  submitBtn: { backgroundColor: '#10b981', padding: 15, borderRadius: 8, alignItems: 'center' },
  submitBtnText: { color: '#fff', fontSize: 18, fontWeight: 'bold' },
  scoreText: { fontSize: 18, fontWeight: 'bold', color: '#10b981', textAlign: 'center', marginVertical: 20 }
});
export default StudentExamScreen;
