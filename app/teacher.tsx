import { router } from 'expo-router';
import { useState } from 'react';
import { Pressable, SafeAreaView, ScrollView, StyleSheet, Text, View } from 'react-native';
import { grades, type Grade } from '../src/data';

export default function TeacherScreen() {
  const [grade, setGrade] = useState<Grade>(grades[0]);

  const actions = [
    { title: 'إضافة درس جديد', subtitle: 'انشر درسًا للصف المحدد', icon: '📘', route: '/create-lesson' },
    { title: 'إنشاء اختبار', subtitle: 'أضف أسئلة وانشر الاختبار', icon: '📝', route: '/create-exam' },
    { title: 'إنشاء واجب', subtitle: 'أرسل واجبًا للطلاب', icon: '📚', route: '/create-homework' },
    { title: 'درجات الطلاب', subtitle: 'متابعة نتائج الطلاب', icon: '📊', route: '/results' },
  ] as const;

  return (
    <SafeAreaView style={styles.safe}>
      <ScrollView contentContainerStyle={styles.container}>
        <Pressable onPress={() => router.back()}><Text style={styles.back}>رجوع ›</Text></Pressable>
        <Text style={styles.title}>لوحة المعلم</Text>
        <Text style={styles.subtitle}>اختر الصف الدراسي أولًا لتوجيه المحتوى إليه.</Text>
        <View style={styles.gradePanel}>
          <Text style={styles.sectionTitle}>🎓 الصف الدراسي</Text>
          <View style={styles.grades}>
            {grades.map((item) => (
              <Pressable key={item} onPress={() => setGrade(item)} style={[styles.gradeChip, grade === item && styles.gradeSelected]}>
                <Text style={[styles.gradeText, grade === item && styles.gradeTextSelected]}>{item}</Text>
              </Pressable>
            ))}
          </View>
          <Text style={styles.selected}>الصف المحدد: {grade}</Text>
        </View>
        <Text style={styles.sectionTitle}>إدارة الصف</Text>
        {actions.map((item) => (
          <Pressable key={item.title} style={styles.card} onPress={() => router.push({ pathname: item.route as any, params: { grade } })}>
            <View style={styles.cardCopy}>
              <Text style={styles.text}>{item.title}</Text>
              <Text style={styles.description}>{item.subtitle}</Text>
            </View>
            <Text style={styles.icon}>{item.icon}</Text>
          </Pressable>
        ))}
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: '#f4f7fb' },
  container: { padding: 20, paddingBottom: 36 },
  back: { color: '#356ae6', fontWeight: '800', marginBottom: 18, textAlign: 'right' },
  title: { fontSize: 27, fontWeight: '900', color: '#14213d', textAlign: 'right', marginBottom: 6 },
  subtitle: { fontSize: 14, color: '#667085', textAlign: 'right', marginBottom: 18, lineHeight: 22 },
  gradePanel: { backgroundColor: '#eaf2ff', borderRadius: 18, padding: 16, marginBottom: 22, borderWidth: 1, borderColor: '#c7d7fe' },
  sectionTitle: { fontSize: 18, fontWeight: '900', color: '#14213d', textAlign: 'right', marginBottom: 12 },
  grades: { flexDirection: 'row-reverse', flexWrap: 'wrap', gap: 8 },
  gradeChip: { backgroundColor: '#fff', borderWidth: 1, borderColor: '#d0d5dd', borderRadius: 12, paddingVertical: 11, paddingHorizontal: 12 },
  gradeSelected: { backgroundColor: '#173b70', borderColor: '#173b70' },
  gradeText: { color: '#344054', fontWeight: '800', fontSize: 13 },
  gradeTextSelected: { color: '#fff' },
  selected: { color: '#173b70', fontWeight: '800', textAlign: 'right', marginTop: 12 },
  card: { backgroundColor: '#fff', borderRadius: 18, padding: 18, marginBottom: 12, flexDirection: 'row-reverse', alignItems: 'center', justifyContent: 'space-between', elevation: 2 },
  cardCopy: { flex: 1 },
  text: { fontSize: 17, fontWeight: '800', color: '#101828', textAlign: 'right' },
  description: { fontSize: 13, color: '#667085', textAlign: 'right', marginTop: 5 },
  icon: { fontSize: 25, marginLeft: 14 },
});