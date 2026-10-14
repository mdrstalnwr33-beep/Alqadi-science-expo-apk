import React, { useEffect, useState } from 'react';
import { View, Text, ScrollView, TouchableOpacity, Button, Alert, StyleSheet } from 'react-native';
import { collection, query, where, getDocs } from 'firebase/firestore';
import { db } from './src/firebaseConfig';


export default function StudentExamScreen({ studentLevel = 'first' }) {
  const [exams, setExams] = useState([]);
  const [selectedExam, setSelectedExam] = useState(null);
  const [studentAnswers, setStudentAnswers] = useState({});
  const [score, setScore] = useState(null);

  useEffect(() => {
    fetchExams();
  }, [studentLevel]);

  // جلب الاختبارات التابعة لمستوى الطالب من Firestore
  const fetchExams = async () => {
    try {
      const q = query(
        collection(db, 'exams'),
        where('level', '==', studentLevel),
        where('active', '==', true)
      );
      const querySnapshot = await getDocs(q);
      const examList = [];
      querySnapshot.forEach((doc) => {
        examList.push({ id: doc.id, ...doc.data() });
      });
      setExams(examList);
    } catch (error) {
      console.error('خطأ في جلب الاختبارات:', error);
    }
  };

  // تسليم وتصحيح الإجابات فوراً
  const handleSubmitExam = () => {
    if (!selectedExam) return;

    let totalScore = 0;
    selectedExam.questions.forEach((q) => {
      if (studentAnswers[q.id] === q.correctAnswer) {
        totalScore += 1;
      }
    });

    setScore(totalScore);
    Alert.alert('نتيجة الاختبار', `لقد حصلت على ${totalScore} من ${selectedExam.questions.length}`);
  };

  if (selectedExam) {
    return (
      <ScrollView style={styles.container}>
        <Button title="← العودة لقائمة الاختبارات" onPress={() => { setSelectedExam(null); setScore(null); setStudentAnswers({}); }} />
        <Text style={styles.header}>{selectedExam.title}</Text>

        {selectedExam.questions.map((q, idx) => (
          <View key={q.id} style={styles.questionBox}>
            <Text style={styles.questionText}>{idx + 1}. {q.questionText}</Text>
            
            {q.options.map((opt) => (
              <TouchableOpacity
                key={opt}
                style={[
                  styles.optionButton,
                  studentAnswers[q.id] === opt && styles.selectedOption
                ]}
                onPress={() => setStudentAnswers({ ...studentAnswers, [q.id]: opt })}
              >
                <Text style={styles.optionText}>{opt}</Text>
              </TouchableOpacity>
            ))}
          </View>
        ))}

        {score === null ? (
          <View style={{ marginVertical: 20 }}>
            <Button title="إنهاء وتسليم الاختبار" onPress={handleSubmitExam} color="#28a745" />
          </View>
        ) : (
          <Text style={styles.scoreText}>النتيجة النهائية: {score} / {selectedExam.questions.length}</Text>
        )}
      </ScrollView>
    );
  }

  return (
    <ScrollView style={styles.container}>
      <Text style={styles.header}>الاختبارات والواجبات المتاحة</Text>
      {exams.length === 0 ? (
        <Text style={{ textAlign: 'center', marginTop: 20 }}>لا توجد اختبارات متاحة حالياً لهذا المستوى.</Text>
      ) : (
        exams.map((exam) => (
          <TouchableOpacity key={exam.id} style={styles.examCard} onPress={() => setSelectedExam(exam)}>
            <Text style={styles.examTitle}>{exam.title}</Text>
            <Text style={styles.examSub}>عدد الأسئلة: {exam.questions?.length || 0}</Text>
          </TouchableOpacity>
        ))
      )}
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, padding: 16, backgroundColor: '#f5f5f5' },
  header: { fontSize: 20, fontWeight: 'bold', textAlign: 'center', marginVertical: 15 },
  examCard: { backgroundColor: '#fff', padding: 15, borderRadius: 8, marginVertical: 6, borderWidth: 1, borderColor: '#e0e0e0' },
  examTitle: { fontSize: 16, fontWeight: 'bold' },
  examSub: { color: '#666', marginTop: 5 },
  questionBox: { backgroundColor: '#fff', padding: 12, borderRadius: 8, marginVertical: 8 },
  questionText: { fontSize: 16, fontWeight: 'bold', marginBottom: 10 },
  optionButton: { padding: 10, backgroundColor: '#eee', borderRadius: 5, marginVertical: 4 },
  selectedOption: { backgroundColor: '#cce5ff', borderColor: '#007AFF', borderWidth: 1 },
  optionText: { fontSize: 14 },
  scoreText: { fontSize: 18, fontWeight: 'bold', color: 'green', textAlign: 'center', marginVertical: 20 }
});
