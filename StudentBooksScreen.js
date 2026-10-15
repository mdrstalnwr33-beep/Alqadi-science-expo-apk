import React, { useEffect, useMemo, useState } from 'react';
import { Alert, ScrollView, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import * as FileSystem from 'expo-file-system';

export default function StudentBooksScreen({ level = 'first', subject = 'chemistry', localItems = [], onBack }) {
  const safeLocal = useMemo(
    () => (Array.isArray(localItems) ? localItems : []).filter((x) => x && typeof x === 'object'),
    [localItems],
  );
  const [items, setItems] = useState(safeLocal);

  // هذه الصفحة محلية عمداً: فشل Firebase لا يمكن أن يمنع فتح الكتب والملازم.
  useEffect(() => {
    setItems(safeLocal);
  }, [safeLocal]);

  const download = async (item) => {
    if (!item?.url) {
      Alert.alert('الكتاب', 'هذا محتوى نصي محفوظ داخل التطبيق ويمكن قراءته دون اتصال.');
      return;
    }
    try {
      const target = `${FileSystem.documentDirectory}${String(item.id || Date.now())}.pdf`;
      await FileSystem.downloadAsync(item.url, target);
      Alert.alert('تم التنزيل', 'تم حفظ الكتاب على الهاتف ويمكن فتحه دون اتصال.');
    } catch (_) {
      Alert.alert('تعذر التنزيل', 'تحقق من الإنترنت ثم حاول مرة أخرى.');
    }
  };

  return (
    <ScrollView contentContainerStyle={styles.container}>
      <View style={styles.headerRow}>
        <TouchableOpacity onPress={onBack} style={styles.back}>
          <Text style={styles.backText}>رجوع</Text>
        </TouchableOpacity>
        <View style={styles.headerCopy}>
          <Text style={styles.title}>الكتب والملازم</Text>
          <Text style={styles.meta}>{level} • {subject}</Text>
        </View>
      </View>

      {items.length ? items.map((item, index) => (
        <View style={styles.card} key={item.id || `book-${index}`}>
          <View style={styles.copy}>
            <Text style={styles.bookTitle}>{String(item.title || 'كتاب دراسي')}</Text>
            <Text style={styles.detail}>{String(item.detail || (item.url ? 'ملف PDF' : 'محتوى نصي'))}</Text>
            {item.body ? <Text style={styles.body}>{String(item.body)}</Text> : null}
          </View>
          <TouchableOpacity style={styles.button} onPress={() => download(item)}>
            <Text style={styles.buttonText}>{item.url ? 'تنزيل PDF' : 'قراءة'}</Text>
          </TouchableOpacity>
        </View>
      )) : (
        <View style={styles.empty}>
          <Text style={styles.emptyText}>لا توجد كتب أو ملازم منشورة لهذا المستوى والمادة حاليًا.</Text>
        </View>
      )}
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { flexGrow: 1, padding: 18, backgroundColor: '#f4f7fb' },
  headerRow: { flexDirection: 'row-reverse', alignItems: 'center', marginBottom: 14 },
  headerCopy: { flex: 1 },
  title: { color: '#12233f', fontSize: 23, fontWeight: '900', textAlign: 'right' },
  meta: { color: '#77869c', textAlign: 'right', marginTop: 4 },
  back: { padding: 10, marginLeft: 10 },
  backText: { color: '#1f5eff', fontWeight: '900' },
  card: { backgroundColor: '#fff', borderRadius: 16, padding: 15, marginBottom: 10, flexDirection: 'row-reverse', alignItems: 'center' },
  copy: { flex: 1, paddingHorizontal: 10, alignItems: 'flex-end' },
  bookTitle: { color: '#12233f', fontSize: 16, fontWeight: '900', textAlign: 'right' },
  detail: { color: '#77869c', fontSize: 12, marginTop: 4, textAlign: 'right' },
  body: { color: '#475569', marginTop: 8, lineHeight: 20, textAlign: 'right' },
  button: { backgroundColor: '#d97706', paddingVertical: 10, paddingHorizontal: 12, borderRadius: 10 },
  buttonText: { color: '#fff', fontWeight: '900', fontSize: 12 },
  empty: { backgroundColor: '#fff', borderRadius: 16, padding: 25 },
  emptyText: { color: '#77869c', textAlign: 'center', lineHeight: 22 },
});
