import { Stack } from 'expo-router';
import { I18nManager, Text, TextInput } from 'react-native';

// The application is Arabic-first. Native Android RTL support is enabled in app.json,
// and these defaults make text direction consistent across screens.
I18nManager.allowRTL(true);
I18nManager.forceRTL(true);

const textDefaults = (Text as any).defaultProps || {};
(Text as any).defaultProps = {
  ...textDefaults,
  style: [{ textAlign: 'right', writingDirection: 'rtl' }, textDefaults.style],
};

const inputDefaults = (TextInput as any).defaultProps || {};
(TextInput as any).defaultProps = {
  ...inputDefaults,
  textAlign: 'right',
  style: [{ textAlign: 'right', writingDirection: 'rtl' }, inputDefaults.style],
};

export default function RootLayout() {
  return (
    <Stack
      screenOptions={{
        headerShown: false,
        animation: 'fade',
        contentStyle: { direction: 'rtl' },
      }}
    >
      <Stack.Screen name="index" />
      <Stack.Screen name="login" />
      <Stack.Screen name="home" />
    </Stack>
  );
}
