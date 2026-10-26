import { router, useLocalSearchParams } from 'expo-router';
import { useCallback, useEffect, useRef, useState } from 'react';
import { ActivityIndicator, FlatList, Image, PixelRatio, Pressable, Text, View, useWindowDimensions, type ViewToken } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { renderPdfPage, type PdfPage } from '../modules/pdf-renderer';
import { downloadPdf, getLocalPdf, pdfErrorMessage } from '../src/pdfStore';
import { C } from '../src/ui';

type State = { status: 'loading'; text: string } | { status: 'error'; message: string } | { status: 'ready'; uri: string; pages: number };

function PdfPageView({ uri, index, width }: { uri: string; index: number; width: number }) {
  const [page, setPage] = useState<PdfPage | null>(null);
  const [failed, setFailed] = useState(false);
  const pixelWidth = Math.round(width * PixelRatio.get());
  useEffect(() => {
    let alive = true; setFailed(false); setPage(null);
    renderPdfPage(uri, index, pixelWidth).then(x => { if (alive) setPage(x); }).catch(() => { if (alive) setFailed(true); });
    return () => { alive = false; };
  }, [uri, index, pixelWidth]);
  const height = page ? (width * page.height) / page.width : width * 1.414;
  return <View style={{ width, height, backgroundColor: '#fff', marginBottom: 10, alignItems: 'center', justifyContent: 'center', borderWidth: 1, borderColor: C.border }}>
    {page ? <Image source={{ uri: page.uri }} style={{ width, height }} resizeMode="contain" /> : failed ? <Text style={{ color: C.muted }}>تعذر عرض الصفحة {index + 1}</Text> : <ActivityIndicator color={C.navy} />}
  </View>;
}

export default function PdfViewerScreen() {
  const params = useLocalSearchParams<{ id?: string; name?: string; url?: string }>();
  const insets = useSafeAreaInsets();
  const { width } = useWindowDimensions();
  const [state, setState] = useState<State>({ status: 'loading', text: 'جاري التحضير…' });
  const [zoom, setZoom] = useState(1);
  const [current, setCurrent] = useState(1);
  const load = useCallback(async () => {
    const id = String(params.id || '');
    if (!id || !params.url) { setState({ status: 'error', message: 'بيانات الملزمة غير مكتملة.' }); return; }
    try {
      setState({ status: 'loading', text: 'جاري البحث عن النسخة المحفوظة…' });
      let local = await getLocalPdf(id);
      if (!local) {
        setState({ status: 'loading', text: 'جاري تنزيل الملزمة وحفظها على الجهاز…' });
        local = await downloadPdf({ id, name: String(params.name || 'الملزمة'), url: String(params.url) });
      }
      setState({ status: 'ready', uri: local.uri, pages: local.pages });
    } catch (e) { setState({ status: 'error', message: pdfErrorMessage(e) }); }
  }, [params.id, params.name, params.url]);
  useEffect(() => { load(); }, [load]);
  const onViewable = useRef(({ viewableItems }: { viewableItems: ViewToken[] }) => { const x = viewableItems[0]; if (x?.index != null) setCurrent(x.index + 1); }).current;
  const pageWidth = Math.min(width - 16, 900) * zoom;
  return <View style={{ flex: 1, backgroundColor: '#e8edf2' }}>
    <View style={{ flexDirection: 'row-reverse', alignItems: 'center', paddingTop: insets.top + 6, paddingBottom: 8, paddingHorizontal: 14, backgroundColor: C.bg, borderBottomWidth: 1, borderBottomColor: C.border }}>
      <Pressable onPress={() => router.back()} style={{ width: 42 }}><Text style={{ fontSize: 38, color: C.navy, lineHeight: 42 }}>‹</Text></Pressable>
      <Text numberOfLines={1} style={{ flex: 1, color: C.navy, fontSize: 18, fontWeight: '800', textAlign: 'right' }}>{params.name || 'الملزمة'}</Text>
    </View>
    {state.status === 'loading' && <View style={{ flex: 1, alignItems: 'center', justifyContent: 'center', gap: 14 }}><ActivityIndicator size="large" color={C.navy} /><Text style={{ color: C.muted }}>{state.text}</Text></View>}
    {state.status === 'error' && <View style={{ flex: 1, alignItems: 'center', justifyContent: 'center', padding: 24, gap: 16 }}><Text style={{ fontSize: 40 }}>⚠️</Text><Text style={{ color: C.text, fontSize: 16, textAlign: 'center', lineHeight: 26 }}>{state.message}</Text><Pressable onPress={load} style={{ backgroundColor: C.navy, borderRadius: 14, paddingVertical: 14, paddingHorizontal: 28 }}><Text style={{ color: '#fff', fontWeight: '800' }}>إعادة المحاولة</Text></Pressable><Pressable onPress={() => router.back()}><Text style={{ color: C.blue, fontWeight: '700' }}>رجوع</Text></Pressable></View>}
    {state.status === 'ready' && <>
      <FlatList data={Array.from({ length: state.pages }, (_, i) => i)} keyExtractor={String} renderItem={({ item }) => <PdfPageView uri={state.uri} index={item} width={pageWidth} />} contentContainerStyle={{ padding: 8, alignItems: 'center' }} initialNumToRender={2} maxToRenderPerBatch={2} windowSize={5} onViewableItemsChanged={onViewable} viewabilityConfig={{ itemVisiblePercentThreshold: 40 }} />
      <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingHorizontal: 20, paddingTop: 8, paddingBottom: insets.bottom + 8, backgroundColor: C.bg, borderTopWidth: 1, borderTopColor: C.border }}>
        <Pressable disabled={zoom <= 1} onPress={() => setZoom(z => Math.max(1, z - .5))} style={{ width: 44, height: 44, borderRadius: 22, backgroundColor: C.navy, alignItems: 'center', justifyContent: 'center', opacity: zoom <= 1 ? .35 : 1 }}><Text style={{ color: '#fff', fontSize: 26 }}>−</Text></Pressable>
        <Text style={{ color: C.navy, fontWeight: '800' }}>صفحة {current} من {state.pages}</Text>
        <Pressable disabled={zoom >= 3} onPress={() => setZoom(z => Math.min(3, z + .5))} style={{ width: 44, height: 44, borderRadius: 22, backgroundColor: C.navy, alignItems: 'center', justifyContent: 'center', opacity: zoom >= 3 ? .35 : 1 }}><Text style={{ color: '#fff', fontSize: 26 }}>+</Text></Pressable>
      </View>
    </>}
  </View>;
}
