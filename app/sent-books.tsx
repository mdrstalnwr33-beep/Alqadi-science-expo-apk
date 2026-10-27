import { router, useLocalSearchParams } from 'expo-router';
import { useEffect, useState } from 'react';
import { Text, View, Pressable } from 'react-native';
import { subjects } from '../src/data';
import { getBookLinks, type CloudBookLink } from '../src/contentCloud';
import { Action, Card, Page, Section, C } from '../src/ui';

export default function SentBooksScreen() {
  const p = useLocalSearchParams<{ role?: string; name?: string; grade?: string; code?: string }>();
  const grade = p.grade || '';
  const [links, setLinks] = useState<CloudBookLink[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let alive = true;
    setLoading(true);
    const selected = subjects.map(s => s.name);
    Promise.all(selected.map(subject => getBookLinks(grade, subject).catch(() => [])))
      .then(groups => { if (alive) setLinks(groups.flat()); })
      .finally(() => { if (alive) setLoading(false); });
    return () => { alive = false; };
  }, [grade]);

  return <Page title="الكتب والملازم المرسلة للطلاب" subtitle={grade ? `المرحلة: ${grade}` : 'مكتبة الملفات المنشورة'} onBack={() => router.back()}>
    <Section title="📚 الكتب والملازم المرسلة للطالب">
      <Card>
        <Text style={{ color: C.muted, textAlign: 'right', lineHeight: 22 }}>هذا ملف مستقل يجمع الكتب والملازم التي نشرها المعلم للطلاب في جميع مواد المرحلة المحددة.</Text>
      </Card>
      {loading && <Card><Text style={{ color: C.muted, textAlign: 'center' }}>جاري تحميل قائمة الملفات…</Text></Card>}
      {!loading && links.map(item => <Card key={item.id}>
        <View style={{ flexDirection: 'row-reverse', alignItems: 'center', gap: 10 }}>
          <Text style={{ fontSize: 26 }}>{/^https?:\/\/(?:www\.)?t\.me\//i.test(item.url) ? '✈️' : '📄'}</Text>
          <View style={{ flex: 1 }}>
            <Text style={{ color: C.navy, fontSize: 16, fontWeight: '900', textAlign: 'right' }}>{item.name}</Text>
            <Text style={{ color: C.muted, fontSize: 11, textAlign: 'right', marginTop: 4 }}>{item.subject} • {item.grade}</Text>
          </View>
        </View>
        <Action label="إدارة الملف" icon="⚙️" onPress={() => router.push({ pathname: '/books', params: { role: 'teacher', name: p.name, grade: item.grade, subject: item.subject } })} />
      </Card>)}
      {!loading && !links.length && <Card><Text style={{ color: C.muted, textAlign: 'center', lineHeight: 24 }}>لا توجد كتب أو ملازم منشورة لهذه المرحلة.</Text></Card>}
    </Section>
  </Page>;
}
