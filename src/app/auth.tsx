// Welcome / sign-in hub: drifting photo mosaic, brand mark, Apple / Google / email.
import { Image } from 'expo-image';
import { useRouter } from 'expo-router';
import { useEffect, useMemo, useState } from 'react';
import { Pressable, StyleSheet, Text, useWindowDimensions, View } from 'react-native';
import Animated, { Easing, useAnimatedStyle, useSharedValue, withRepeat, withTiming } from 'react-native-reanimated';
import { SafeAreaView } from 'react-native-safe-area-context';

import { appStore, useApp } from '@/data';
import { discoverFor } from '@/domain/rules';
import type { ImageRef } from '@/domain/types';
import { useT } from '@/i18n';
import { Button, colors, font, Scrim, Sheet } from '@/ui';

export default function Auth() {
  const t = useT();
  const router = useRouter();
  const { width, height } = useWindowDimensions();
  const meId = useApp((s) => s.meId);
  const graph = useApp((s) => s.graph);
  const moments = useApp((s) => s.moments);
  const [demo, setDemo] = useState(false);
  // Public moments only — never private accounts or minors.
  const images = useMemo(() => discoverFor(graph, meId, moments).map((m) => m.image), [graph, meId, moments]);
  const col = (width - 24) / 3;
  const columns = [0, 1, 2].map((c) => images.filter((_, i) => i % 3 === c));

  return (
    <View style={styles.screen}>
      <View style={styles.mosaic}>
        {columns.map((imgs, c) => (
          <DriftColumn key={c} images={imgs.length ? imgs : images} width={col} height={height} reverse={c === 1} />
        ))}
      </View>
      <Scrim from={0.35} to={0.55} style={{ bottom: '55%' }} />
      <Scrim from={0.55} to={1} style={{ top: '45%' }} />
      <SafeAreaView style={styles.content}>
        <View style={{ flex: 1 }} />
        <Text style={styles.logo} accessibilityRole="header">
          loopi<Text style={{ color: colors.t4 }}>.</Text>
        </Text>
        <Text style={styles.title}>{t('auth_title')}</Text>
        <Text style={styles.sub}>{t('auth_sub')}</Text>
        <View style={styles.buttons}>
          <Button title={t('auth_apple')} icon="apple" onPress={() => setDemo(true)} />
          <Button title={t('auth_google')} icon="google" kind="glass" onPress={() => setDemo(true)} />
          <Button title={t('auth_email')} icon="mail" kind="glass" onPress={() => router.push({ pathname: '/email', params: { mode: 'signup' } })} />
        </View>
        <Pressable onPress={() => router.push({ pathname: '/email', params: { mode: 'login' } })} style={styles.login} accessibilityRole="button">
          <Text style={styles.loginText}>
            {t('auth_have_account')} <Text style={styles.loginStrong}>{t('auth_login')}</Text>
          </Text>
        </Pressable>
        <Text style={styles.terms}>
          {t('auth_terms_pre')}
          <Text style={styles.termsLink} onPress={() => router.push({ pathname: '/legal/[doc]', params: { doc: 'terms' } })} accessibilityRole="link">
            {t('terms')}
          </Text>
          {t('auth_terms_mid')}
          <Text
            style={styles.termsLink}
            onPress={() => router.push({ pathname: '/legal/[doc]', params: { doc: 'privacy' } })}
            accessibilityRole="link">
            {t('privacy_policy')}
          </Text>
          {t('auth_terms_post')}
        </Text>
      </SafeAreaView>
      <Sheet
        visible={demo}
        title={t('auth_mock')}
        options={[
          {
            // Temporary while there is no backend: skip straight into the app.
            label: t('dev_go_home'),
            icon: 'home',
            onPress: () => {
              appStore.getState().signInExisting();
              router.replace('/');
            },
          },
          { label: t('auth_email'), icon: 'mail', onPress: () => router.push({ pathname: '/email', params: { mode: 'signup' } }) },
        ]}
        onClose={() => setDemo(false)}
      />
    </View>
  );
}

/** A column of photos that slowly drifts up (or down) forever. */
function DriftColumn({ images, width, height, reverse }: { images: ImageRef[]; width: number; height: number; reverse?: boolean }) {
  const tileH = width * 1.35;
  const loop = images.length * (tileH + 8);
  const y = useSharedValue(0);
  useEffect(() => {
    y.value = withRepeat(withTiming(1, { duration: 26000, easing: Easing.linear }), -1, false);
  }, [y]);
  const style = useAnimatedStyle(() => ({ transform: [{ translateY: (reverse ? y.value - 1 : -y.value) * loop }] }));
  const tripled = [...images, ...images, ...images];
  return (
    <View style={{ width, height, overflow: 'hidden' }}>
      <Animated.View style={[{ gap: 8 }, style]}>
        {tripled.map((img, i) => (
          <Image key={i} source={img} style={{ width, height: tileH, borderRadius: 22 }} contentFit="cover" />
        ))}
      </Animated.View>
    </View>
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1, backgroundColor: colors.bg },
  mosaic: { ...StyleSheet.absoluteFill, flexDirection: 'row', gap: 8, paddingHorizontal: 4, opacity: 0.75 },
  content: { flex: 1, paddingHorizontal: 20 },
  top: { paddingTop: 8, alignItems: 'flex-start' },
  logo: { fontFamily: font.display, fontSize: 64, lineHeight: 70, letterSpacing: -2, color: colors.text },
  title: { fontFamily: font.displayBold, fontSize: 24, lineHeight: 30, color: colors.text, marginTop: 4 },
  sub: { fontFamily: font.regular, fontSize: 14, color: colors.t2, marginTop: 6 },
  buttons: { gap: 10, marginTop: 22 },
  login: { alignItems: 'center', paddingVertical: 12, minHeight: 44, justifyContent: 'center' },
  loginText: { fontFamily: font.regular, fontSize: 13.5, color: colors.t3 },
  loginStrong: { color: colors.text, fontFamily: font.semibold },
  terms: { fontFamily: font.regular, fontSize: 11, lineHeight: 15, color: colors.t4, textAlign: 'center', marginBottom: 8 },
  termsLink: { fontFamily: font.semibold, color: colors.t2, textDecorationLine: 'underline' },
});
