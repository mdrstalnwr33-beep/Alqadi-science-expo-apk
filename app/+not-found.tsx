import { Link } from 'expo-router';
import { StyleSheet, Text, View } from 'react-native';

export default function NotFoundScreen() {
  return (
    <View style={styles.container}>
      <Text style={styles.title}>الصفحة غير موجودة</Text>
      <Link href="/home" style={styles.link}>العودة للرئيسية</Link>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, alignItems: 'center', justifyContent: 'center', padding: 24 },
  title: { fontSize: 22, fontWeight: '800', marginBottom: 16 },
  link: { color: '#356ae6', fontSize: 16, fontWeight: '700' }
});
