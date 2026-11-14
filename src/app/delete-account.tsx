import { useRouter } from 'expo-router';
import { useState } from 'react';
import { KeyboardAvoidingView, Platform, ScrollView, StyleSheet, Text, TextInput, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { appStore, useApp } from '@/data';
import { useT } from '@/i18n';
import { Button, colors, font, Glass, Icon, IconButton, radius, type as T, type IconName } from '@/ui';

const GONE: { icon: IconName; key: 'del_moments' | 'del_messages' | 'del_follows' | 'del_profile' }[] = [
  { icon: 'images', key: 'del_moments' },
  { icon: 'chats', key: 'del_messages' },
  { icon: 'friends', key: 'del_follows' },
  { icon: 'profile', key: 'del_profile' },
];

/** Permanent account deletion (App Store and Play require it in the app). Typing the word confirms. */
export default function DeleteAccount() {
  const t = useT();
  const router = useRouter();
  const lang = useApp((s) => s.settings.lang);
  const word = lang === 'tr' ? 'SİL' : 'DELETE';
  const [typed, setTyped] = useState('');
  const [busy, setBusy] = useState(false);
  const ok = typed.trim().toLocaleUpperCase(lang === 'tr' ? 'tr-TR' : 'en-GB') === word;
  const close = () => (router.canGoBack() ? router.back() : router.replace('/settings'));

  const remove = async () => {
    if (!ok || busy) return;
    setBusy(true);
    await appStore.getState().deleteAccount();
    router.dismissAll?.();
    router.replace('/auth');
  };

  return (
    <SafeAreaView edges={['top', 'bottom']} style={styles.screen}>
      <View style={styles.bar}>
        <Text style={[T.title, { flex: 1 }]}>{t('delete_account')}</Text>
        <IconButton name="close" size="sm" label={t('close')} onPress={close} />
      </View>
      <KeyboardAvoidingView style={{ flex: 1 }} behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
        <ScrollView contentContainerStyle={styles.body} keyboardShouldPersistTaps="handled">
          <Text style={styles.lead}>{t('delete_lead')}</Text>
          <Glass radius={radius.lg} style={styles.list}>
            {GONE.map((g) => (
              <View key={g.key} style={styles.item}>
                <Icon name={g.icon} size={19} color={colors.t2} />
                <Text style={styles.itemText}>{t(g.key)}</Text>
              </View>
            ))}
          </Glass>
          <Text style={styles.note}>{t('delete_note')}</Text>
          <Text style={styles.label}>{t('delete_type', { word })}</Text>
          <Glass radius={radius.pill} style={styles.field}>
            <TextInput
              value={typed}
              onChangeText={setTyped}
              autoCapitalize="characters"
              autoCorrect={false}
              placeholder={word}
              placeholderTextColor={colors.t4}
              style={styles.input}
              accessibilityLabel={t('delete_type', { word })}
            />
          </Glass>
        </ScrollView>
        <View style={styles.footer}>
          <Button title={t('delete_confirm')} onPress={remove} disabled={!ok || busy} />
        </View>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1, backgroundColor: colors.bg },
  bar: { flexDirection: 'row', alignItems: 'center', gap: 12, paddingHorizontal: 20, paddingTop: 8, paddingBottom: 6 },
  body: { paddingHorizontal: 20, paddingBottom: 24, gap: 14 },
  lead: { fontFamily: font.regular, fontSize: 14.5, lineHeight: 21, color: colors.t2 },
  list: { paddingVertical: 6, paddingHorizontal: 16 },
  item: { flexDirection: 'row', alignItems: 'center', gap: 12, paddingVertical: 10 },
  itemText: { flex: 1, fontFamily: font.medium, fontSize: 14, color: colors.text },
  note: { fontFamily: font.regular, fontSize: 12.5, lineHeight: 18, color: colors.t3 },
  label: { fontFamily: font.semibold, fontSize: 13, color: colors.t2, marginTop: 6 },
  field: { paddingHorizontal: 18 },
  input: { fontFamily: font.bold, fontSize: 16, letterSpacing: 2, color: colors.text, paddingVertical: 13 },
  footer: { paddingHorizontal: 20, paddingTop: 8, paddingBottom: 6 },
});
