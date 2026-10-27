import { router, useLocalSearchParams } from 'expo-router';
import { useCallback, useState } from 'react';
import { useFocusEffect } from '@react-navigation/native';
import { Text } from 'react-native';
import { getLibrary, getLocalPdf, type PdfLibrary } from '../src/pdfStore';
import { Action, Card, Page, Section, C } from '../src/ui';

export default function DownloadedBooksScreen() {
  const p = useLocalSearchParams<{ role?: string; name?: string; grade?: string; code?: string }>();
  const [library, setLibrary] = useState<PdfLibrary>({});

  useFocusEffect(useCallback(() => {
    let alive = true;
    getLibrary().then(value => { if (alive) setLibrary(value); });
    return () => { alive = false; };
  }, []));

  const entries = Object.entries(library).sort((a, b) => (b[1].savedAt || 0) - (a[1].savedAt || 0));

  const openFile = async (id: string, name: string) => {
    try {
      const local = await getLocalPdf(id);
      if (!local) throw new Error('missing');
      router.push({ pathname: '/pdf-viewer', params: { uri: local.uri, title: name, bookId: id } });
    } catch {
      const latest = await getLibrary();
      setLibrary(latest);
    }
  };

  return <Page title="الكتب والملازم المحملة" subtitle="ملفاتك المحفوظة على الجهاز" onBack={() => router.back()}>
    <Section title="📚 الكتب والملازم المحملة">
      <Card>
        <Text style={{ color: C.muted, textAlign: 'right', lineHeight: 22 }}>هذه الملفات محفوظة على جهازك ويمكن فتحها بدون إنترنت. لا تحتاج إلى إعادة تنزيلها ما دامت النسخة المحلية سليمة.</Text>
      </Card>
      {entries.map(([id, entry]) => <Card key={id}>
        <Text style={{ color: C.navy, fontSize: 17, fontWeight: '900', textAlign: 'right' }}>{entry.name}</Text>
        <Text style={{ color: C.muted, fontSize: 11, textAlign: 'right', marginTop: 5 }}>{entry.pages} صفحة • محفوظ على الجهاز</Text>
        <Action label="فتح الكتاب أو الملزمة" icon="📖" onPress={() => openFile(id, entry.name)} />
      </Card>)}
      {!entries.length && <Card><Text style={{ color: C.muted, textAlign: 'center', lineHeight: 24 }}>لا توجد كتب أو ملازم محملة حتى الآن. نزّل أي PDF من مكتبة المقرر أولًا.</Text></Card>}
    </Section>
  </Page>;
}
