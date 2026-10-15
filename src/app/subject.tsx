import { router, useLocalSearchParams } from 'expo-router';
import { Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';

const modules = [
  { key: 'books', title: 'الكتب والملخصات', icon: '📚', desc: 'كتب ومذكرات قابلة للفتح والقراءة.' },
  { key: 'lessons', title: 'الدروس اليومية', icon: '🧪', desc: 'الدروس المرتبة حسب الصف والمادة.' },
  { key: 'exams', title: 'الاختبارات الشهرية', icon: '📝', desc: 'اختبارات مع وقت وتسليم نهائي ومحاولة واحدة.' },
  { key: 'homework', title: 'الواجبات', icon: '📓', desc: 'إرسال الواجب للمعلم ومتابعة التصحيح.' },
  { key: 'grades', title: 'الدرجات', icon: '📊', desc: 'الدرجات والتغذية الراجعة.' },
];

export default function Subject() {
  const { subject = 'chemistry', level = '1', role = 'student' } = useLocalSearchParams<{ subject?: string; level?: string; role?: string }>();
  const subjectName = subject === 'physics' ? 'الفيزياء' : subject === 'biology' ? 'الأحياء' : 'الكيمياء';
  const levelName = level === '2' ? 'الثاني' : level === '3' ? 'الثالث' : 'الأول';
  const teacher = role === 'teacher';

  return (
    <ScrollView contentContainerStyle={styles.container}>
      <View style={styles.header}>
        <Text style={styles.title}>{subjectName}</Text>
        <Text style={styles.subtitle}>الصف {levelName} · {teacher ? 'إدارة المعلم' : 'مساحة الطالب'}</Text>
      </View>
      {modules.map((module) => (
        <Pressable
          key={module.key}
          style={({ pressed }) => [styles.card, pressed && styles.pressed]}
          onPress={() => router.push({ pathname: '/module', params: { module: module.key, subject, level, role } })}
        >
          <Text style={styles.icon}>{module.icon}</Text>
          <View style={styles.body}>
            <Text style={styles.cardTitle}>{module.title}</Text>
            <Text style={styles.cardText}>{module.desc}</Text>
          </View>
          <Text style={styles.arrow}>←</Text>
        </Pressable>
      ))}
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { padding: 20, gap: 12 },
  header: { backgroundColor: '#123A72', borderRadius: 20, padding: 20, marginBottom: 4 },
  title: { color: '#FFFFFF', fontSize: 26, fontWeight: '800', textAlign: 'right' },
  subtitle: { color: '#D9E8FF', marginTop: 7, textAlign: 'right' },
  card: { backgroundColor: '#FFFFFF', borderRadius: 17, padding: 17, minHeight: 104, borderWidth: 1, borderColor: '#D8E2F0', flexDirection: 'row-reverse', alignItems: 'center', gap: 13 },
  pressed: { opacity: 0.75 },
  icon: { fontSize: 30, width: 44, textAlign: 'center' },
  body: { flex: 1 },
  cardTitle: { fontSize: 18, fontWeight: '800', color: '#123A72', textAlign: 'right' },
  cardText: { color: '#65748A', fontSize: 13, marginTop: 5, textAlign: 'right', lineHeight: 20 },
  arrow: { fontSize: 22, color: '#123A72' },
});
