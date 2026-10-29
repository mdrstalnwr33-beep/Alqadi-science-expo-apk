import { Stack } from 'expo-router';
import { AppState, I18nManager, Text, TextInput } from 'react-native';
import { useEffect } from 'react';
import { getSession } from '../src/storage';
import { getDeviceId } from '../src/device';
import { touchStudentPresence } from '../src/cloud';

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
  useEffect(() => {
    let timer: ReturnType<typeof setInterval> | null = null;
    const touch = async () => {
      try {
        const session = await getSession();
        if (session?.active && session.role === 'student' && /^\d{6}$/.test(session.code)) {
          await touchStudentPresence(session.code, await getDeviceId());
        }
      } catch {}
    };
    const start = () => {
      touch();
      if (!timer) timer = setInterval(touch, 30000);
    };
    const stop = () => {
      if (timer) { clearInterval(timer); timer = null; }
    };
    start();
    const sub = AppState.addEventListener('change', state => {
      if (state === 'active') start(); else stop();
    });
    return () => { stop(); sub.remove(); };
  }, []);

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
