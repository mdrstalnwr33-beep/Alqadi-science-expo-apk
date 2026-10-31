import { router, useLocalSearchParams } from 'expo-router';
import { useEffect } from 'react';
import { ActivityIndicator, SafeAreaView, View } from 'react-native';

// The old version of this screen generated artificial questions from
// weekly lesson numbers. Flashcards are now handout-only.
export default function FlashcardsScreen() {
  const p = useLocalSearchParams<{ grade?: string; subject?: string }>();
  const grade = p.grade === 'الثاني الثانوي' ? 'الثاني الثانوي' : 'الأول الثانوي';
  const subject = Array.isArray(p.subject) ? p.subject[0] : p.subject;

  useEffect(() => {
    const pathname = grade === 'الثاني الثانوي' ? '/flashcards-second' : '/curriculum-flashcards';
    router.replace(subject ? { pathname, params: { subject } } : pathname);
  }, [grade, subject]);

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: '#F8FAFC' }}>
      <View style={{ flex: 1, alignItems: 'center', justifyContent: 'center' }}>
        <ActivityIndicator size="large" />
      </View>
    </SafeAreaView>
  );
}
