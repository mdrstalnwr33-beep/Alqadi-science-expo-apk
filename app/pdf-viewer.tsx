import { router, useLocalSearchParams } from 'expo-router';
import { useCallback, useEffect, useRef, useState } from 'react';
import { ActivityIndicator, FlatList, Image, PanResponder, PixelRatio, Pressable, Text, View, useWindowDimensions, type GestureResponderEvent, type ViewToken } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { renderPdfPage, type PdfPage } from '../modules/pdf-renderer';
import { downloadPdf, getLocalPdf, pdfErrorMessage } from '../src/pdfStore';
import { C } from '../src/ui';

type State = { status: 'loading'; text: string } | { status: 'error'; message: string } | { status: 'ready'; uri: string; pages: number };

function touchDistance(event: GestureResponderEvent): number {
  const touches = event.nativeEvent.touches;
  if (touches.length < 2) return 0;
  const a = touches[0]; const b = touches[1];
  const dx = a.pageX - b.pageX; const dy = a.pageY - b.pageY;
  return Math.sqrt(dx * dx + dy * dy);
}

function PdfPageView({ uri, index, width, zoom, onPinchStart, onPinchMove, onPinchEnd }: {
  uri: string; index: number; width: number; zoom: number;
  onPinchStart: (event: GestureResponderEvent) => void;
  onPinchMove: (event: GestureResponderEvent) => void;
  onPinchEnd: () => void;
}) {
  const [page, setPage] = useState<PdfPage | null>(null);
  const [failed, setFailed] = useState(false);
  const pixelWidth = Math.round(width * PixelRatio.get());
  useEffect(() => {
    let alive = true;
    setFailed(false);
    setPage(null);
    renderPdfPage(uri, index, pixelWidth).then(x => { if (alive) setPage(x); }).catch(() => { if (alive) setFailed(true); });
    return () => { alive = false; };
  }, [uri, index, pixelWidth]);
  const height = page ? (width * page.height) / page.width : width * 1.414;
  const panResponder = useRef(PanResponder.create({
    onStartShouldSetPanResponder: e => e.nativeEvent.touches.length >= 2,
    onMoveShouldSetPanResponder: e => e.nativeEvent.touches.length >= 2,
    onPanResponderGrant: e => { if (e.nativeEvent.touches.length >= 2) onPinchStart(e); },
    onPanResponderMove: e => { if (e.nativeEvent.touches.length >= 2) onPinchMove(e); },
    onPanResponderRelease: onPinchEnd,
    onPanResponderTerminate: onPinchEnd,
  })).current;

  return <View {...panResponder.panHandlers} style={{ width, height, backgroundColor: '#fff', marginBottom: 10, alignItems: 'center', justifyContent: 'center', borderWidth: 1, borderColor: C.border, overflow: 'visible' }}>
    <View style={{ width, height, transform: [{ scale: zoom }] }}>
      {page ? <Image source={{ uri: page.uri }} style={{ width, height }} resizeMode="contain" /> : failed ? <View style={{ flex: 1, alignItems: 'center', justifyContent: 'center' }}><Text style={{ color: C.muted }}>تعذر عرض الصفحة {index + 1}</Text></View> : <View style={{ flex: 1, alignItems: 'center', justifyContent: 'center' }}><ActivityIndicator color={C.navy} /></View>}
    </View>
  </View>;
}

export default function PdfViewerScreen() {
  const params = useLocalSearchParams<{ id?: string; bookId?: string; name?: string; title?: string; url?: string; uri?: string }>();
  const insets = useSafeAreaInsets();
  const { width } = useWindowDimensions();
  const [state, setState] = useState<State>({ status: 'loading', text: 'جاري التحضير…' });
  const [zoom, setZoom] = useState(1);
  const [current, setCurrent] = useState(1);
  const pinchStartDistance = useRef(0);
  const pinchStartZoom = useRef(1);

  const load = useCallback(async () => {
    const id = String(params.bookId || params.id || '');
    const passedLocalUri = String(params.uri || '').trim();
    const displayName = String(params.name || params.title || 'الملزمة');
    try {
      if (passedLocalUri) {
        setState({ status: 'loading', text: 'جاري فتح النسخة المحفوظة…' });
        const probe = await getLocalPdf(id);
        if (probe && probe.uri === passedLocalUri) { setState({ status: 'ready', uri: probe.uri, pages: probe.pages }); return; }
        setState({ status: 'ready', uri: passedLocalUri, pages: probe?.pages || 1 }); return;
      }
      if (!id) { setState({ status: 'error', message: 'بيانات الملزمة غير مكتملة.' }); return; }
      setState({ status: 'loading', text: 'جاري البحث عن النسخة المحفوظة…' });
      let local = await getLocalPdf(id);
      if (!local) {
        if (!params.url) { setState({ status: 'error', message: 'هذه الملزمة غير محفوظة على الجهاز، وتحتاج إلى الإنترنت لتنزيلها أول مرة.' }); return; }
        setState({ status: 'loading', text: 'جاري تنزيل الملزمة وحفظها على الجهاز…' });
        local = await downloadPdf({ id, name: displayName, url: String(params.url) });
      }
      setState({ status: 'ready', uri: local.uri, pages: local.pages });
    } catch (e) { setState({ status: 'error', message: pdfErrorMessage(e) }); }
  }, [params.bookId, params.id, params.name, params.title, params.url, params.uri]);

  useEffect(() => { load(); }, [load]);
  const onViewable = useRef(({ viewableItems }: { viewableItems: ViewToken[] }) => { const x = viewableItems[0]; if (x?.index != null) setCurrent(x.index + 1); }).current;
  const pageWidth = Math.min(width - 16, 900);

  const pinchStart = (event: GestureResponderEvent) => {
    const distance = touchDistance(event);
    if (distance > 0) { pinchStartDistance.current = distance; pinchStartZoom.current = zoom; }
  };
  const pinchMove = (event: GestureResponderEvent) => {
    const distance = touchDistance(event);
    if (!pinchStartDistance.current || !distance) return;
    const next = Math.max(1, Math.min(3, pinchStartZoom.current * (distance / pinchStartDistance.current)));
    setZoom(next);
  };
  const pinchEnd = () => { pinchStartDistance.current = 0; };

  return <View style={{ flex: 1, backgroundColor: '#e8edf2' }}>
    <View style={{ flexDirection: 'row-reverse', alignItems: 'center', paddingTop: insets.top + 6, paddingBottom: 8, paddingHorizontal: 14, backgroundColor: C.bg, borderBottomWidth: 1, borderBottomColor: C.border }}>
      <Pressable onPress={() => router.back()} style={{ width: 42 }}><Text style={{ fontSize: 38, color: C.navy, lineHeight: 42 }}>‹</Text></Pressable>
      <Text numberOfLines={1} style={{ flex: 1, color: C.navy, fontSize: 18, fontWeight: '800', textAlign: 'right' }}>{params.name || params.title || 'الملزمة'}</Text>
    </View>
    {state.status === 'loading' && <View style={{ flex: 1, alignItems: 'center', justifyContent: 'center', gap: 14 }}><ActivityIndicator size="large" color={C.navy} /><Text style={{ color: C.muted }}>{state.text}</Text></View>}
    {state.status === 'error' && <View style={{ flex: 1, alignItems: 'center', justifyContent: 'center', padding: 24, gap: 16 }}><Text style={{ fontSize: 40 }}>⚠️</Text><Text style={{ color: C.text, fontSize: 16, textAlign: 'center', lineHeight: 26 }}>{state.message}</Text><Pressable onPress={load} style={{ backgroundColor: C.navy, borderRadius: 14, paddingVertical: 14, paddingHorizontal: 28 }}><Text style={{ color: '#fff', fontWeight: '800' }}>إعادة المحاولة</Text></Pressable><Pressable onPress={() => router.back()}><Text style={{ color: C.blue, fontWeight: '700' }}>رجوع</Text></Pressable></View>}
    {state.status === 'ready' && <>
      <FlatList data={Array.from({ length: state.pages }, (_, i) => i)} keyExtractor={String} renderItem={({ item }) => <PdfPageView uri={state.uri} index={item} width={pageWidth} zoom={zoom} onPinchStart={pinchStart} onPinchMove={pinchMove} onPinchEnd={pinchEnd} />} contentContainerStyle={{ padding: 8, alignItems: 'center' }} initialNumToRender={2} maxToRenderPerBatch={2} windowSize={5} onViewableItemsChanged={onViewable} viewabilityConfig={{ itemVisiblePercentThreshold: 40 }} />
      <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingHorizontal: 20, paddingTop: 8, paddingBottom: insets.bottom + 8, backgroundColor: C.bg, borderTopWidth: 1, borderTopColor: C.border }}>
        <Pressable disabled={zoom <= 1} onPress={() => setZoom(z => Math.max(1, z - .5))} style={{ width: 44, height: 44, borderRadius: 22, backgroundColor: C.navy, alignItems: 'center', justifyContent: 'center', opacity: zoom <= 1 ? .35 : 1 }}><Text style={{ color: '#fff', fontSize: 26 }}>−</Text></Pressable>
        <Text style={{ color: C.navy, fontWeight: '800' }}>صفحة {current} من {state.pages} • {Math.round(zoom * 100)}%</Text>
        <Pressable disabled={zoom >= 3} onPress={() => setZoom(z => Math.min(3, z + .5))} style={{ width: 44, height: 44, borderRadius: 22, backgroundColor: C.navy, alignItems: 'center', justifyContent: 'center', opacity: zoom >= 3 ? .35 : 1 }}><Text style={{ color: '#fff', fontSize: 26 }}>+</Text></Pressable>
      </View>
    </>}
  </View>;
}
