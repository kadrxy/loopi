import { useLocalSearchParams, useRouter } from 'expo-router';
import { ScrollView, StyleSheet, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { useApp } from '@/data';
import { LEGAL_UPDATED, legalText, type LegalDoc } from '@/features/legal/content';
import { useT } from '@/i18n';
import { colors, font, IconButton, type as T } from '@/ui';

/** Privacy policy and terms, readable in the app (stores require them before sign-up). */
export default function Legal() {
  const { doc } = useLocalSearchParams<{ doc: LegalDoc }>();
  const t = useT();
  const router = useRouter();
  const lang = useApp((s) => s.settings.lang);
  const text = legalText(lang, doc === 'terms' ? 'terms' : 'privacy');
  const close = () => (router.canGoBack() ? router.back() : router.replace('/'));

  return (
    <SafeAreaView edges={['top']} style={styles.screen}>
      <View style={styles.bar}>
        <Text style={[T.title, { flex: 1 }]} numberOfLines={1}>
          {text.title}
        </Text>
        <IconButton name="close" size="sm" label={t('close')} onPress={close} />
      </View>
      <ScrollView contentContainerStyle={styles.body} showsVerticalScrollIndicator={false}>
        <Text style={styles.updated}>{t('legal_updated', { date: LEGAL_UPDATED })}</Text>
        {text.sections.map((s) => (
          <View key={s.h} style={styles.section}>
            <Text style={styles.h}>{s.h}</Text>
            {s.p.map((p) => (
              <Text key={p.slice(0, 24)} style={styles.p}>
                {p}
              </Text>
            ))}
          </View>
        ))}
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1, backgroundColor: colors.bg },
  bar: { flexDirection: 'row', alignItems: 'center', gap: 12, paddingHorizontal: 20, paddingTop: 8, paddingBottom: 6 },
  body: { paddingHorizontal: 20, paddingBottom: 48, gap: 18 },
  updated: { fontFamily: font.regular, fontSize: 12, color: colors.t3 },
  section: { gap: 6 },
  h: { fontFamily: font.bold, fontSize: 16, color: colors.text },
  p: { fontFamily: font.regular, fontSize: 14, lineHeight: 21, color: colors.t2 },
});
