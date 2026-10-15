import { router, useLocalSearchParams } from 'expo-router';
import { Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';

const data = {
  books: ['كتاب المنهج', 'ملخص الوحدة الأولى', 'ورقة مراجعة قبل الاختبار'],
  lessons: ['الدرس الأول', 'الدرس الثاني', 'تجربة علمية تطبيقية'],
  exams: ['اختبار الشهر الأول', 'اختبار الشهر الثاني'],
  homework: ['واجب الوحدة الأولى', 'أسئلة مراجعة الدرس'],
  grades: ['اختبار الشهر الأول: 18/20', 'واجب الوحدة الأولى: 9/10'],
} as const;

export default function Module() {
  const { module = 'books', subject = 'chemistry', level = '1', role = 'student' } = useLocalSearchParams<{ module?: keyof typeof data; subject?: string; level?: string; role?: string }>();
  const items = data[module] ?? data.books;
  const title = module === 'books' ? 'الكتب والملخصات' : module === 'lessons' ? 'الدروس اليومية' : module === 'exams' ? 'الاختبارات الشهرية' : module === 'homework' ? 'الواجبات' : 'الدرجات';
  const teacher = role === 'teacher';

  return (
    <ScrollView contentContainerStyle={styles.container}>
      <View style={styles.notice}>
        <Text style={styles.noticeTitle}>{title}</Text>
        <Text style={styles.noticeText}>المحتوى هنا محلي في المرحلة الأولى حتى نثبت الواجهة والتنقل قبل ربط قاعدة البيانات.</Text>
      </View>
      {items.map((item, index) => (
        <Pressable key={item} style={styles.item} onPress={() => router.push({ pathname: '/item', params: { title: item, module, subject, level, role, index: String(index) } })}>
          <View style={styles.number}><Text style={styles.numberText}>{index + 1}</Text></View>
          <View style={styles.itemBody}><Text style={styles.itemTitle}>{item}</Text><Text style={styles.itemMeta}>{teacher ? 'إدارة المحتوى' : 'فتح المحتوى'}</Text></View>
          <Text style={styles.arrow}>←</Text>
        </Pressable>
      ))}
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { padding: 20, gap: 12 },
  notice: { backgroundColor: '#EAF2FF', borderRadius: 17, padding: 18, borderWidth: 1, borderColor: '#C8DCF7' },
  noticeTitle: { color: '#123A72', fontSize: 21, fontWeight: '800', textAlign: 'right' },
  noticeText: { color: '#53657B', lineHeight: 21, marginTop: 7, textAlign: 'right' },
  item: { backgroundColor: '#FFFFFF', borderRadius: 16, padding: 15, borderWidth: 1, borderColor: '#D8E2F0', flexDirection: 'row-reverse', alignItems: 'center', gap: 12 },
  number: { width: 38, height: 38, borderRadius: 19, backgroundColor: '#123A72', alignItems: 'center', justifyContent: 'center' },
  numberText: { color: '#FFFFFF', fontWeight: '800' },
  itemBody: { flex: 1 },
  itemTitle: { color: '#172A46', fontSize: 17, fontWeight: '800', textAlign: 'right' },
  itemMeta: { color: '#77859A', fontSize: 12, marginTop: 4, textAlign: 'right' },
  arrow: { color: '#123A72', fontSize: 21 },
});
