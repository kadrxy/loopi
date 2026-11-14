// New account details: name, full date of birth (16+ gate, spec §6.1), optional invite code.
import { useRouter } from 'expo-router';
import { useState } from 'react';
import { KeyboardAvoidingView, Platform, ScrollView, StyleSheet, Text, TextInput, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { appStore } from '@/data';
import { ageOn } from '@/domain/rules';
import { useT } from '@/i18n';
import { Button, colors, font, Glass, Halo, radius, type as T } from '@/ui';

export default function Join() {
  const t = useT();
  const router = useRouter();
  const [code, setCode] = useState('');
  const [name, setName] = useState('');
  const [day, setDay] = useState('');
  const [month, setMonth] = useState('');
  const [year, setYear] = useState('');
  const [error, setError] = useState<string | null>(null);

  const submit = async () => {
    const birth = { year: parseInt(year, 10), month: parseInt(month, 10), day: parseInt(day, 10) };
    const age = ageOn(birth, new Date());
    if (!name.trim()) return setError(t('err_name'));
    if (Number.isNaN(age) || age < 16 || age > 120) return setError(t('err_age'));
    await appStore.getState().finishOnboarding(name.trim(), birth);
    router.replace('/');
  };

  return (
    <SafeAreaView style={styles.screen} edges={['top', 'bottom']}>
      <Halo style={styles.halo} />
      <KeyboardAvoidingView style={{ flex: 1 }} behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
        <ScrollView contentContainerStyle={styles.form} keyboardShouldPersistTaps="handled">
          <Text style={T.title}>{t('join_title')}</Text>
          <Text style={[T.body, { color: colors.t3 }]}>{t('join_sub')}</Text>
          <Field label={t('display_name')} value={name} onChange={setName} />
          <Text style={T.label}>{t('birth_date')}</Text>
          <View style={styles.dateRow}>
            <View style={{ flex: 1 }}>
              <Field label={t('day')} value={day} onChange={setDay} placeholder="GG" numeric maxLength={2} />
            </View>
            <View style={{ flex: 1 }}>
              <Field label={t('month')} value={month} onChange={setMonth} placeholder="AA" numeric maxLength={2} />
            </View>
            <View style={{ flex: 1.6 }}>
              <Field label={t('year')} value={year} onChange={setYear} placeholder="2000" numeric maxLength={4} />
            </View>
          </View>
          <Field label={t('invite_code')} value={code} onChange={setCode} placeholder="LOOPI-1234" autoCapitalize="characters" />
          <Text style={styles.hint}>{t('invite_hint')}</Text>
          {error && <Text style={styles.error}>{error}</Text>}
        </ScrollView>
        {/* Pinned to the bottom (and above the keyboard). */}
        <View style={styles.footer}>
          <Button title={t('join_cta')} trailing="arrowRight" onPress={submit} />
        </View>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

function Field({ label, value, onChange, placeholder, numeric, autoCapitalize, maxLength }: { label: string; value: string; onChange: (v: string) => void; placeholder?: string; numeric?: boolean; autoCapitalize?: 'characters'; maxLength?: number }) {
  return (
    <View style={{ gap: 8 }}>
      <Text style={T.label}>{label}</Text>
      <Glass radius={radius.md} style={{ paddingHorizontal: 16 }}>
        <TextInput
          value={value}
          onChangeText={onChange}
          placeholder={placeholder}
          placeholderTextColor={colors.t4}
          keyboardType={numeric ? 'number-pad' : 'default'}
          autoCapitalize={autoCapitalize}
          maxLength={maxLength ?? 40}
          accessibilityLabel={label}
          style={styles.input}
        />
      </Glass>
    </View>
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1, backgroundColor: colors.bg },
  halo: { position: 'absolute', top: -120, alignSelf: 'center' },
  form: { paddingHorizontal: 22, paddingTop: 28, paddingBottom: 24, gap: 14 },
  hint: { fontFamily: font.regular, fontSize: 12, color: colors.t3, marginTop: -6 },
  dateRow: { flexDirection: 'row', gap: 10, marginTop: -6 },
  input: { fontFamily: font.regular, fontSize: 16, color: colors.text, paddingVertical: 14 },
  error: { fontFamily: font.semibold, fontSize: 13, color: colors.text },
  footer: { paddingHorizontal: 20, paddingTop: 8, paddingBottom: 8 },
});
