import { useLocalSearchParams, router } from 'expo-router';
import { useEffect, useMemo, useState } from 'react';
import { ActivityIndicator, Alert, Dimensions, StyleSheet, Text, View } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import Pdf from 'react-native-pdf';

export default function PdfViewerScreen() {
  const params = useLocalSearchParams<{ uri?: string; title?: string; bookId?: string }>();
  const uri = typeof params.uri === 'string' ? params.uri : '';
  const title = typeof params.title === 'string' ? params.title : 'الملزمة';
  const bookId = typeof params.bookId === 'string' ? params.bookId : uri;
  const progressKey = useMemo(() => `pdf-last-page-${bookId}`, [bookId]);
  const [initialPage, setInitialPage] = useState(1);
  const [ready, setReady] = useState(false);
  const [page, setPage] = useState(1);
  const [pages, setPages] = useState(0);

  useEffect(() => {
    let active = true;
    AsyncStorage.getItem(progressKey).then((value) => {
      if (!active) return;
      const saved = Number(value || 1);
      setInitialPage(Number.isFinite(saved) && saved > 0 ? saved : 1);
      setReady(true);
    });
    return () => { active = false; };
  }, [progressKey]);

  if (!uri) {
    return (
      <View style={styles.center}>
        <Text style={styles.error}>لم يتم العثور على ملف PDF.</Text>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <Text onPress={() => router.back()} style={styles.back}>رجوع</Text>
        <Text numberOfLines={1} style={styles.title}>{title}</Text>
        <Text style={styles.page}>{pages ? `${page} / ${pages}` : ''}</Text>
      </View>
      {!ready ? (
        <View style={styles.center}>
          <ActivityIndicator size="large" />
          <Text style={styles.loading}>جاري تجهيز الملزمة...</Text>
        </View>
      ) : (
        <Pdf
          source={{ uri }}
          page={initialPage}
          enablePaging={false}
          enableDoubleTapZoom
          trustAllCerts={false}
          onLoadComplete={(numberOfPages) => {
            setPages(numberOfPages);
            setPage(Math.min(initialPage, numberOfPages || initialPage));
          }}
          onPageChanged={(nextPage) => {
            setPage(nextPage);
            AsyncStorage.setItem(progressKey, String(nextPage)).catch(() => {});
          }}
          onError={(error) => {
            Alert.alert('تعذر عرض الملزمة', 'الملف محفوظ على الجهاز، لكن تعذر قراءته. حاول فتحه مرة أخرى.');
            console.warn('PDF viewer error', error);
          }}
          style={styles.pdf}
        />
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#111827' },
  header: { minHeight: 58, paddingHorizontal: 12, flexDirection: 'row', alignItems: 'center', gap: 10, backgroundColor: '#0b1220' },
  back: { color: '#fff', fontWeight: '800', fontSize: 15, padding: 8 },
  title: { flex: 1, color: '#fff', textAlign: 'right', fontWeight: '900', fontSize: 16 },
  page: { minWidth: 48, textAlign: 'center', color: '#d1d5db', fontSize: 12 },
  pdf: { flex: 1, width: Dimensions.get('window').width, backgroundColor: '#e5e7eb' },
  center: { flex: 1, alignItems: 'center', justifyContent: 'center', gap: 12, padding: 24 },
  loading: { color: '#fff', fontSize: 15 },
  error: { color: '#fff', textAlign: 'center', fontSize: 16 },
});
