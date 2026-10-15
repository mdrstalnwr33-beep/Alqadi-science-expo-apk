import { router } from 'expo-router';
import { Pressable, StyleSheet, Text, View } from 'react-native';

export default function Result() {
  return <View style={styles.container}><Text style={styles.icon}>✓</Text><Text style={styles.title}>تم تسليم الاختبار</Text><Text style={styles.text}>تم تسجيل التسليم. لن يظهر زر إعادة المحاولة بعد التسليم في النسخة النهائية.</Text><Pressable style={styles.button} onPress={() => router.replace('/dashboard')}><Text style={styles.buttonText}>العودة للمواد</Text></Pressable></View>;
}
const styles = StyleSheet.create({ container: { flex: 1, padding: 24, alignItems: 'center', justifyContent: 'center', backgroundColor: '#F5F8FC' }, icon: { width: 74, height: 74, borderRadius: 37, backgroundColor: '#DDF6F0', color: '#0F766E', fontSize: 48, textAlign: 'center', lineHeight: 74, overflow: 'hidden' }, title: { color: '#123A72', fontSize: 26, fontWeight: '800', marginTop: 18 }, text: { color: '#5C6B80', fontSize: 15, lineHeight: 24, textAlign: 'center', marginTop: 9, maxWidth: 340 }, button: { backgroundColor: '#123A72', borderRadius: 14, padding: 15, marginTop: 22, minWidth: 190, alignItems: 'center' }, buttonText: { color: '#FFFFFF', fontWeight: '800' } });
