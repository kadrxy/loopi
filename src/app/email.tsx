// Email + 6-digit code (mock). Signup continues to /join; login goes straight in.
import { useLocalSearchParams, useRouter } from 'expo-router';
import { useRef, useState, type ComponentRef } from 'react';
import { KeyboardAvoidingView, Platform, Pressable, StyleSheet, Text, TextInput, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { appStore } from '@/data';
import { useT } from '@/i18n';
import { Button, colors, font, Glass, Halo, Icon, radius, type as T } from '@/ui';

const EMAIL = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

export default function EmailScreen() {
  const { mode } = useLocalSearchParams<{ mode?: 'signup' | 'login' }>();
  const t = useT();
  const router = useRouter();
  const codeRef = useRef<ComponentRef<typeof TextInput>>(null);
  const [email, setEmail] = useState('');
  const [code, setCode] = useState('');
  const [step, setStep] = useState<'email' | 'code'>('email');
  const [error, setError] = useState<string | null>(null);

  const send = () => {
    if (!EMAIL.test(email.trim())) return setError(t('err_email'));
    setError(null);
    setStep('code');
    setTimeout(() => codeRef.current?.focus(), 250);
  };
  const verify = (value = code) => {
    if (!/^\d{6}$/.test(value)) return setError(t('err_code'));
    if (mode === 'login') {
      appStore.getState().signInExisting();
      router.replace('/');
    } else {
      router.replace('/join');
    }
  };

  return (
    <SafeAreaView style={styles.screen}>
      <Halo style={styles.halo} />
      <KeyboardAvoidingView style={{ flex: 1 }} behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
        <View style={styles.body}>
          <Glass radius={26} style={styles.iconTile}>
            <Icon name={step === 'email' ? 'mail' : 'lock'} size={30} />
          </Glass>
          {step === 'email' ? (
            <>
              <Text style={T.title}>{t(mode === 'login' ? 'email_title_login' : 'email_title_signup')}</Text>
              <Text style={styles.sub}>{t('email_sub')}</Text>
              <Glass radius={radius.md} style={styles.inputBox}>
                <TextInput
                  value={email}
                  onChangeText={setEmail}
                  placeholder={t('email_ph')}
                  placeholderTextColor={colors.t4}
                  keyboardType="email-address"
                  autoCapitalize="none"
                  autoComplete="email"
                  autoFocus
                  onSubmitEditing={send}
                  style={styles.input}
                  accessibilityLabel={t('email_ph')}
                />
              </Glass>
            </>
          ) : (
            <>
              <Text style={T.title}>{t('code_title')}</Text>
              <Text style={styles.sub}>{t('code_sub', { email: email.trim() })}</Text>
              <Pressable onPress={() => codeRef.current?.focus()} style={styles.codeRow} accessibilityRole="none">
                {Array.from({ length: 6 }, (_, i) => {
                  const ch = code[i];
                  const active = i === Math.min(code.length, 5);
                  return (
                    <Glass key={i} radius={14} style={[styles.box, active && styles.boxActive]}>
                      <Text style={styles.digit}>{ch ?? ''}</Text>
                    </Glass>
                  );
                })}
              </Pressable>
              <TextInput
                ref={codeRef}
                value={code}
                onChangeText={(v) => {
                  const digits = v.replace(/\D/g, '').slice(0, 6);
                  setCode(digits);
                  if (digits.length === 6) verify(digits); // no extra tap once all six are in
                }}
                keyboardType="number-pad"
                textContentType="oneTimeCode"
                autoComplete="one-time-code"
                maxLength={6}
                style={styles.hidden}
                accessibilityLabel={t('code_title')}
              />
              <Text style={styles.hint}>{t('code_hint')}</Text>
              <View style={styles.links}>
                <Pressable onPress={() => setCode('')} style={styles.resend} accessibilityRole="button">
                  <Text style={styles.resendText}>{t('resend')}</Text>
                </Pressable>
                <Pressable
                  onPress={() => {
                    setCode('');
                    setError(null);
                    setStep('email');
                  }}
                  style={styles.resend}
                  accessibilityRole="button">
                  <Text style={[styles.resendText, { color: colors.t2 }]}>{t('change_email')}</Text>
                </Pressable>
              </View>
            </>
          )}
          {error && <Text style={styles.error}>{error}</Text>}
        </View>
        <View style={styles.footer}>
          <Button title={step === 'email' ? t('send_code') : t('verify')} trailing="arrowRight" onPress={step === 'email' ? send : () => verify()} />
        </View>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1, backgroundColor: colors.bg },
  halo: { position: 'absolute', top: -120, alignSelf: 'center' },
  body: { flex: 1, paddingHorizontal: 22, paddingTop: 36, gap: 12 },
  links: { flexDirection: 'row', gap: 22 },
  iconTile: { width: 64, height: 64, alignItems: 'center', justifyContent: 'center', marginBottom: 6 },
  sub: { fontFamily: font.regular, fontSize: 14, lineHeight: 20, color: colors.t3 },
  inputBox: { paddingHorizontal: 16, marginTop: 10 },
  input: { fontFamily: font.regular, fontSize: 16, color: colors.text, paddingVertical: 15 },
  codeRow: { flexDirection: 'row', gap: 8, marginTop: 14 },
  box: { flex: 1, aspectRatio: 0.82, alignItems: 'center', justifyContent: 'center' },
  boxActive: { borderColor: colors.text },
  digit: { fontFamily: font.display, fontSize: 26, color: colors.text },
  hidden: { position: 'absolute', opacity: 0, width: 1, height: 1 },
  hint: { fontFamily: font.regular, fontSize: 12, color: colors.t3, marginTop: 4 },
  resend: { alignSelf: 'flex-start', paddingVertical: 10, minHeight: 44, justifyContent: 'center' },
  resendText: { fontFamily: font.semibold, fontSize: 13, color: colors.text },
  error: { fontFamily: font.semibold, fontSize: 13, color: colors.text },
  footer: { paddingHorizontal: 20, paddingBottom: 12 },
});
