import { router } from 'expo-router';
import { Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';

const roles = [
  { key: 'student', title: 'الطالب', subtitle: 'الدروس والكتب والاختبارات والواجبات' },
  { key: 'teacher', title: 'المعلم', subtitle: 'إدارة المحتوى ومراجعة أعمال الطلاب' },
] as const;

export default function Home() {
  return (
    <ScrollView contentContainerStyle={styles.container}>
      <View style={styles.hero}>
        <Text style={styles.badge}>منارة العلوم</Text>
        <Text style={styles.title}>تطبيق العلوم المدرسي</Text>
        <Text style={styles.subtitle}>نسخة جديدة مبنية من الصفر، بواجهة واضحة ومسارات مستقلة لكل شاشة.</Text>
      </View>
      <Text style={styles.sectionTitle}>اختر نوع الدخول</Text>
      {roles.map((role) => (
        <Pressable
          key={role.key}
          style={({ pressed }) => [styles.card, pressed && styles.pressed]}
          onPress={() => router.push({ pathname: '/login', params: { role: role.key } })}
        >
          <Text style={styles.cardTitle}>{role.title}</Text>
          <Text style={styles.cardText}>{role.subtitle}</Text>
          <Text style={styles.arrow}>←</Text>
        </Pressable>
      ))}
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { flexGrow: 1, padding: 20, gap: 16 },
  hero: { backgroundColor: '#123A72', borderRadius: 22, padding: 24, marginBottom: 4 },
  badge: { color: '#CFE2FF', fontSize: 16, fontWeight: '700', marginBottom: 10 },
  title: { color: '#FFFFFF', fontSize: 28, fontWeight: '800', textAlign: 'right' },
  subtitle: { color: '#EAF2FF', fontSize: 15, lineHeight: 24, marginTop: 10, textAlign: 'right' },
  sectionTitle: { fontSize: 20, fontWeight: '800', color: '#14213D', textAlign: 'right' },
  card: { backgroundColor: '#FFFFFF', borderRadius: 18, padding: 20, borderWidth: 1, borderColor: '#D8E2F0', minHeight: 112, justifyContent: 'center' },
  pressed: { opacity: 0.75, transform: [{ scale: 0.99 }] },
  cardTitle: { fontSize: 21, fontWeight: '800', color: '#123A72', textAlign: 'right' },
  cardText: { color: '#5C6B80', fontSize: 14, marginTop: 6, textAlign: 'right', paddingLeft: 25 },
  arrow: { position: 'absolute', left: 18, top: 40, fontSize: 24, color: '#123A72' },
});
