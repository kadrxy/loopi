import { Image } from 'expo-image';
import { useRouter } from 'expo-router';
import { useMemo, useRef, useState, type ReactNode } from 'react';
import { Platform, Pressable, RefreshControl, StyleSheet, Text, useWindowDimensions, View } from 'react-native';
import Animated, { useAnimatedStyle, useSharedValue } from 'react-native-reanimated';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { useApp, useRefresh } from '@/data';
import { canView, isBlocked, isFollowing, isFriend, isPending } from '@/domain/rules';
import type { Audience, Graph } from '@/domain/types';
import { AUDIENCE_ICON, AUDIENCE_KEY } from '@/features/home/MomentCard';
import { useT, type TKey } from '@/i18n';
import {
  Avatar,
  Button,
  colors,
  EmptyState,
  font,
  Glass,
  Halo,
  Icon,
  PullLoader,
  Scrim,
  SwipePager,
  usePullRefresh,
  useTabReselect,
  type as T,
  type IconName,
  type SwipePagerRef,
} from '@/ui';

type Filter = 'all' | Audience;
const COVER_H = 220;
const FILTERS: { key: Filter; icon: IconName }[] = [
  { key: 'all', icon: 'grid' },
  { key: 'friends', icon: 'heart' },
  { key: 'followers', icon: 'users' },
  { key: 'everyone', icon: 'globe' },
];

export function followLabelKey(g: Graph, meId: string, userId: string): TKey {
  if (isFriend(g, meId, userId)) return 'friends_btn';
  if (isFollowing(g, meId, userId)) return 'following_btn';
  if (isPending(g, meId, userId)) return 'requested';
  if (isFollowing(g, userId, meId)) return 'follow_back';
  return 'follow';
}

type Props = { userId: string; topLeft?: ReactNode; topRight?: ReactNode; actions: ReactNode; bottomSpace: number };

export function ProfileView({ userId, topLeft, topRight, actions, bottomSpace }: Props) {
  const t = useT();
  const router = useRouter();
  const { width } = useWindowDimensions();
  const meId = useApp((s) => s.meId);
  const graph = useApp((s) => s.graph);
  const moments = useApp((s) => s.moments);
  const insets = useSafeAreaInsets();
  // Tapping Profile again (own profile) scrolls back to the top.
  const scroller = useRef<Animated.ScrollView>(null);
  useTabReselect(userId === meId ? 'profile' : '', () => scroller.current?.scrollTo({ y: 0, animated: true }));
  const [filterIndex, setFilterIndex] = useState(0);
  const pager = useRef<SwipePagerRef>(null);
  const tabProgress = useSharedValue(0);
  const { refreshing, onRefresh } = useRefresh();

  // Pull to refresh. The cover is edge to edge, so the system spinner would hide under the status
  // bar: on iOS the brand loader appears just below it and the cover stretches to fill the pulled
  // gap (no black band); Android/web offset the native spinner.
  const { onScroll, loader, pull } = usePullRefresh(refreshing, onRefresh);
  const stretch = useAnimatedStyle(() => ({
    transform: [{ translateY: -pull.value / 2 }, { scale: 1 + pull.value / COVER_H }],
  }));
  const indicator = useAnimatedStyle(() => ({ transform: [{ translateX: tabProgress.value * ((width - 28) / FILTERS.length) }] }));
  const user = graph.users[userId];

  const visible = useMemo(
    () => moments.filter((m) => m.authorId === userId && canView(graph, meId, m)).sort((a, b) => b.createdAt - a.createdAt),
    [moments, graph, meId, userId],
  );
  if (!user) return null;
  const locked = userId !== meId && user.isPrivate && !isFollowing(graph, meId, userId);
  const blocked = userId !== meId && isBlocked(graph, meId, userId);
  const ids = Object.keys(graph.users).filter((id) => id !== userId);
  const stats: [TKey, number][] = [
    ['followers', ids.filter((id) => isFollowing(graph, id, userId)).length],
    ['following', ids.filter((id) => isFollowing(graph, userId, id)).length],
    ['friends', ids.filter((id) => isFriend(graph, userId, id)).length],
    ['moments', visible.length],
  ];
  const cell = (width - 28 - 8) / 3;

  const ios = Platform.OS === 'ios';
  const grid = (f: Filter) => {
    const shown = f === 'all' ? visible : visible.filter((m) => m.audience === f);
    if (shown.length === 0) return <EmptyState icon="images" title={t('no_moments')} />;
    return (
      <View style={styles.grid}>
        {shown.map((m) => (
          <Pressable
            key={m.id}
            onPress={() => router.push({ pathname: '/post/[id]', params: { id: m.id } })}
            style={{ width: cell, height: cell * 1.33 }}
            accessibilityRole="imagebutton"
            accessibilityLabel={m.caption}>
            <Image source={m.image} style={styles.gridImg} contentFit="cover" transition={150} cachePolicy="memory-disk" recyclingKey={m.id} />
            <Glass dark radius={11} style={styles.badge}>
              <Icon name={AUDIENCE_ICON[m.audience]} size={11} filled />
            </Glass>
          </Pressable>
        ))}
      </View>
    );
  };

  return (
    <View style={{ flex: 1 }}>
      <Animated.ScrollView
        ref={scroller}
        contentContainerStyle={{ paddingBottom: bottomSpace }}
        showsVerticalScrollIndicator={false}
        onScroll={onScroll}
        scrollEventThrottle={16}
        refreshControl={
          ios ? undefined : (
            <RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={colors.text} progressViewOffset={insets.top + 36} />
          )
        }>
        <View style={styles.cover}>
          <Animated.View style={[StyleSheet.absoluteFill, styles.coverArt, stretch]}>
            {user.cover != null ? (
              <Image source={user.cover} style={StyleSheet.absoluteFill} contentFit="cover" />
            ) : (
              <Halo width={width} height={240} opacity={0.16} />
            )}
            <Scrim from={0.3} to={1} />
          </Animated.View>
          <View style={styles.coverBar}>
            <View>{topLeft}</View>
            <View style={styles.row}>{topRight}</View>
          </View>
        </View>

        <View style={styles.body}>
          <View style={styles.pic}>
            <Avatar user={user} size={86} />
          </View>
          <Text style={[T.title, { marginTop: 8 }]} numberOfLines={1}>
            {user.name}
          </Text>
          <View style={styles.handle}>
            <Text style={styles.handleText}>@{user.username} ·</Text>
            <Icon name={user.isPrivate ? 'lock' : 'globe'} size={13} color={colors.t3} />
            <Text style={styles.handleText}>{t(user.isPrivate ? 'private_profile' : 'public_profile')}</Text>
          </View>
          {!!user.bio && (
            <Text style={styles.bio} numberOfLines={2}>
              {user.bio}
            </Text>
          )}
          <View style={styles.actions}>{actions}</View>

          <Glass radius={24} style={styles.stats}>
            {stats.map(([k, n], i) => (
              <View key={k} style={[styles.stat, i > 0 && styles.statDivider]}>
                <Text style={T.stat}>{n.toLocaleString()}</Text>
                <Text style={styles.statLabel}>{t(k)}</Text>
              </View>
            ))}
          </Glass>

          {blocked ? (
            <EmptyState icon="lock" title={t('blocked_title')} body={t('blocked_body')} />
          ) : locked ? (
            <EmptyState icon="lock" title={t('private_profile')} body={t('private_locked')} />
          ) : (
            <>
              <View style={styles.tabs}>
                {FILTERS.map((f, i) => (
                  <Pressable
                    key={f.key}
                    onPress={() => pager.current?.goTo(i)}
                    style={styles.tab}
                    accessibilityRole="tab"
                    accessibilityLabel={t(f.key === 'all' ? 'moments' : AUDIENCE_KEY[f.key])}
                    accessibilityState={{ selected: filterIndex === i }}>
                    <Icon name={f.icon} size={21} filled={filterIndex === i} color={filterIndex === i ? colors.text : colors.t4} />
                  </Pressable>
                ))}
                <Animated.View style={[styles.tabLine, { width: (width - 28) / FILTERS.length }, indicator]} />
              </View>
              <View style={styles.pagerWrap}>
                <SwipePager ref={pager} autoHeight progress={tabProgress} onIndexChange={setFilterIndex} pages={FILTERS.map((f) => grid(f.key))} />
              </View>
            </>
          )}
        </View>
      </Animated.ScrollView>
      {ios && <PullLoader style={loader} top={insets.top + 6} />}
    </View>
  );
}

/** Follow / Follow back / Requested / Following / Friends. */
export function FollowButton({ userId, onPress, size = 'md' }: { userId: string; onPress: () => void; size?: 'md' | 'lg' }) {
  const t = useT();
  const meId = useApp((s) => s.meId);
  const graph = useApp((s) => s.graph);
  const key = followLabelKey(graph, meId, userId);
  const primary = key === 'follow' || key === 'follow_back';
  return (
    <Button
      title={t(key)}
      kind={primary ? 'primary' : 'glass'}
      icon={key === 'friends_btn' ? 'heart' : primary ? 'plus' : undefined}
      size={size}
      onPress={onPress}
      style={{ flex: 1 }}
    />
  );
}

const styles = StyleSheet.create({
  cover: { height: COVER_H },
  coverArt: { overflow: 'hidden' },
  coverBar: { position: 'absolute', top: 54, left: 14, right: 14, flexDirection: 'row', justifyContent: 'space-between' },
  row: { flexDirection: 'row', gap: 10 },
  body: { marginTop: -60, alignItems: 'center', paddingHorizontal: 14, gap: 4 },
  pic: { padding: 3, borderRadius: 50, backgroundColor: colors.bg, borderWidth: 2, borderColor: colors.text },
  handle: { flexDirection: 'row', alignItems: 'center', gap: 5 },
  handleText: { fontFamily: font.regular, fontSize: 12.5, color: colors.t3 },
  bio: { fontFamily: font.regular, fontSize: 13, color: colors.t2, textAlign: 'center', marginTop: 4, paddingHorizontal: 16 },
  actions: { flexDirection: 'row', gap: 8, alignSelf: 'stretch', marginTop: 14 },
  stats: { flexDirection: 'row', alignSelf: 'stretch', paddingVertical: 14, marginTop: 12 },
  stat: { flex: 1, alignItems: 'center' },
  statDivider: { borderLeftWidth: 1, borderLeftColor: colors.line },
  statLabel: { fontFamily: font.regular, fontSize: 10.5, color: colors.t3 },
  tabs: {
    flexDirection: 'row',
    alignSelf: 'stretch',
    justifyContent: 'space-around',
    marginTop: 12,
    borderBottomWidth: 1,
    borderBottomColor: colors.line,
  },
  tab: { flex: 1, paddingVertical: 10, alignItems: 'center' },
  tabLine: { position: 'absolute', left: 0, bottom: -1, height: 2, backgroundColor: colors.text },
  pagerWrap: { alignSelf: 'stretch', marginHorizontal: -14 },
  grid: { flexDirection: 'row', flexWrap: 'wrap', gap: 4, marginTop: 6, paddingHorizontal: 14 },
  gridImg: { flex: 1, borderRadius: 12, backgroundColor: colors.surface },
  badge: { position: 'absolute', top: 6, right: 6, width: 22, height: 22, alignItems: 'center', justifyContent: 'center' },
});
