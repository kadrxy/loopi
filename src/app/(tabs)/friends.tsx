import { useRouter } from 'expo-router';
import { useMemo, useRef, useState } from 'react';
import { FlatList, Pressable, RefreshControl, ScrollView, StyleSheet, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { appStore, useApp, useRefresh } from '@/data';
import { incomingRequests, isFollowing, isFriend, isPending } from '@/domain/rules';
import { FollowButton } from '@/features/profile/ProfileView';
import { useT } from '@/i18n';
import { Avatar, Button, colors, EmptyState, font, Halo, Segmented, SwipePager, type as T, useTabReselect, type SwipePagerRef } from '@/ui';
import { useSharedValue } from 'react-native-reanimated';
import { useTabBarSpace } from '@/ui/GlassTabBar';

type Seg = 'friends' | 'following' | 'followers' | 'requests';
const SEGS: Seg[] = ['friends', 'following', 'followers', 'requests'];

export default function Friends() {
  const t = useT();
  const router = useRouter();
  const bottomSpace = useTabBarSpace();
  const meId = useApp((s) => s.meId);
  const graph = useApp((s) => s.graph);
  const [seg, setSeg] = useState<Seg>('friends');
  const { refreshing, onRefresh } = useRefresh();
  const pager = useRef<SwipePagerRef>(null);
  const progress = useSharedValue(0);

  const lists = useMemo(() => {
    const others = Object.keys(graph.users).filter((id) => id !== meId);
    return {
      friends: others.filter((id) => isFriend(graph, meId, id)),
      following: others.filter((id) => isFollowing(graph, meId, id)),
      followers: others.filter((id) => isFollowing(graph, id, meId)),
      incoming: incomingRequests(graph, meId),
      outgoing: others.filter((id) => isPending(graph, meId, id)),
    };
  }, [graph, meId]);

  const row = (id: string, incoming = false) => {
    const u = graph.users[id];
    return (
      <View key={id} style={styles.row}>
        <Pressable
          onPress={() => router.push({ pathname: '/user/[id]', params: { id } })}
          style={({ pressed }) => [styles.who, pressed && { opacity: 0.7 }]}
          accessibilityRole="button"
          accessibilityLabel={u?.name}>
          <Avatar user={u} size={48} />
          <View style={{ flex: 1 }}>
            <Text style={styles.name} numberOfLines={1}>
              {u?.name}
            </Text>
            <Text style={styles.handle} numberOfLines={1}>
              @{u?.username}
            </Text>
          </View>
        </Pressable>
        {incoming ? (
          <View style={styles.answer}>
            <Button title={t('approve')} size="md" onPress={() => appStore.getState().respondFollow(id, true)} />
            <Button title={t('decline')} kind="glass" size="md" onPress={() => appStore.getState().respondFollow(id, false)} />
          </View>
        ) : (
          <View style={{ width: 156 }}>
            <FollowButton userId={id} onPress={() => appStore.getState().toggleFollow(id)} />
          </View>
        )}
      </View>
    );
  };
  // Tapping Friends again scrolls the visible list back to the top.
  type Scroller = { scrollToOffset?: (o: { offset: number; animated: boolean }) => void; scrollTo?: (o: { y: number; animated: boolean }) => void };
  const scrollers = useRef<Record<number, Scroller | null>>({});
  useTabReselect('friends', () => {
    const el = scrollers.current[SEGS.indexOf(seg)];
    if (el?.scrollToOffset) el.scrollToOffset({ offset: 0, animated: true });
    else el?.scrollTo?.({ y: 0, animated: true });
  });
  const refresh = <RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={colors.text} />;
  const list = (index: number, ids: string[], empty: string) => (
    <FlatList
      key={SEGS[index]}
      ref={(r) => {
        scrollers.current[index] = r;
      }}
      showsVerticalScrollIndicator={false}
      data={ids}
      keyExtractor={(id) => id}
      contentContainerStyle={{ paddingBottom: bottomSpace, paddingTop: 8 }}
      refreshControl={refresh}
      ListEmptyComponent={<EmptyState icon="friends" title={empty} />}
      renderItem={({ item }) => row(item)}
    />
  );

  return (
    <SafeAreaView edges={['top']} style={styles.screen}>
      <Halo style={styles.halo} />
      <Text style={[T.title, styles.title]}>{t('tab_friends')}</Text>
      <View style={styles.seg}>
        <Segmented
          options={[
            { key: 'friends', label: t('seg_friends') },
            { key: 'following', label: t('seg_following') },
            { key: 'followers', label: t('seg_followers') },
            { key: 'requests', label: lists.incoming.length ? `${t('seg_requests')} ${lists.incoming.length}` : t('seg_requests') },
          ]}
          value={seg}
          onChange={(k) => pager.current?.goTo(SEGS.indexOf(k))}
          progress={progress}
        />
      </View>
      <SwipePager
        ref={pager}
        progress={progress}
        onIndexChange={(i) => setSeg(SEGS[i])}
        pages={[
          list(0, lists.friends, t('list_empty')),
          list(1, lists.following, t('list_empty')),
          list(2, lists.followers, t('list_empty')),
          <ScrollView
            ref={(r) => {
              scrollers.current[3] = r;
            }}
            showsVerticalScrollIndicator={false}
            key="requests"
            contentContainerStyle={{ paddingBottom: bottomSpace, paddingTop: 8 }}
            refreshControl={refresh}>
            {lists.incoming.length + lists.outgoing.length === 0 && <EmptyState icon="friends" title={t('requests_empty')} />}
            {lists.incoming.length > 0 && <Text style={styles.section}>{t('requests_in')}</Text>}
            {lists.incoming.map((id) => row(id, true))}
            {lists.outgoing.length > 0 && <Text style={styles.section}>{t('requests_out')}</Text>}
            {lists.outgoing.map((id) => row(id))}
          </ScrollView>,
        ]}
      />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1, backgroundColor: colors.bg },
  halo: { position: 'absolute', top: -130, alignSelf: 'center' },
  title: { paddingHorizontal: 20, paddingTop: 10 },
  seg: { paddingHorizontal: 16, paddingTop: 14 },
  who: { flex: 1, flexDirection: 'row', alignItems: 'center', gap: 12 },
  row: { flexDirection: 'row', alignItems: 'center', gap: 12, paddingHorizontal: 18, paddingVertical: 10, minHeight: 68 },
  name: { fontFamily: font.semibold, fontSize: 15, color: colors.text },
  handle: { fontFamily: font.regular, fontSize: 12.5, color: colors.t3 },
  answer: { flexDirection: 'row', gap: 6 },
  section: { fontFamily: font.semibold, fontSize: 12, color: colors.t3, paddingHorizontal: 20, paddingTop: 14, paddingBottom: 4 },
});
