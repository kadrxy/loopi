import { Image } from 'expo-image';
import { useRouter } from 'expo-router';
import { useMemo, useRef, useState } from 'react';
import { FlatList, Pressable, StyleSheet, Text, useWindowDimensions, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { useApp } from '@/data';
import { isFriend, mapPlaces } from '@/domain/rules';
import type { MapPlace } from '@/domain/types';
import { useT } from '@/i18n';
import { AvatarStack, Chip, colors, font, Glass, Icon, IconButton, radius, useTimeAgo } from '@/ui';
import { useTabBarSpace } from '@/ui/GlassTabBar';

import { DA_NANG, MapCanvas, type MapCanvasRef } from './MapCanvas';

type Filter = 'all' | 'friends';

/** Social map: where the moments I may see were taken, as photo pins plus a swipeable card strip. */
export function MapScreen({ withTabBar = true }: { withTabBar?: boolean }) {
  const t = useT();
  const router = useRouter();
  const ago = useTimeAgo();
  const insets = useSafeAreaInsets();
  const { width } = useWindowDimensions();
  const tabSpace = useTabBarSpace();
  const bottom = withTabBar ? tabSpace : insets.bottom + 16;
  const meId = useApp((s) => s.meId);
  const graph = useApp((s) => s.graph);
  const moments = useApp((s) => s.moments);
  const [filter, setFilter] = useState<Filter>('all');
  const [selected, setSelected] = useState<string>();
  const canvas = useRef<MapCanvasRef>(null);
  const strip = useRef<FlatList<MapPlace>>(null);

  const places = useMemo(() => {
    const all = mapPlaces(graph, meId, moments);
    if (filter === 'all') return all;
    return all
      .map((p) => ({ ...p, moments: p.moments.filter((m) => m.authorId === meId || isFriend(graph, meId, m.authorId)) }))
      .filter((p) => p.moments.length);
  }, [graph, meId, moments, filter]);

  const cardW = width - 64;
  const select = (name: string, scroll = true) => {
    setSelected(name);
    const i = places.findIndex((p) => p.name === name);
    if (i < 0) return;
    canvas.current?.focus(places[i]);
    if (scroll) strip.current?.scrollToIndex({ index: i, animated: true, viewPosition: 0.5 });
  };

  return (
    <View style={styles.screen}>
      <MapCanvas ref={canvas} places={places} selected={selected} onSelect={select} bottomInset={bottom + 120} />

      <View style={[styles.top, { paddingTop: insets.top + 8 }]} pointerEvents="box-none">
        <Pressable onPress={() => router.push('/search')} accessibilityRole="search" accessibilityLabel={t('map_search')}>
          <Glass dark radius={radius.pill} style={styles.search}>
            <Icon name="search" size={18} color={colors.t2} />
            <Text style={styles.searchText}>{t('map_search')}</Text>
          </Glass>
        </Pressable>
        <View style={styles.chips}>
          <Chip dark icon="globe" iconFilled={filter === 'all'} label={t('map_all')} selected={filter === 'all'} onPress={() => setFilter('all')} />
          <Chip dark icon="heart" iconFilled={filter === 'friends'} label={t('aud_friends')} selected={filter === 'friends'} onPress={() => setFilter('friends')} />
        </View>
      </View>

      <View style={[styles.locate, { bottom: bottom + 150 }]}>
        <IconButton
          name="gps"
          dark
          label={t('map_center')}
          onPress={() => canvas.current?.focus({ lat: DA_NANG.latitude, lng: DA_NANG.longitude })}
        />
      </View>

      <FlatList
        ref={strip}
        data={places}
        horizontal
        keyExtractor={(p) => p.name}
        showsHorizontalScrollIndicator={false}
        snapToInterval={cardW + 10}
        decelerationRate="fast"
        contentContainerStyle={{ paddingHorizontal: 32, gap: 10 }}
        style={[styles.strip, { bottom }]}
        onScrollToIndexFailed={() => {}}
        onMomentumScrollEnd={(e) => {
          const i = Math.round(e.nativeEvent.contentOffset.x / (cardW + 10));
          if (places[i]) select(places[i].name, false);
        }}
        renderItem={({ item }) => {
          const latest = item.moments[0];
          const people = [...new Set(item.moments.map((m) => m.authorId))].map((id) => graph.users[id]).filter(Boolean);
          return (
            <Pressable
              onPress={() => (selected === item.name ? router.push({ pathname: '/post/[id]', params: { id: latest.id } }) : select(item.name))}
              accessibilityRole="button"
              accessibilityLabel={item.name}
              style={{ width: cardW }}>
              <Glass dark radius={24} style={[styles.card, selected === item.name && styles.cardOn]}>
                <Image source={latest.image} style={styles.cardImg} contentFit="cover" />
                <View style={{ flex: 1, gap: 4 }}>
                  <View style={styles.cardTitleRow}>
                    <Icon name="pin" size={14} filled />
                    <Text style={styles.cardTitle} numberOfLines={1}>
                      {item.name}
                    </Text>
                  </View>
                  <Text style={styles.cardSub} numberOfLines={1}>
                    {t('moment_count', { n: item.moments.length })} · {ago(latest.createdAt)}
                  </Text>
                  <AvatarStack users={people} size={20} />
                </View>
                <Icon name="caretRight" size={18} color={colors.t3} />
              </Glass>
            </Pressable>
          );
        }}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1, backgroundColor: colors.bg },
  top: { position: 'absolute', left: 14, right: 14, gap: 10 },
  search: { flexDirection: 'row', alignItems: 'center', gap: 10, paddingHorizontal: 16, height: 48 },
  searchText: { fontFamily: font.regular, fontSize: 14.5, color: colors.t2 },
  chips: { flexDirection: 'row', gap: 8 },
  locate: { position: 'absolute', right: 14 },
  strip: { position: 'absolute', left: 0, right: 0, flexGrow: 0 },
  card: { flexDirection: 'row', alignItems: 'center', gap: 12, padding: 10, paddingRight: 14 },
  cardOn: { borderColor: colors.text },
  cardImg: { width: 76, height: 76, borderRadius: 16, backgroundColor: colors.surface },
  cardTitleRow: { flexDirection: 'row', alignItems: 'center', gap: 5 },
  cardTitle: { flexShrink: 1, fontFamily: font.semibold, fontSize: 15, color: colors.text },
  cardSub: { fontFamily: font.regular, fontSize: 12, color: colors.t3 },
});
