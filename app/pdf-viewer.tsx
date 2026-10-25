import { useLocalSearchParams, router } from 'expo-router';
import { useEffect, useMemo, useState } from 'react';
import { ActivityIndicator, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { PdfView } from '@kishannareshpal/expo-pdf';

function normalizeLocalUri(value: string) {
  if (!value) return '';
  if (value.startsWith('file://')) return value;
  return `file://${value.startsWith('/') ? '' : '/'}${value}`;
}

export default function PdfViewerScreen() {
  const params = useLocalSearchParams<{ uri?: string; title?: string; bookId?: string }>();
  const uri = normalizeLocalUri(typeof params.uri === 'string' ? params.uri : '');
  const title = typeof params.title === 'string' ? params.title : 'الملزمة';
  const bookId = typeof params.bookId === 'string' ? params.bookId : uri;
  const progressKey = useMemo(() => `pdf-last-page-${bookId}`, [bookId]);
  const [initialPage, setInitialPage] = useState(1);
  const [ready, setReady] = useState(false);
  const [page, setPage] = useState(1);
  const [pages, setPages] = useState(0);
  const [error, setError] = useState('');

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
        <TouchableOpacity onPress={() => router.back()} style={styles.backButton}>
          <Text style={styles.back}>‹ رجوع</Text>
        </TouchableOpacity>
        <Text numberOfLines={1} style={styles.title}>{title}</Text>
        <Text style={styles.page}>{pages ? `${page} / ${pages}` : ''}</Text>
      </View>

      {!ready ? (
        <View style={styles.center}>
          <ActivityIndicator size="large" />
          <Text style={styles.loading}>جاري تجهيز الملزمة...</Text>
        </View>
      ) : error ? (
        <View style={styles.center}>
          <Text style={styles.errorTitle}>تعذر قراءة ملف PDF</Text>
          <Text style={styles.error}>{error}</Text>
          <TouchableOpacity onPress={() => { setError(''); setReady(false); setTimeout(() => setReady(true), 50); }} style={styles.retry}>
            <Text style={styles.retryText}>إعادة المحاولة</Text>
          </TouchableOpacity>
        </View>
      ) : (
        <PdfView
          key={`${uri}-${initialPage}`}
          uri={uri}
          style={styles.pdf}
          pagingEnabled={false}
          doubleTapToZoom
          fitMode="width"
          autoScale
          onLoadComplete={({ pageCount }) => {
            setPages(pageCount);
            setPage(Math.min(initialPage, pageCount || initialPage));
          }}
          onPageChanged={({ pageIndex, pageCount }) => {
            const nextPage = pageIndex + 1;
            setPage(nextPage);
            setPages(pageCount);
            AsyncStorage.setItem(progressKey, String(nextPage)).catch(() => {});
          }}
          onError={({ code, message }) => {
            console.warn('PDF viewer error', code, message);
            setError(message || 'الملف غير صالح أو لا يمكن قراءته على هذا الجهاز.');
          }}
        />
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#111827' },
  header: { minHeight: 58, paddingHorizontal: 8, flexDirection: 'row', alignItems: 'center', gap: 8, backgroundColor: '#0b1220' },
  backButton: { padding: 8 },
  back: { color: '#fff', fontWeight: '800', fontSize: 15 },
  title: { flex: 1, color: '#fff', textAlign: 'right', fontWeight: '900', fontSize: 16 },
  page: { minWidth: 52, textAlign: 'center', color: '#d1d5db', fontSize: 12 },
  pdf: { flex: 1, width: '100%', backgroundColor: '#e5e7eb' },
  center: { flex: 1, alignItems: 'center', justifyContent: 'center', gap: 12, padding: 24, backgroundColor: '#111827' },
  loading: { color: '#fff', fontSize: 15 },
  errorTitle: { color: '#fff', textAlign: 'center', fontSize: 19, fontWeight: '900' },
  error: { color: '#d1d5db', textAlign: 'center', fontSize: 14, lineHeight: 22 },
  retry: { marginTop: 8, backgroundColor: '#2563eb', borderRadius: 10, paddingHorizontal: 18, paddingVertical: 11 },
  retryText: { color: '#fff', fontWeight: '900' },
});
