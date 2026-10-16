import { router, useLocalSearchParams } from 'expo-router';
import { ScrollView, Text } from 'react-native';
import { books } from '../src/data';
import { Card, Page, C } from '../src/ui';

export default function BookScreen() {
  const { id } = useLocalSearchParams<{ id?: string }>();
  const book = books.find((item) => item.id === id) ?? books[0];

  return (
    <Page title="قراءة الكتاب" subtitle={`${book.subject} • ${book.grade}`} onBack={() => router.back()}>
      <Card>
        <Text style={{ fontSize: 22, fontWeight: '900', color: C.navy, textAlign: 'right' }}>{book.title}</Text>
        <Text style={{ marginTop: 8, color: C.muted, textAlign: 'right' }}>{book.description}</Text>
      </Card>
      <Card>
        <ScrollView contentContainerStyle={{ paddingBottom: 20 }}>
          <Text style={{ fontSize: 17, lineHeight: 31, color: C.text, textAlign: 'right' }}>{book.content}</Text>
        </ScrollView>
      </Card>
    </Page>
  );
}
