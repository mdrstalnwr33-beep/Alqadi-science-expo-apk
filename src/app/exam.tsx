import { router } from 'expo-router';
import { Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';

export default function Exam() {
  return (
    <ScrollView contentContainerStyle={styles.container}>
      <View style={styles.header}><Text style={styles.title}>اختبار الشهر التجريبي</Text><Text style={styles.meta}>20 دقيقة · 5 أسئلة · محاولة واحدة</Text></View>
      {[1, 2, 3, 4, 5].map((n) => (
        <View key={n} style={styles.question}>
          <Text style={styles.q}>السؤال {n}: اختر الإجابة الصحيحة.</Text>
          {['الإجابة الأولى', 'الإجابة الثانية', 'الإجابة الثالثة', 'الإجابة الرابعة'].map((answer) => <Pressable key={answer} style={styles.option}><Text style={styles.optionText}>{answer}</Text></Pressable>)}
        </View>
      ))}
      <Pressable style={styles.submit} onPress={() => router.replace('/result')}><Text style={styles.submitText}>تسليم الاختبار النهائي 📝</Text></Pressable>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { padding: 18, gap: 12 },
  header: { backgroundColor: '#123A72', borderRadius: 18, padding: 19 },
  title: { color: '#FFFFFF', fontSize: 23, fontWeight: '800', textAlign: 'right' },
  meta: { color: '#D9E8FF', marginTop: 6, textAlign: 'right' },
  question: { backgroundColor: '#FFFFFF', borderRadius: 17, padding: 16, borderWidth: 1, borderColor: '#D8E2F0', gap: 8 },
  q: { color: '#172A46', fontSize: 16, fontWeight: '800', textAlign: 'right', marginBottom: 4 },
  option: { borderWidth: 1, borderColor: '#CBD7E6', borderRadius: 12, padding: 12 },
  optionText: { color: '#334A66', textAlign: 'right' },
  submit: { backgroundColor: '#0F766E', borderRadius: 14, padding: 16, alignItems: 'center', marginTop: 4 },
  submitText: { color: '#FFFFFF', fontWeight: '800', fontSize: 17 },
});
