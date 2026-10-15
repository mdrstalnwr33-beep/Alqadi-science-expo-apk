import { router, useLocalSearchParams } from 'expo-router';
import { Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';

export default function Item() {
  const { title = 'المحتوى', module = 'books', role = 'student' } = useLocalSearchParams<{ title?: string; module?: string; role?: string }>();
  const teacher = role === 'teacher';
  const isExam = module === 'exams';
  const isHomework = module === 'homework';

  return (
    <ScrollView contentContainerStyle={styles.container}>
      <View style={styles.paper}>
        <Text style={styles.type}>{isExam ? 'اختبار' : isHomework ? 'واجب' : 'محتوى علمي'}</Text>
        <Text style={styles.title}>{title}</Text>
        <Text style={styles.body}>
          {teacher
            ? 'هذه شاشة معاينة مستقلة. في المراحل التالية سيستطيع المعلم إنشاء المحتوى وتعديله وحذفه ومراجعته من قاعدة بيانات مشتركة.'
            : 'هذا مكان عرض المحتوى الحقيقي. سيتم هنا فتح الكتاب أو الدرس أو الاختبار دون الاعتماد على شاشة واحدة ضخمة أو بيانات غير متزامنة.'}
        </Text>
      </View>
      {!teacher && isExam && <Pressable style={styles.primary} onPress={() => router.push('/exam')}><Text style={styles.primaryText}>بدء الاختبار</Text></Pressable>}
      {!teacher && isHomework && <Pressable style={styles.primary} onPress={() => router.push('/homework')}><Text style={styles.primaryText}>فتح نموذج الواجب</Text></Pressable>}
      <Pressable style={styles.secondary} onPress={() => router.back()}><Text style={styles.secondaryText}>العودة</Text></Pressable>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { padding: 20, gap: 14 },
  paper: { backgroundColor: '#FFFFFF', borderRadius: 20, padding: 22, borderWidth: 1, borderColor: '#D8E2F0' },
  type: { color: '#47709F', fontWeight: '700', textAlign: 'right' },
  title: { color: '#123A72', fontSize: 27, fontWeight: '800', marginTop: 7, textAlign: 'right' },
  body: { color: '#4F6075', fontSize: 16, lineHeight: 27, marginTop: 18, textAlign: 'right' },
  primary: { backgroundColor: '#123A72', borderRadius: 14, padding: 16, alignItems: 'center' },
  primaryText: { color: '#FFFFFF', fontSize: 17, fontWeight: '800' },
  secondary: { padding: 15, alignItems: 'center' },
  secondaryText: { color: '#123A72', fontWeight: '800' },
});
