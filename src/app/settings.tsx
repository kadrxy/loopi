import { useRouter } from 'expo-router';
import { useState, type ReactNode } from 'react';
import { Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { appStore, useApp, type Settings } from '@/data';
import { isMinor } from '@/domain/rules';
import type { Audience, DmPermission } from '@/domain/types';
import { AUDIENCE_ICON, AUDIENCE_KEY } from '@/features/home/MomentCard';
import { useT, type TKey } from '@/i18n';
import { colors, font, Glass, Halo, Icon, Sheet, type SheetOption, Toggle, type as T, type IconName } from '@/ui';

type Picker = { title: string; options: SheetOption[] } | null;

export default function SettingsScreen() {
  const t = useT();
  const router = useRouter();
  const settings = useApp((s) => s.settings);
  const blockedCount = useApp((s) => (s.graph.blocks ?? []).filter((b) => b.from === s.meId).length);
  const me = useApp((s) => s.graph.users[s.meId]);
  const [picker, setPicker] = useState<Picker>(null);
  const update = (patch: Partial<Settings>) => appStore.getState().updateSettings(patch);

  const pick = <V extends string>(
    title: string,
    current: V,
    items: { value: V; label: string; icon?: IconName; disabled?: boolean }[],
    apply: (v: V) => void,
  ) =>
    setPicker({
      title,
      options: items.map((i) => ({
        label: i.label,
        icon: i.icon,
        selected: i.value === current,
        disabled: i.disabled,
        onPress: () => apply(i.value),
      })),
    });

  const tapKey: Record<Settings['widgetTap'], TKey> = { post: 's_tap_post', chat: 's_tap_chat', ask: 's_tap_ask' };
  const dmKey: Record<DmPermission, TKey> = { everyone: 'dm_everyone', followers: 'dm_followers', friends: 'dm_friends', nobody: 'dm_nobody' };

  return (
    <SafeAreaView style={styles.screen} edges={['top']}>
      <Halo style={styles.halo} />
      <View style={styles.header}>
        <Text style={T.title}>{t('settings')}</Text>
      </View>
      <ScrollView contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>
        <Section label={t('sec_app')}>
          <Row icon="camera" title={t('s_camera_first')} sub={t('s_camera_first_sub')}>
            <Toggle value={settings.launch === 'camera'} label={t('s_camera_first')} onChange={(v) => update({ launch: v ? 'camera' : 'home' })} />
          </Row>
          <Row
            icon="home"
            title={t('s_home_tab')}
            sub={t('s_home_tab_sub')}
            value={t(settings.homeTab === 'feed' ? 'feed' : 'discover')}
            onPress={() =>
              pick(
                t('s_home_tab'),
                settings.homeTab,
                [
                  { value: 'feed', label: t('feed') },
                  { value: 'discover', label: t('discover') },
                ],
                (v) => update({ homeTab: v }),
              )
            }
          />
          <Row
            icon={settings.centerTab === 'map' ? 'map' : 'camera'}
            title={t('s_center')}
            sub={t('s_center_sub')}
            value={t(settings.centerTab === 'map' ? 'center_map' : 'center_camera')}
            onPress={() =>
              pick(
                t('s_center'),
                settings.centerTab,
                [
                  { value: 'map', label: t('center_map') },
                  { value: 'camera', label: t('center_camera') },
                ],
                (v) => update({ centerTab: v }),
              )
            }
          />
          <Row
            icon="translate"
            title={t('s_language')}
            sub={t('s_language_sub')}
            value={t(settings.lang === 'tr' ? 'lang_tr' : 'lang_en')}
            onPress={() =>
              pick(
                t('s_language'),
                settings.lang,
                [
                  { value: 'tr', label: t('lang_tr') },
                  { value: 'en', label: t('lang_en') },
                ],
                (v) => update({ lang: v }),
              )
            }
          />
        </Section>

        <Section label={t('sec_widget')}>
          <Row
            icon="tap"
            title={t('s_widget_tap')}
            sub={t('s_widget_tap_sub')}
            value={t(tapKey[settings.widgetTap])}
            onPress={() =>
              pick(
                t('s_widget_tap'),
                settings.widgetTap,
                (['post', 'chat', 'ask'] as const).map((v) => ({ value: v, label: t(tapKey[v]) })),
                (v) => update({ widgetTap: v }),
              )
            }
          />
          <Row icon="sparkle" title={t('s_reduce_motion')} sub={t('s_reduce_motion_sub')}>
            <Toggle value={settings.reduceMotion} label={t('s_reduce_motion')} onChange={(v) => update({ reduceMotion: v })} />
          </Row>
          <Row icon="bell" title={t('s_alerts')} sub={t('s_alerts_sub')}>
            <Toggle value={settings.newMomentAlerts} label={t('s_alerts')} onChange={(v) => update({ newMomentAlerts: v })} />
          </Row>
          <Row icon="device" title={t('widget_preview')} onPress={() => router.push('/widget')} />
        </Section>

        <Section label={t('sec_privacy')}>
          <Row icon="lock" title={t('s_private')} sub={t('s_private_sub')}>
            <Toggle value={settings.isPrivate} label={t('s_private')} onChange={(v) => update({ isPrivate: v })} />
          </Row>
          <Row
            icon={AUDIENCE_ICON[settings.defaultAudience]}
            title={t('s_default_aud')}
            sub={t('s_default_aud_sub')}
            value={t(AUDIENCE_KEY[settings.defaultAudience])}
            onPress={() =>
              pick(
                t('s_default_aud'),
                settings.defaultAudience,
                (['friends', 'followers', 'everyone'] as Audience[]).map((v) => ({
                  value: v,
                  label: t(AUDIENCE_KEY[v]),
                  icon: AUDIENCE_ICON[v],
                  disabled: v === 'everyone' && settings.isPrivate,
                })),
                (v) => update({ defaultAudience: v }),
              )
            }
          />
          <Row
            icon="chat"
            title={t('s_dm')}
            sub={t('s_dm_sub')}
            value={t(dmKey[settings.dmPermission])}
            onPress={() =>
              pick(
                t('s_dm'),
                settings.dmPermission,
                (['everyone', 'followers', 'friends', 'nobody'] as DmPermission[]).map((v) => ({ value: v, label: t(dmKey[v]) })),
                (v) => update({ dmPermission: v }),
              )
            }
          />
          <Row icon="lock" title={t('blocked_list')} value={String(blockedCount || '')} onPress={() => router.push('/blocked')} />
        </Section>
        {isMinor(me) && <Text style={styles.note}>{t('minor_note')}</Text>}

        <Section label={t('sec_account')}>
          <Row icon="flag" title={t('privacy_policy')} onPress={() => router.push({ pathname: '/legal/[doc]', params: { doc: 'privacy' } })} />
          <Row icon="bookmark" title={t('terms')} onPress={() => router.push({ pathname: '/legal/[doc]', params: { doc: 'terms' } })} />
          <Row icon="close" title={t('delete_account')} onPress={() => router.push('/delete-account')} />
        </Section>

        <Section>
          <Row
            icon="sparkle"
            title={t('s_restart')}
            onPress={() => {
              appStore.getState().resetOnboarding();
              router.replace('/auth');
            }}
          />
        </Section>
        <Text style={[styles.note, styles.credit]}>{t('icon_credit')}</Text>
      </ScrollView>
      <Sheet visible={!!picker} title={picker?.title} options={picker?.options} onClose={() => setPicker(null)} />
    </SafeAreaView>
  );
}

function Section({ label, children }: { label?: string; children: ReactNode }) {
  return (
    <View style={{ gap: 8 }}>
      {label && <Text style={styles.label}>{label}</Text>}
      <Glass dark radius={24} style={styles.group}>
        {children}
      </Glass>
    </View>
  );
}

function Row({
  icon,
  title,
  sub,
  value,
  onPress,
  children,
}: {
  icon: IconName;
  title: string;
  sub?: string;
  value?: string;
  onPress?: () => void;
  children?: ReactNode;
}) {
  const body = (
    <View style={styles.row}>
      <Glass radius={12} style={styles.tile}>
        <Icon name={icon} size={18} />
      </Glass>
      <View style={{ flex: 1 }}>
        <Text style={styles.rowTitle} numberOfLines={1}>
          {title}
        </Text>
        {sub && (
          <Text style={styles.rowSub} numberOfLines={1}>
            {sub}
          </Text>
        )}
      </View>
      {children}
      {value && <Text style={styles.value}>{value}</Text>}
      {onPress && <Icon name="caretRight" size={15} color={colors.t3} />}
    </View>
  );
  if (!onPress) return body;
  return (
    <Pressable
      onPress={onPress}
      accessibilityRole="button"
      accessibilityLabel={title}
      style={({ pressed }) => pressed && { backgroundColor: 'rgba(255,255,255,0.04)' }}>
      {body}
    </Pressable>
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1, backgroundColor: colors.bg },
  halo: { position: 'absolute', top: -130, alignSelf: 'center' },
  header: { flexDirection: 'row', alignItems: 'center', gap: 12, paddingHorizontal: 16, paddingVertical: 10 },
  content: { padding: 14, gap: 18, paddingBottom: 48 },
  label: { fontFamily: font.bold, fontSize: 11, letterSpacing: 1.4, color: colors.t3, paddingHorizontal: 8 },
  group: { paddingVertical: 4 },
  row: { flexDirection: 'row', alignItems: 'center', gap: 12, paddingHorizontal: 12, paddingVertical: 10, minHeight: 58 },
  tile: { width: 36, height: 36, alignItems: 'center', justifyContent: 'center' },
  rowTitle: { fontFamily: font.semibold, fontSize: 14, color: colors.text },
  rowSub: { fontFamily: font.regular, fontSize: 11.5, color: colors.t3 },
  value: { fontFamily: font.regular, fontSize: 13, color: colors.t2 },
  credit: { textAlign: 'center', fontSize: 11, marginTop: 4 },
  note: { fontFamily: font.regular, fontSize: 12.5, color: colors.t3, paddingHorizontal: 8, lineHeight: 18 },
});
