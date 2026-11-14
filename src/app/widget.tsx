// In-app stand-in for the native home-screen widget (WidgetKit / Android widget come later).
import { Image } from 'expo-image';
import { useRouter } from 'expo-router';
import { useState } from 'react';
import { Pressable, ScrollView, StyleSheet, Text, useWindowDimensions, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { appStore, useApp, WALLPAPER, type Settings } from '@/data';
import { isMinor, widgetMomentsFor } from '@/domain/rules';
import type { Moment, WidgetSource } from '@/domain/types';
import { useT, type TKey } from '@/i18n';
import { Avatar, Button, Chip, colors, font, Glass, Icon, radius, Scrim, Sheet, type as T, useNow, useTimeAgo, type IconName } from '@/ui';

const SRC_KEY: Record<WidgetSource, TKey> = { friends: 'w_src_friends', following: 'w_src_following', followers: 'w_src_followers', everyone: 'w_src_everyone' };
const SRC_ICON: Record<WidgetSource, IconName> = { friends: 'heart', following: 'users', followers: 'friends', everyone: 'globe' };
const HOUR = 60 * 60_000;

export default function WidgetPreview() {
  const t = useT();
  const router = useRouter();
  const { width } = useWindowDimensions();
  const meId = useApp((s) => s.meId);
  const graph = useApp((s) => s.graph);
  const moments = useApp((s) => s.moments);
  const settings = useApp((s) => s.settings);
  const [editing, setEditing] = useState<keyof Settings['widgets'] | null>(null);
  const [asking, setAsking] = useState<Moment | null>(null);
  const minor = isMinor(graph.users[meId]);

  const phoneW = Math.min(width - 32, 380);
  const inner = phoneW - 32;
  const small = (inner - 16) / 2;

  const open = (m: Moment) => {
    if (settings.widgetTap === 'ask') return setAsking(m);
    if (settings.widgetTap === 'chat') return router.push({ pathname: '/chat/[id]', params: { id: m.authorId } });
    router.push({ pathname: '/post/[id]', params: { id: m.id } });
  };
  const listFor = (src: WidgetSource) => widgetMomentsFor(graph, meId, moments, src);

  return (
    <SafeAreaView style={styles.screen} edges={['top']}>
      <View style={styles.header}>
        <Text style={T.title}>{t('widget_preview')}</Text>
      </View>
      <ScrollView contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>
        <Text style={styles.intro}>{t('widget_body')}</Text>

        <View style={[styles.phone, { width: phoneW }]}>
          <Image source={WALLPAPER} style={StyleSheet.absoluteFill} contentFit="cover" blurRadius={20} />
          <View style={[StyleSheet.absoluteFill, { backgroundColor: 'rgba(0,0,0,0.5)' }]} />
          <Text style={styles.clock}>9:41</Text>
          <View style={{ flexDirection: 'row', gap: 16 }}>
            <WidgetTile size={{ w: small, h: small }} source={settings.widgets.small} list={listFor(settings.widgets.small)} onOpen={open} onEdit={() => setEditing('small')} />
            <View style={[styles.apps, { width: small, height: small }]}>
              <AppIcon icon="phone" label={t('app_phone')} size={(small - 16) / 2 - 12} />
              <AppIcon logo label="LOOPI" size={(small - 16) / 2 - 12} />
              <AppIcon icon="mail" label={t('app_mail')} size={(small - 16) / 2 - 12} />
              <AppIcon icon="music" label={t('app_music')} size={(small - 16) / 2 - 12} />
            </View>
          </View>
          <WidgetTile size={{ w: inner, h: small }} wide source={settings.widgets.medium} list={listFor(settings.widgets.medium)} onOpen={open} onEdit={() => setEditing('medium')} />
          <Glass dark radius={30} style={styles.dock}>
            {(['chats', 'camera', 'images', 'gear'] as IconName[]).map((i) => (
              <View key={i} style={styles.dockIcon}>
                <Icon name={i} size={24} />
              </View>
            ))}
          </Glass>
        </View>

        <Glass dark radius={24} style={styles.panel}>
          <Text style={styles.rule}>{t('w_rule')}</Text>
          <Text style={styles.panelLabel}>{t('s_widget_tap')}</Text>
          <View style={styles.chips}>
            {(['post', 'chat', 'ask'] as const).map((v) => (
              <Chip
                key={v}
                size="md"
                label={t(v === 'post' ? 's_tap_post' : v === 'chat' ? 's_tap_chat' : 's_tap_ask')}
                selected={settings.widgetTap === v}
                onPress={() => appStore.getState().updateSettings({ widgetTap: v })}
              />
            ))}
          </View>
          <Button title={t('w_simulate')} icon="sparkle" onPress={() => appStore.getState().simulateFriendMoment()} />
        </Glass>
      </ScrollView>

      <Sheet
        visible={!!editing}
        title={t(editing === 'medium' ? 'w_edit_wide' : 'w_edit_small')}
        body={minor ? t('w_src_minor') : undefined}
        options={(['friends', 'following', 'followers', 'everyone'] as WidgetSource[]).map((src) => ({
          label: t(SRC_KEY[src]),
          icon: SRC_ICON[src],
          selected: !!editing && settings.widgets[editing] === src,
          disabled: src === 'everyone' && minor,
          onPress: () => editing && appStore.getState().updateSettings({ widgets: { ...settings.widgets, [editing]: src } }),
        }))}
        onClose={() => setEditing(null)}
      />
      <Sheet
        visible={!!asking}
        title={t('w_ask_title')}
        options={
          asking
            ? [
                { label: t('w_go_post'), icon: 'images', onPress: () => router.push({ pathname: '/post/[id]', params: { id: asking.id } }) },
                { label: t('w_go_chat'), icon: 'chat', onPress: () => router.push({ pathname: '/chat/[id]', params: { id: asking.authorId } }) },
              ]
            : []
        }
        onClose={() => setAsking(null)}
      />
    </SafeAreaView>
  );
}

function WidgetTile({ size, wide, source, list, onOpen, onEdit }: { size: { w: number; h: number }; wide?: boolean; source: WidgetSource; list: Moment[]; onOpen: (m: Moment) => void; onEdit: () => void }) {
  const t = useT();
  const ago = useTimeAgo();
  const graph = useApp((s) => s.graph);
  const now = useNow();
  const latest = list[0];
  const fresh = list.filter((m) => now - m.createdAt < HOUR).length;
  const author = latest ? graph.users[latest.authorId] : undefined;
  return (
    <Pressable
      onPress={() => latest && onOpen(latest)}
      onLongPress={onEdit}
      accessibilityRole="button"
      accessibilityLabel={`LOOPI · ${t(SRC_KEY[source])}`}
      style={({ pressed }) => [styles.widget, { width: size.w, height: size.h, transform: [{ scale: pressed ? 0.97 : 1 }] }]}>
      {latest ? (
        <>
          <Image source={latest.image} style={StyleSheet.absoluteFill} contentFit="cover" transition={250} />
          <Scrim from={0} to={0.6} style={{ top: '50%' }} />
          <Glass dark radius={radius.pill} style={styles.pill}>
            <Avatar user={author} size={20} />
            <Text style={styles.pillName} numberOfLines={1}>
              {author?.name.split(' ')[0]}
            </Text>
            <Text style={styles.pillTime}>{ago(latest.createdAt)}</Text>
          </Glass>
        </>
      ) : (
        <View style={styles.widgetEmpty}>
          <Icon name="images" size={22} color={colors.t3} />
          <Text style={styles.pillTime}>{t('w_empty')}</Text>
        </View>
      )}
      <Glass dark radius={radius.pill} style={styles.mark}>
        <Icon name={SRC_ICON[source]} size={11} filled />
        <Text style={styles.markText} numberOfLines={1}>{wide ? `loopi · ${t(SRC_KEY[source])}` : 'loopi'}</Text>
      </Glass>
      {fresh > 0 && (
        <View style={styles.fresh}>
          <Text style={styles.freshText}>{t('w_new', { n: fresh })}</Text>
        </View>
      )}
      <Pressable onPress={onEdit} hitSlop={8} style={styles.edit} accessibilityRole="button" accessibilityLabel={t(SRC_KEY[source])}>
        <Glass dark radius={14} style={styles.editInner}>
          <Icon name="gear" size={13} />
        </Glass>
      </Pressable>
    </Pressable>
  );
}

function AppIcon({ icon, logo, label, size }: { icon?: IconName; logo?: boolean; label: string; size: number }) {
  return (
    <View style={styles.app}>
      {logo ? (
        <View style={[styles.appLogo, { width: size, height: size, borderRadius: size * 0.28 }]}>
          <Text style={styles.appLogoText}>loopi.</Text>
        </View>
      ) : (
        <Glass dark radius={size * 0.28} style={{ width: size, height: size, alignItems: 'center', justifyContent: 'center' }}>
          <Icon name={icon ?? 'phone'} size={size * 0.45} />
        </Glass>
      )}
      <Text style={styles.appLabel} numberOfLines={1}>
        {label}
      </Text>
    </View>
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1, backgroundColor: colors.bg },
  header: { flexDirection: 'row', alignItems: 'center', gap: 12, paddingHorizontal: 16, paddingVertical: 10 },
  content: { alignItems: 'center', padding: 16, gap: 18, paddingBottom: 48 },
  intro: { fontFamily: font.regular, fontSize: 13.5, color: colors.t3, textAlign: 'center', lineHeight: 19 },
  phone: { borderRadius: 46, overflow: 'hidden', padding: 16, paddingTop: 14, gap: 16, borderWidth: 7, borderColor: '#141416', paddingBottom: 104 },
  clock: { fontFamily: font.semibold, fontSize: 15, color: colors.text, alignSelf: 'center' },
  apps: { flexDirection: 'row', flexWrap: 'wrap', justifyContent: 'space-between', alignContent: 'space-between' },
  app: { alignItems: 'center', gap: 4, width: '50%' },
  appLogo: { backgroundColor: colors.text, alignItems: 'center', justifyContent: 'center' },
  appLogoText: { fontFamily: font.heavy, fontSize: 12, letterSpacing: -0.6, color: colors.onWhite },
  appLabel: { fontFamily: font.regular, fontSize: 10, color: 'rgba(255,255,255,0.88)' },
  widget: { borderRadius: 26, overflow: 'hidden', backgroundColor: colors.surface, borderWidth: 1, borderColor: colors.edge },
  widgetEmpty: { flex: 1, alignItems: 'center', justifyContent: 'center', gap: 6 },
  pill: { position: 'absolute', left: 8, bottom: 8, right: 8, flexDirection: 'row', alignItems: 'center', gap: 6, padding: 3, paddingRight: 10 },
  pillName: { flexShrink: 1, fontFamily: font.semibold, fontSize: 11.5, color: colors.text },
  pillTime: { marginLeft: 'auto', fontFamily: font.regular, fontSize: 10.5, color: colors.t2 },
  mark: { position: 'absolute', top: 8, left: 8, maxWidth: '62%', flexDirection: 'row', alignItems: 'center', gap: 4, paddingVertical: 3, paddingHorizontal: 8 },
  markText: { flexShrink: 1, fontFamily: font.bold, fontSize: 10, color: colors.text },
  fresh: { position: 'absolute', top: 9, right: 40, backgroundColor: colors.text, borderRadius: 10, paddingHorizontal: 7, paddingVertical: 2 },
  freshText: { fontFamily: font.heavy, fontSize: 10, color: colors.onWhite },
  edit: { position: 'absolute', top: 6, right: 6 },
  editInner: { width: 28, height: 28, alignItems: 'center', justifyContent: 'center' },
  dock: { position: 'absolute', left: 10, right: 10, bottom: 10, height: 78, flexDirection: 'row', justifyContent: 'space-around', alignItems: 'center' },
  dockIcon: { width: 54, height: 54, borderRadius: 16, backgroundColor: 'rgba(255,255,255,0.1)', alignItems: 'center', justifyContent: 'center' },
  panel: { alignSelf: 'stretch', padding: 16, gap: 12 },
  rule: { fontFamily: font.regular, fontSize: 13, lineHeight: 19, color: colors.t2 },
  panelLabel: { fontFamily: font.semibold, fontSize: 13, color: colors.text },
  chips: { flexDirection: 'row', flexWrap: 'wrap', gap: 8 },
});
