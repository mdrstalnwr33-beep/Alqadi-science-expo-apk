import { router } from 'expo-router';
import { Pressable, StyleSheet, Text, TextInput, View } from 'react-native';
import { useState } from 'react';

export default function Homework() {
  const [answer, setAnswer] = useState('');
  return <View style={styles.container}><Text style={styles.title}>واجب الوحدة الأولى</Text><Text style={styles.label}>إجابة الطالب</Text><TextInput multiline value={answer} onChangeText={setAnswer} placeholder="اكتب إجابتك هنا" placeholderTextColor="#8A97A8" style={styles.input} textAlign="right"/><Pressable style={styles.button} onPress={() => router.replace('/homework-sent')}><Text style={styles.buttonText}>إرسال الواجب للمعلم</Text></Pressable></View>;
}
const styles = StyleSheet.create({ container: { flex: 1, padding: 20, backgroundColor: '#F5F8FC' }, title: { fontSize: 26, fontWeight: '800', color: '#123A72', textAlign: 'right', marginBottom: 24 }, label: { color: '#334A66', fontWeight: '800', textAlign: 'right', marginBottom: 8 }, input: { minHeight: 180, backgroundColor: '#FFFFFF', borderWidth: 1, borderColor: '#CBD7E6', borderRadius: 16, padding: 15, fontSize: 16, textAlignVertical: 'top', color: '#172A46' }, button: { backgroundColor: '#123A72', borderRadius: 14, padding: 16, alignItems: 'center', marginTop: 16 }, buttonText: { color: '#FFFFFF', fontWeight: '800', fontSize: 17 } });
