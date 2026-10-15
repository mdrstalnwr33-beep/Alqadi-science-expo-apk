import { router, useLocalSearchParams } from 'expo-router';
import { Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';

const subjects = [
  { id: 'chemistry', title: 'الكيمياء', icon: '⚗️' },
  { id: 'physics', title: 'الفيزياء', icon: '⚛️' },
  { id: 'biology', title: 'الأحياء', icon: '🧬' },
] as const;

const levels = ['الأول', 'الثاني', 'الثالث'];

export default function Dashboard() {
  const { role } = useLocalSearchParams<{ role?: string }>();
  const teacher = role === 'teacher';

  return (
    <ScrollView contentContainerStyle={styles.container}>
      <View style={styles.header}>
        <Text style={styles.kicker}>{teacher ? 'لوحة المعلم' : 'مساحة الطالب'}</Text>
        <Text style={styles.title}>مرحباً بك في منارة العلوم</Text>
        <Text style={styles.caption}>اختر المادة ثم الصف للوصول إلى المحتوى.</Text>
      </View>
      <Text style={styles.section}>المواد العلمية</Text>
      {subjects.map((subject) => (
        <View key={subject.id} style={styles.subjectCard}>
          <Text style={styles.subjectIcon}>{subject.icon}</Text>
          <View style={styles.subjectBody}>
            <Text style={styles.subjectTitle}>{subject.title}</Text>
            <View style={styles.levels}>
              {levels.map((level, index) => (
                <Pressable
                  key={level}
                  style={styles.levelButton}
                  onPress={() => router.push({ pathname: '/subject', params: { subject: subject.id, level: String(index + 1), role: teacher ? 'teacher' : 'student' } })}
                >
                  <Text style={styles.levelText}>الصف {level}</Text>
                </Pressable>
              ))}
            </View>
          </View>
        </View>
      ))}
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { padding: 20, gap: 16 },
  header: { backgroundColor: '#123A72', borderRadius: 22, padding: 22 },
  kicker: { color: '#CFE2FF', fontWeight: '700', textAlign: 'right' },
  title: { color: '#FFFFFF', fontSize: 25, fontWeight: '800', marginTop: 6, textAlign: 'right' },
  caption: { color: '#EAF2FF', marginTop: 8, textAlign: 'right', lineHeight: 22 },
  section: { color: '#14213D', fontSize: 20, fontWeight: '800', textAlign: 'right' },
  subjectCard: { backgroundColor: '#FFFFFF', borderRadius: 18, padding: 16, borderWidth: 1, borderColor: '#D8E2F0', flexDirection: 'row-reverse', gap: 14 },
  subjectIcon: { fontSize: 34, width: 48, textAlign: 'center' },
  subjectBody: { flex: 1 },
  subjectTitle: { color: '#123A72', fontSize: 20, fontWeight: '800', textAlign: 'right' },
  levels: { flexDirection: 'row-reverse', flexWrap: 'wrap', gap: 8, marginTop: 12 },
  levelButton: { borderWidth: 1, borderColor: '#BFD0E5', borderRadius: 12, paddingVertical: 10, paddingHorizontal: 12 },
  levelText: { color: '#23415F', fontWeight: '700' },
});
