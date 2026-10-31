import { router } from 'expo-router';
import { StyleSheet, Text, View, Pressable } from 'react-native';

export default function NotFoundScreen() {
  return (
    <View style={styles.container}>
      <Text style={styles.title}>الصفحة غير موجودة</Text>
      <Text style={styles.note}>يبدو أن الرابط القديم لم يعد متاحًا.</Text>
      <Pressable onPress={() => router.back()} style={styles.button}>
        <Text style={styles.link}>‹ العودة للصفحة السابقة</Text>
      </Pressable>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, alignItems: 'center', justifyContent: 'center', padding: 24 },
  title: { fontSize: 22, fontWeight: '800', marginBottom: 10 },
  note: { fontSize: 14, color: '#667085', marginBottom: 18, textAlign: 'center' },
  button: { backgroundColor: '#356ae6', borderRadius: 14, paddingHorizontal: 22, paddingVertical: 13 },
  link: { color: '#fff', fontSize: 16, fontWeight: '700' }
});
