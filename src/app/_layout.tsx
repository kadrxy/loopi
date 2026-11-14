import { Stack } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { useEffect } from 'react';
import { Platform } from 'react-native';
import { ReducedMotionConfig, ReduceMotion } from 'react-native-reanimated';

import { appStore, useApp } from '@/data';
import { deviceLang, initI18n } from '@/i18n';
import { colors, FullScreenLoader, setReduceMotion, useAppFonts } from '@/ui';

// Web: make the page itself black and full-height (otherwise a white strip shows below the app).
function useWebCanvas() {
  useEffect(() => {
    if (Platform.OS !== 'web') return;
    const doc = (globalThis as { document?: { createElement: (t: string) => { textContent: string }; head: { appendChild: (n: unknown) => void } } }).document;
    if (!doc) return;
    const style = doc.createElement('style');
    style.textContent = `html, body, #root { height: 100%; margin: 0; background: ${colors.bg}; } body { overscroll-behavior: none; }`;
    doc.head.appendChild(style);
  }, []);
}

export default function RootLayout() {
  const fontsReady = useAppFonts();
  const loaded = useApp((s) => s.loaded);
  const lang = useApp((s) => s.settings.lang);
  const reduceMotion = useApp((s) => s.settings.reduceMotion);
  useEffect(() => setReduceMotion(reduceMotion), [reduceMotion]);
  useWebCanvas();

  useEffect(() => {
    appStore
      .getState()
      .load()
      .then(() => {
        // First launch: follow the phone's language until the user picks one.
        if (!appStore.getState().onboarded) appStore.getState().updateSettings({ lang: deviceLang() });
      });
  }, []);

  useEffect(() => {
    initI18n(lang);
  }, [lang]);
  initI18n(lang); // first render needs translations synchronously; later changes go through the effect

  if (!fontsReady || !loaded) return <FullScreenLoader />;

  return (
    <>
      {/* Effects are part of the product: they play unless turned down in Settings (the OS flag alone
          skipped every transition on phones with Reduce Motion on). */}
      <ReducedMotionConfig mode={reduceMotion ? ReduceMotion.Always : ReduceMotion.Never} />
      <StatusBar style="light" />
      <Stack
        screenOptions={{
          headerShown: false,
          contentStyle: { backgroundColor: colors.bg },
          animation: 'slide_from_right',
          // Swipe from anywhere on the screen to go back (not only the left edge).
          gestureEnabled: true,
          fullScreenGestureEnabled: true,
          // The swipe back slides the same way the screen came in, without the fake shadow strip that
          // showed up as a dark band on the left during the gesture.
          animationMatchesGesture: true,
          fullScreenGestureShadowEnabled: false,
        }}>
        <Stack.Screen name="index" options={{ animation: 'fade' }} />
        <Stack.Screen name="auth" options={{ animation: 'fade' }} />
        <Stack.Screen name="email" />
        <Stack.Screen name="join" />
        <Stack.Screen name="(tabs)" options={{ animation: 'fade', gestureEnabled: false }} />
        {/* A person's posts: a normal push, swipe back from anywhere. */}
        <Stack.Screen name="post/[id]" />
        <Stack.Screen name="chat/[id]" />
        <Stack.Screen name="user/[id]" />
        <Stack.Screen name="settings" />
        <Stack.Screen name="widget" />
        <Stack.Screen name="camera" options={{ animation: 'slide_from_bottom', gestureDirection: 'vertical' }} />
        {/* Stories draw their own circular open/close over the screen below. */}
        <Stack.Screen name="story/[id]" options={{ presentation: 'transparentModal', animation: 'none', gestureEnabled: false, contentStyle: { backgroundColor: 'transparent' } }} />
        <Stack.Screen name="notifications" />
        <Stack.Screen name="search" options={{ animation: 'fade' }} />
        <Stack.Screen name="blocked" />
        <Stack.Screen name="delete-account" options={{ animation: 'slide_from_bottom', gestureDirection: 'vertical' }} />
        <Stack.Screen name="legal/[doc]" options={{ animation: 'slide_from_bottom', gestureDirection: 'vertical' }} />
        <Stack.Screen name="profile-edit" options={{ animation: 'slide_from_bottom', gestureDirection: 'vertical' }} />
      </Stack>
    </>
  );
}
