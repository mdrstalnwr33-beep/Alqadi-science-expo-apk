import React, { useEffect, useMemo, useState } from 'react';
import { ActivityIndicator, Alert, ScrollView, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import * as FileSystem from 'expo-file-system';
import { collection, getDocs, query, where } from 'firebase/firestore';
import { db, firebaseReady } from './src/firebaseConfig';

export default function StudentBooksScreen({ level = 'first', subject = 'chemistry', localItems = [], onBack }) {
  const [items, setItems] = useState(Array.isArray(localItems) ? localItems : []);
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState('');

  useEffect(() => {
    let alive = true;
    const load = async () => {
      if (!firebaseReady || !db) return;
      setLoading(true);
      try {
        const snap = await getDocs(query(collection(db, 'content'), where('level', '==', level), where('subject', '==', subject), where('category', '==', 'books')));
        const cloud = snap.docs.map((d) => ({ id: d.id, ...d.data() })).filter((x) => x && x.title);
        if (alive && cloud.length) setItems((old) => [...old.filter((x) => !cloud.some((c) => c.id === x.id)), ...cloud]);
      } catch (error) {
        // لا نعرض خطأ قاتلًا؛ تبقى الكتب المحلية متاحة.
        if (alive) setMessage('تعذر الاتصال بالسحابة، وتظهر الكتب المحفوظة على الهاتف.');
      } finally {
        if (alive) setLoading(false);
      }
    };
    load();
    return () => { alive = false; };
  }, [level, subject]);

  const safeItems = useMemo(() => (Array.isArray(items) ? items : []).filter((x) => x && typeof x === 'object'), [items]);
  const download = async (item) => {
    if (!item?.url) return Alert.alert('الكتاب', 'هذا محتوى نصي محفوظ داخل التطبيق ويمكن قراءته دون اتصال.');
    try {
      const target = `${FileSystem.documentDirectory}${String(item.id || Date.now())}.pdf`;
      await FileSystem.downloadAsync(item.url, target);
      Alert.alert('تم التنزيل', 'تم حفظ الكتاب على الهاتف ويمكن فتحه دون اتصال.');
    } catch (error) {
      Alert.alert('تعذر التنزيل', 'تحقق من الإنترنت ثم حاول مرة أخرى.');
    }
  };

  return (
    <ScrollView contentContainerStyle={styles.container}>
      <View style={styles.headerRow}>
        <TouchableOpacity onPress={onBack} style={styles.back}><Text style={styles.backText}>رجوع</Text></TouchableOpacity>
        <View style={styles.headerCopy}><Text style={styles.title}>الكتب والملازم</Text><Text style={styles.meta}>{level} • {subject}</Text></View>
      </View>
      {loading ? <View style={styles.loading}><ActivityIndicator color="#d97706" /><Text style={styles.muted}>جاري تحديث الكتب...</Text></View> : null}
      {message ? <Text style={styles.notice}>{message}</Text> : null}
      {safeItems.length ? safeItems.map((item, index) => (
        <View style={styles.card} key={item.id || `book-${index}`}>
          <View style={styles.copy}><Text style={styles.bookTitle}>{String(item.title || 'كتاب دراسي')}</Text><Text style={styles.detail}>{String(item.detail || (item.url ? 'ملف PDF' : 'محتوى نصي'))}</Text>{item.body ? <Text style={styles.body}>{String(item.body)}</Text> : null}</View>
          <TouchableOpacity style={styles.button} onPress={() => download(item)}><Text style={styles.buttonText}>{item.url ? 'تنزيل PDF' : 'قراءة'}</Text></TouchableOpacity>
        </View>
      )) : <View style={styles.empty}><Text style={styles.emptyText}>لا توجد كتب أو ملازم منشورة لهذا المستوى والمادة حاليًا.</Text></View>}
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { flexGrow: 1, padding: 18, backgroundColor: '#f4f7fb' },
  headerRow: { flexDirection: 'row-reverse', alignItems: 'center', marginBottom: 14 },
  headerCopy: { flex: 1 }, title: { color: '#12233f', fontSize: 23, fontWeight: '900', textAlign: 'right' },
  meta: { color: '#77869c', textAlign: 'right', marginTop: 4 }, back: { padding: 10, marginLeft: 10 }, backText: { color: '#1f5eff', fontWeight: '900' },
  loading: { flexDirection: 'row-reverse', alignItems: 'center', justifyContent: 'center', gap: 8, marginBottom: 10 }, muted: { color: '#77869c' },
  notice: { backgroundColor: '#fff5d8', color: '#8a5a00', padding: 12, borderRadius: 12, textAlign: 'right', marginBottom: 10 },
  card: { backgroundColor: '#fff', borderRadius: 16, padding: 15, marginBottom: 10, flexDirection: 'row-reverse', alignItems: 'center' }, copy: { flex: 1, paddingHorizontal: 10, alignItems: 'flex-end' },
  bookTitle: { color: '#12233f', fontSize: 16, fontWeight: '900', textAlign: 'right' }, detail: { color: '#77869c', fontSize: 12, marginTop: 4, textAlign: 'right' }, body: { color: '#475569', marginTop: 8, lineHeight: 20, textAlign: 'right' },
  button: { backgroundColor: '#d97706', paddingVertical: 10, paddingHorizontal: 12, borderRadius: 10 }, buttonText: { color: '#fff', fontWeight: '900', fontSize: 12 },
  empty: { backgroundColor: '#fff', borderRadius: 16, padding: 25 }, emptyText: { color: '#77869c', textAlign: 'center', lineHeight: 22 },
});
