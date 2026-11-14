import { Image } from 'expo-image';
import { useRouter } from 'expo-router';
import { useMemo } from 'react';
import { FlatList, Pressable, StyleSheet, Text, View } from 'react-native';
import Animated, { FadeInDown } from 'react-native-reanimated';
import { SafeAreaView } from 'react-native-safe-area-context';

import { appStore, useApp } from '@/data';
import { activityFor } from '@/domain/rules';
import type { ActivityItem } from '@/domain/types';
import { FollowButton } from '@/features/profile/ProfileView';
import { useT, type TKey } from '@/i18n';
import { Avatar, Button, colors, EmptyState, font, Halo, Icon, type as T, useTimeAgo } from '@/ui';

const TEXT: Record<ActivityItem['kind'], TKey> = {
  reaction: 'notif_reacted',
  comment: 'notif_commented',
  follow: 'notif_followed',
  request: 'notif_requested',
};

/** Activity on my moments plus follows; follow requests are answered right here. */
export default function Notifications() {
  const t = useT();
  const ago = useTimeAgo();
  const router = useRouter();
  const meId = useApp((s) => s.meId);
  const graph = useApp((s) => s.graph);
  const moments = useApp((s) => s.moments);
  const items = useMemo(() => activityFor(graph, meId, moments), [graph, meId, moments]);

  const openUser = (id: string) => router.push({ pathname: '/user/[id]', params: { id } });

  return (
    <SafeAreaView edges={['top']} style={styles.screen}>
      <Halo style={styles.halo} />
      <Text style={[T.title, styles.title]}>{t('notif_title')}</Text>
      <FlatList
        showsVerticalScrollIndicator={false}
        data={items}
        keyExtractor={(i) => i.id}
        contentContainerStyle={{ paddingBottom: 40, flexGrow: 1 }}
        ListEmptyComponent={<EmptyState icon="bell" title={t('notif_empty')} />}
        renderItem={({ item, index }) => {
          const u = graph.users[item.fromId];
          const m = item.momentId ? moments.find((x) => x.id === item.momentId) : undefined;
          const dated = item.kind === 'reaction' || item.kind === 'comment';
          return (
            <Animated.View
              entering={FadeInDown.delay(Math.min(index, 8) * 40).duration(320)}
              style={[styles.row, item.kind === 'request' && styles.requestRow]}>
              <Pressable onPress={() => openUser(item.fromId)} hitSlop={6} accessibilityRole="button" accessibilityLabel={u?.name}>
                <Avatar user={u} size={46} />
                {item.reaction && (
                  <View style={styles.badge}>
                    <Icon name={item.reaction} size={12} filled color={colors.onWhite} />
                  </View>
                )}
              </Pressable>
              <Pressable
                onPress={() => (m ? router.push({ pathname: '/post/[id]', params: { id: m.id } }) : openUser(item.fromId))}
                style={styles.textCol}
                accessibilityRole="button"
                accessibilityLabel={`${u?.name} ${t(TEXT[item.kind])}`}>
                <Text style={styles.text} numberOfLines={3}>
                  <Text style={styles.name}>{u?.name} </Text>
                  {t(TEXT[item.kind])}
                  {item.body ? <Text style={styles.body}> {item.body}</Text> : null}
                </Text>
                {dated && <Text style={styles.time}>{ago(item.createdAt)}</Text>}
              </Pressable>
              {item.kind === 'request' ? (
                <View style={styles.actions}>
                  <Button title={t('approve')} size="md" onPress={() => appStore.getState().respondFollow(item.fromId, true)} style={{ flex: 1 }} />
                  <Button
                    title={t('decline')}
                    kind="glass"
                    size="md"
                    onPress={() => appStore.getState().respondFollow(item.fromId, false)}
                    style={{ flex: 1 }}
                  />
                </View>
              ) : item.kind === 'follow' ? (
                <View style={{ width: 156 }}>
                  <FollowButton userId={item.fromId} onPress={() => appStore.getState().toggleFollow(item.fromId)} />
                </View>
              ) : m ? (
                <Pressable
                  onPress={() => router.push({ pathname: '/post/[id]', params: { id: m.id } })}
                  accessibilityRole="imagebutton"
                  accessibilityLabel={m.caption}>
                  <Image source={m.image} style={styles.thumb} contentFit="cover" />
                </Pressable>
              ) : null}
            </Animated.View>
          );
        }}
      />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1, backgroundColor: colors.bg },
  halo: { position: 'absolute', top: -130, alignSelf: 'center' },
  title: { paddingHorizontal: 20, paddingTop: 10, paddingBottom: 10 },
  row: { flexDirection: 'row', alignItems: 'center', gap: 12, paddingHorizontal: 18, paddingVertical: 10, minHeight: 68 },
  requestRow: { flexWrap: 'wrap' },
  textCol: { flex: 1, gap: 2 },
  badge: {
    position: 'absolute',
    right: -3,
    bottom: -3,
    width: 22,
    height: 22,
    borderRadius: 11,
    backgroundColor: colors.text,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 2,
    borderColor: colors.bg,
  },
  text: { fontFamily: font.regular, fontSize: 13.5, lineHeight: 19, color: colors.t2 },
  name: { fontFamily: font.semibold, color: colors.text },
  body: { color: colors.text },
  time: { fontFamily: font.regular, fontSize: 11.5, color: colors.t3 },
  actions: { flexDirection: 'row', gap: 8, width: '100%', paddingLeft: 58 },
  thumb: { width: 44, height: 56, borderRadius: 10, backgroundColor: colors.surface },
});
