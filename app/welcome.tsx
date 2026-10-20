import { router } from 'expo-router';
import { useEffect, useState } from 'react';
import { Pressable, SafeAreaView, StyleSheet, Text, View } from 'react-native';
import { getSession, readJson, writeJson } from '../src/storage';

export default function Welcome() {
  const [ready, setReady] = useState(false);
  const [studentName, setStudentName] = useState('أيها العالم الصغير');
  const [welcomeKey, setWelcomeKey] = useState<string | null>(null);

  useEffect(() => {
    (async () => {
      const session = await getSession();
      if (!session?.active) {
        router.replace('/');
        return;
      }
      if (session.role !== 'student') {
        router.replace('/home');
        return;
      }
      const key = `student-welcome-seen:${session.code || session.name}`;
      const seen = await readJson<boolean>(key, false);
      if (seen) {
        router.replace({ pathname: '/home', params: { role: session.role, name: session.name, grade: session.grade, code: session.code } });
        return;
      }
      setStudentName(session.name || 'أيها العالم الصغير');
      setWelcomeKey(key);
      setReady(true);
    })();
  }, []);

  const startJourney = async () => {
    if (welcomeKey) await writeJson(welcomeKey, true);
    const session = await getSession();
    router.replace({ pathname: '/home', params: { role: session?.role || 'student', name: session?.name || '', grade: session?.grade || '', code: session?.code || '' } });
  };

  if (!ready) return <SafeAreaView style={styles.safe}><View style={styles.center}><Text style={styles.loader}>🔬</Text><Text style={styles.loadingText}>نجهّز رحلتك العلمية…</Text></View></SafeAreaView>;

  return (
    <SafeAreaView style={styles.safe}>
      <View style={styles.container}>
        <View style={styles.glow}><Text style={styles.hero}>🧪✨</Text></View>
        <Text style={styles.greeting}>أهلاً بك {studentName}!</Text>
        <Text style={styles.title}>مرحبًا بك في تطبيق القاضي للعلوم 🔬</Text>
        <Text style={styles.message}>من اليوم تبدأ رحلتك العلمية...</Text>
        <View style={styles.card}>
          <Text style={styles.line}>🧠 كل سؤال تجيب عنه يجعلك أقوى.</Text>
          <Text style={styles.line}>🔥 كل يوم تتعلم فيه يقرّبك من القمة.</Text>
          <Text style={styles.line}>🏅 وكل إنجاز تحققه يطوّر عالمك ومختبرك الافتراضي.</Text>
        </View>
        <Text style={styles.ready}>هل أنت مستعد لبدء رحلتك؟</Text>
        <Pressable style={styles.primary} onPress={startJourney}>
          <Text style={styles.primaryText}>🚀 ابدأ رحلتي العلمية</Text>
        </Pressable>
        <Text style={styles.footer}>لنكتشف العلم معًا 🌟</Text>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: '#f5f7fb' },
  container: { flex: 1, justifyContent: 'center', padding: 24, alignItems: 'center' },
  center: { flex: 1, justifyContent: 'center', alignItems: 'center' },
  loader: { fontSize: 52 },
  loadingText: { marginTop: 12, color: '#667085', fontSize: 16, fontWeight: '700' },
  glow: { width: 116, height: 116, borderRadius: 58, backgroundColor: '#e8f1ff', justifyContent: 'center', alignItems: 'center', marginBottom: 20 },
  hero: { fontSize: 55 },
  greeting: { fontSize: 28, fontWeight: '900', color: '#17324d', textAlign: 'center', marginBottom: 12 },
  title: { fontSize: 20, fontWeight: '900', color: '#356ae6', textAlign: 'center', lineHeight: 30 },
  message: { fontSize: 18, fontWeight: '800', color: '#344054', textAlign: 'center', marginTop: 22, marginBottom: 18 },
  card: { width: '100%', backgroundColor: '#fff', borderRadius: 22, padding: 20, borderWidth: 1, borderColor: '#eaecf0', gap: 14, marginBottom: 22 },
  line: { fontSize: 15, lineHeight: 24, color: '#344054', fontWeight: '700', textAlign: 'right' },
  ready: { fontSize: 17, fontWeight: '900', color: '#17324d', marginBottom: 14 },
  primary: { width: '100%', backgroundColor: '#17324d', borderRadius: 18, paddingVertical: 17, alignItems: 'center' },
  primaryText: { color: '#fff', fontSize: 18, fontWeight: '900' },
  footer: { marginTop: 16, color: '#667085', fontSize: 14, fontWeight: '700' },
});
