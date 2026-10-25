import { Stack } from 'expo-router';
import { I18nManager, Text, TextInput } from 'react-native';

I18nManager.allowRTL(true);
I18nManager.forceRTL(true);

// Arabic-first defaults for text throughout the app.
// Screen-specific alignment (center/left) can still override these defaults.
(Text as any).defaultProps = {
  ...(Text as any).defaultProps,
  style: [{ textAlign: 'right', writingDirection: 'rtl' }, (Text as any).defaultProps?.style],
};
(TextInput as any).defaultProps = {
  ...(TextInput as any).defaultProps,
  textAlign: (TextInput as any).defaultProps?.textAlign || 'right',
  style: [{ writingDirection: 'rtl' }, (TextInput as any).defaultProps?.style],
};

export default function RootLayout() {
  return (
    <Stack screenOptions={{ headerShown: false, animation: 'fade' }}>
      <Stack.Screen name="index" />
      <Stack.Screen name="login" />
      <Stack.Screen name="home" />
    </Stack>
  );
}
