import { router, useLocalSearchParams } from 'expo-router';
import { Pressable, StyleSheet, Text, TextInput, View } from 'react-native';
import { useState } from 'react';

export default function Login() {
  const params = useLocalSearchParams<{ role?: string }>();
  const role = params.role === 'teacher' ? 'teacher' : 'student';
  const [code, setCode] = useState('');

  const submit = () => {
    router.replace({ pathname: '/dashboard', params: { role, code: code.trim() || 'demo' } });
  };

  return (
    <View style={styles.container}>
      <Text style={styles.title}>{role === 'teacher' ? 'دخول المعلم' : 'دخول الطالب'}</Text>
      <Text style={styles.hint}>{role === 'teacher' ? 'أدخل رمز المعلم للمتابعة.' : 'أدخل رمز الطالب للمتابعة.'}</Text>
      <TextInput
        value={code}
        onChangeText={setCode}
        placeholder="الرمز"
        placeholderTextColor="#8794A8"
        style={styles.input}
        textAlign="right"
        autoCapitalize="none"
      />
      <Pressable style={styles.button} onPress={submit}>
        <Text style={styles.buttonText}>دخول</Text>
      </Pressable>
      <Pressable onPress={() => router.back()} style={styles.secondary}>
        <Text style={styles.secondaryText}>العودة</Text>
      </Pressable>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, padding: 24, justifyContent: 'center', backgroundColor: '#F5F8FC' },
  title: { fontSize: 28, fontWeight: '800', color: '#123A72', textAlign: 'right' },
  hint: { color: '#65748A', fontSize: 15, marginTop: 8, marginBottom: 22, textAlign: 'right', lineHeight: 23 },
  input: { backgroundColor: '#FFFFFF', borderWidth: 1, borderColor: '#CCD8E8', borderRadius: 14, padding: 16, fontSize: 17, color: '#14213D' },
  button: { marginTop: 16, backgroundColor: '#123A72', borderRadius: 14, padding: 16, alignItems: 'center' },
  buttonText: { color: '#FFFFFF', fontSize: 17, fontWeight: '800' },
  secondary: { padding: 16, alignItems: 'center' },
  secondaryText: { color: '#123A72', fontWeight: '700' },
});
