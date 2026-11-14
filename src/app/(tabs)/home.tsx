import { useFocusEffect, useRouter } from 'expo-router';
import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { Platform, Pressable, RefreshControl, StyleSheet, Text, useWindowDimensions, View, type FlatList } from 'react-native';
import Animated, { Extrapolation, FadeInDown, interpolate, useAnimatedStyle, useDerivedValue } from 'react-native-reanimated';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { appStore, useApp, useRefresh } from '@/data';
import { activityFor, discoverFor, feedFor, storyGroups } from '@/domain/rules';
import type { Moment } from '@/domain/types';
import { CameraScreen } from '@/features/camera/CameraScreen';
import { EmptyFeed } from '@/features/home/EmptyFeed';
import { MomentCard } from '@/features/home/MomentCard';
import { StoriesRow } from '@/features/home/StoriesRow';
import { MapScreen } from '@/features/map/MapScreen';
import { useMomentSheets } from '@/features/moment/MomentSheets';
import { useT } from '@/i18n';
import {
  colors,
  EmptyState,
  font,
  Glass,
  Halo,
  Icon,
  IconButton,
  PullLoader,
  radius,
  Segmented,
  Sheet,
  SwipePager,
  usePullRefresh,
  useNow,
  useTabReselect,
  Wordmark,
  type SwipePagerRef,
} from '@/ui';
import { useTabBarSpace } from '@/ui/GlassTabBar';
import { homeProgress } from '@/ui/immersive';

const FRESH_MS = 15 * 60_000;
type Tab = 'feed' | 'discover';
const PAGE: Record<Tab, number> = { feed: 1, discover: 2 };

export default function Home() {
  const t = useT();
  const router = useRouter();
  const { width } = useWindowDimensions();
  const insets = useSafeAreaInsets();
  const bottomSpace = useTabBarSpace();
  const meId = useApp((s) => s.meId);
  const graph = useApp((s) => s.graph);
  const moments = useApp((s) => s.moments);
  const homeTab = useApp((s) => s.settings.homeTab);
  const centerTab = useApp((s) => s.settings.centerTab);
  const [page, setPage] = useState(PAGE[homeTab]);
  const tab: Tab = page === 2 ? 'discover' : 'feed';
  const [why, setWhy] = useState(false);
  const [headerH, setHeaderH] = useState(insets.top + 112);
  const now = useNow();
  const { refreshing, onRefresh } = useRefresh();

  // Pages: [camera or map | Following | Discover]. The pill, the header and the tab bar follow the finger.
  const pager = useRef<SwipePagerRef>(null);
  useEffect(() => {
    homeProgress.set(PAGE[homeTab]);
    return () => {
      homeProgress.set(1); // leaving Home: never leave the tab bar hidden
    };
  }, [homeTab]);
  const pill = useDerivedValue(() => Math.min(1, Math.max(0, homeProgress.value - 1)));
  const headerStyle = useAnimatedStyle(() => {
    const away = interpolate(homeProgress.value, [0, 1], [1, 0], Extrapolation.CLAMP);
    return { opacity: 1 - away, transform: [{ translateX: away * width }] };
  });
  const goTo = (k: Tab) => pager.current?.goTo(PAGE[k]);
  // Browsers reset the scroll position of a hidden tab; put the pager back where it was on return.
  useFocusEffect(
    useCallback(() => {
      if (Platform.OS === 'web') pager.current?.goTo(page, false);
    }, [page]),
  );

  const feed = useMemo(() => feedFor(graph, meId, moments), [graph, meId, moments]);
  const discover = useMemo(() => discoverFor(graph, meId, moments), [graph, meId, moments]);
  const seen = useApp((s) => s.seen);
  const order = useApp((s) => s.seenAtRefresh);
  const groups = useMemo(
    () =>
      storyGroups(graph, meId, moments)
        .map((g) => ({ ...g, unseen: !seen[g.userId] }))
        .sort((a, b) => Number(!!order[a.userId]) - Number(!!order[b.userId])),
    [graph, meId, moments, seen, order],
  );
  const fresh = feed.filter((m) => m.authorId !== meId && now - m.createdAt < FRESH_MS).length;
  const notif = useMemo(() => activityFor(graph, meId, moments).filter((a) => a.kind !== 'follow').length, [graph, meId, moments]);
  const cardHeight = Math.round((width - 20) * 1.08);

  const sheets = useMomentSheets();
  const openUser = (id: string) => (id === meId ? router.navigate('/profile') : router.push({ pathname: '/user/[id]', params: { id } }));

  const renderCard = ({ item, index }: { item: Moment; index: number }) => (
    <Animated.View entering={FadeInDown.delay(Math.min(index, 5) * 60).duration(380)}>
      <MomentCard
        moment={item}
        graph={graph}
        meId={meId}
        height={cardHeight}
        onOpenUser={() => openUser(item.authorId)}
        onLike={() => appStore.getState().react(item.id, 'heart')}
        onComments={() => sheets.openComments(item)}
        onSend={() => sheets.openSend(item)}
        onReact={(r) => appStore.getState().react(item.id, r)}
      />
    </Animated.View>
  );
  const refresh = (
    <RefreshControl
      refreshing={refreshing}
      onRefresh={onRefresh}
      tintColor={colors.text}
      colors={[colors.onWhite]}
      progressBackgroundColor={colors.text}
      progressViewOffset={headerH}
    />
  );
  // Lists start under the floating header. iOS insets the scroll view and pulls with the brand loader
  // just below the header (content is held down while refreshing); elsewhere the content is padded
  // and the system spinner offset below the header.
  const ios = Platform.OS === 'ios';
  const listStyle = { paddingBottom: bottomSpace, gap: 18 };
  const listInset = ios
    ? {
        contentInset: { top: headerH },
        contentOffset: { x: 0, y: -headerH },
        scrollIndicatorInsets: { top: headerH },
      }
    : { contentContainerStyle: { ...listStyle, paddingTop: headerH } };
  const restY = ios ? -headerH : 0;
  const pullFeed = usePullRefresh(refreshing, onRefresh, restY, ios);
  const pullDiscover = usePullRefresh(refreshing, onRefresh, restY, ios);
  // Big photo cards: draw only what is near the screen, in small batches, so the first frame is fast.
  const listTuning = { initialNumToRender: 2, maxToRenderPerBatch: 2, windowSize: 5, removeClippedSubviews: Platform.OS === 'android' };
  const listProps = (pull: ReturnType<typeof usePullRefresh>) => ({
    ...listTuning,
    onScroll: pull.onScroll,
    scrollEventThrottle: 16,
    ...(ios ? {} : { refreshControl: refresh }),
  });

  // Scrolling down slides the Following/Discover row up under the logo bar (like the stories above
  // the cards); scrolling back to the top brings it back.
  const [segH, setSegH] = useState(66);
  const segStyle = useAnimatedStyle(() => {
    const y = page === 2 ? pullDiscover.scrollY.value : pullFeed.scrollY.value;
    const hide = Math.min(segH, Math.max(0, y));
    return { opacity: 1 - hide / segH, transform: [{ translateY: -hide }] };
  });

  // Tapping Home again: back to the top of the list (or to Following from the side page).
  const feedList = useRef<FlatList<Moment>>(null);
  const discoverList = useRef<FlatList<Moment>>(null);
  useTabReselect('home', () => {
    if (page === 0) return pager.current?.goTo(1);
    (page === 2 ? discoverList : feedList).current?.scrollToOffset({ offset: restY, animated: true });
  });

  const left =
    centerTab === 'map' ? (
      <CameraScreen key="left" active={page === 0} onDone={() => pager.current?.goTo(1)} />
    ) : (
      <MapScreen key="left" withTabBar={false} />
    );

  return (
    <View style={styles.screen}>
      <Halo style={styles.halo} />
      <SwipePager
        ref={pager}
        initialIndex={PAGE[homeTab]}
        progress={homeProgress}
        onIndexChange={setPage}
        pages={[
          left,
          <Animated.FlatList
            ref={feedList}
            key="feed"
            data={feed}
            keyExtractor={(m) => m.id}
            renderItem={renderCard}
            {...listProps(pullFeed)}
            contentContainerStyle={listStyle}
            {...listInset}
            showsVerticalScrollIndicator={false}
            ListHeaderComponent={
              <View>
                <Animated.View style={pullFeed.spacer} />
                <StoriesRow
                  me={graph.users[meId]}
                  groups={groups}
                  graph={graph}
                  onAdd={() => router.push('/camera')}
                  onOpen={(g, origin) =>
                    router.push({
                      pathname: '/story/[id]',
                      params: {
                        id: g.userId,
                        ox: String(origin.x),
                        oy: String(origin.y),
                      },
                    })
                  }
                />
                {fresh > 0 && (
                  <View style={styles.freshWrap}>
                    <Glass dark radius={radius.pill} style={styles.fresh}>
                      <Icon name="sparkle" size={13} />
                      <Text style={styles.freshText}>{t('new_moments', { n: fresh })}</Text>
                    </Glass>
                  </View>
                )}
              </View>
            }
            ListEmptyComponent={<EmptyFeed onDiscover={() => goTo('discover')} />}
          />,
          <Animated.FlatList
            ref={discoverList}
            key="discover"
            data={discover}
            keyExtractor={(m) => m.id}
            renderItem={renderCard}
            {...listProps(pullDiscover)}
            contentContainerStyle={listStyle}
            {...listInset}
            showsVerticalScrollIndicator={false}
            ListHeaderComponent={
              <View>
                <Animated.View style={pullDiscover.spacer} />
                <Pressable onPress={() => setWhy(true)} style={styles.why} accessibilityRole="button">
                  <Icon name="sparkle" size={14} color={colors.t2} />
                  <Text style={styles.whyText}>{t('why_this')}</Text>
                </Pressable>
              </View>
            }
            ListEmptyComponent={<EmptyState icon="sparkle" title={t('discover_empty')} />}
          />,
        ]}
      />

      {ios && page === 1 && <PullLoader style={pullFeed.loader} top={headerH + 8} />}
      {ios && page === 2 && <PullLoader style={pullDiscover.loader} top={headerH + 8} />}
      <Animated.View
        style={[styles.header, headerStyle]}
        pointerEvents={page === 0 ? 'none' : 'box-none'}
        onLayout={(e) => setHeaderH(e.nativeEvent.layout.height)}>
        <View style={[styles.top, { paddingTop: insets.top + 6 }]}>
          <Wordmark />
          <View style={styles.actions}>
            <IconButton name="search" label={t('search')} onPress={() => router.push('/search')} />
            <IconButton name="bell" label={t('notifications')} badge={notif} onPress={() => router.push('/notifications')} />
          </View>
        </View>
        <Animated.View style={[styles.seg, segStyle]} onLayout={(e) => setSegH(e.nativeEvent.layout.height)}>
          <Segmented
            options={[
              { key: 'feed', label: t('feed') },
              { key: 'discover', label: t('discover') },
            ]}
            value={tab}
            onChange={goTo}
            progress={pill}
          />
        </Animated.View>
      </Animated.View>

      <Sheet visible={why} title={t('why_this')} body={t('why_this_body')} onClose={() => setWhy(false)} />
      {sheets.sheets}
    </View>
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1, backgroundColor: colors.bg },
  halo: { position: 'absolute', top: -130, alignSelf: 'center' },
  header: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
  },
  top: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingLeft: 20,
    paddingRight: 16,
    paddingBottom: 2,
    backgroundColor: colors.bg,
    zIndex: 2,
  },
  actions: { flexDirection: 'row', gap: 10 },
  seg: { paddingHorizontal: 16, paddingTop: 12, paddingBottom: 10, backgroundColor: 'rgba(0,0,0,0.86)', zIndex: 1 },
  why: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    paddingVertical: 14,
    minHeight: 44,
  },
  whyText: { fontFamily: font.medium, fontSize: 12.5, color: colors.t2 },
  freshWrap: { alignSelf: 'center', marginBottom: 4 },
  fresh: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingVertical: 6,
    paddingHorizontal: 12,
  },
  freshText: { fontFamily: font.semibold, fontSize: 11.5, color: colors.text },
});
