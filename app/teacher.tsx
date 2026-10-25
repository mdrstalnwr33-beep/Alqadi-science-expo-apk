import { router, useLocalSearchParams } from 'expo-router';
import { Pressable, SafeAreaView, ScrollView, StyleSheet, Text, View } from 'react-native';
import { grades, type Grade } from '../src/data';

export default function TeacherScreen() {
  const p = useLocalSearchParams<{ name?: string; code?: string }>();
  const selectGrade = (grade: Grade) => router.replace({
    pathname: '/home',
    params: { role: 'teacher', name: p.name || 'الأستاذ محمد القاضي الوصابي', code: p.code || '', grade, stage: grade },
  });

  return (
    <SafeAreaView style={styles.safe}>
      <ScrollView contentContainerStyle={styles.container}>
        <Pressable onPress={() => router.replace('/')}><Text style={styles.back}>رجوع ›</Text></Pressable>
        <Text style={styles.eyebrow}>تطبيق القاضي للعلوم</Text>
        <Text style={styles.title}>مرحبًا بك في لوحة المعلم 🎓</Text>
        <Text style={styles.subtitle}>اختر الصف الدراسي للانتقال إلى لوحة إدارته.</Text>
        <View style={styles.panel}>
          <Text style={styles.sectionTitle}>اختر الصف الدراسي</Text>
          {grades.map((grade, index) => (
            <Pressable key={grade} style={styles.gradeCard} onPress={() => selectGrade(grade)}>
              <View style={styles.copy}>
                <Text style={styles.gradeTitle}>{grade}</Text>
                <Text style={styles.description}>الكيمياء • الفيزياء • الأحياء</Text>
              </View>
              <Text style={styles.icon}>{['1️⃣', '2️⃣', '3️⃣'][index]}</Text>
            </Pressable>
          ))}
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: '#f4f7fb' },
  container: { flexGrow: 1, padding: 20, paddingTop: 36, justifyContent: 'center' },
  back: { color: '#356ae6', fontWeight: '800', marginBottom: 25, textAlign: 'right' },
  eyebrow: { color: '#356ae6', fontWeight: '900', fontSize: 14, textAlign: 'center', marginBottom: 10 },
  title: { fontSize: 27, fontWeight: '900', color: '#14213d', textAlign: 'center', marginBottom: 8 },
  subtitle: { fontSize: 14, lineHeight: 23, color: '#667085', textAlign: 'center', marginBottom: 24 },
  panel: { backgroundColor: '#eaf2ff', borderRadius: 22, padding: 16, borderWidth: 1, borderColor: '#c7d7fe' },
  sectionTitle: { fontSize: 19, fontWeight: '900', color: '#14213d', textAlign: 'right', marginBottom: 12 },
  gradeCard: { backgroundColor: '#fff', borderRadius: 16, padding: 17, marginBottom: 10, flexDirection: 'row-reverse', alignItems: 'center', justifyContent: 'space-between', borderWidth: 1, borderColor: '#e4e7ec' },
  copy: { flex: 1 },
  gradeTitle: { fontSize: 18, fontWeight: '900', color: '#14213d', textAlign: 'right' },
  description: { fontSize: 12, color: '#667085', textAlign: 'right', marginTop: 5 },
  icon: { fontSize: 28, marginLeft: 12 },
});