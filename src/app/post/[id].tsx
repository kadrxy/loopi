import { useLocalSearchParams, useRouter } from 'expo-router';
import { useMemo, useRef, useState } from 'react';
import { FlatList, StyleSheet, Text, useWindowDimensions, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { appStore, useApp } from '@/data';
import { canView, userMoments } from '@/domain/rules';
import type { Moment } from '@/domain/types';
import { MomentCard } from '@/features/home/MomentCard';
import { useMomentSheets } from '@/features/moment/MomentSheets';
import { useT } from '@/i18n';
import { colors, EmptyState, font, IconButton, Sheet } from '@/ui';

const REPORT_KEYS = ['report_harassment', 'report_nudity', 'report_spam', 'report_minor', 'report_other'] as const;

/** A person's posts as cards, opened at the one that was tapped (Instagram's "Posts" view). */
export default function Posts() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const t = useT();
  const router = useRouter();
  const { width } = useWindowDimensions();
  const meId = useApp((s) => s.meId);
  const graph = useApp((s) => s.graph);
  const moments = useApp((s) => s.moments);
  const sheets = useMomentSheets();
  const [report, setReport] = useState(false);
  const [thanks, setThanks] = useState(false);
  const list = useRef<FlatList<Moment>>(null);
  const placed = useRef(false);

  const moment = moments.find((m) => m.id === id);
  const author = moment ? graph.users[moment.authorId] : undefined;
  const posts = useMemo(() => (moment ? userMoments(graph, meId, moments, moment.authorId) : []), [graph, meId, moments, moment]);
  const start = Math.max(
    0,
    posts.findIndex((m) => m.id === id),
  );
  const cardHeight = Math.round((width - 20) * 1.08);
  const close = () => (router.canGoBack() ? router.back() : router.replace('/home'));
  const openUser = (uid: string) => (uid === meId ? router.navigate('/profile') : router.push({ pathname: '/user/[id]', params: { id: uid } }));

  return (
    <SafeAreaView edges={['top']} style={styles.screen}>
      <View style={styles.header}>
        <View style={{ flex: 1 }}>
          <Text style={styles.kicker}>{t('posts')}</Text>
          <Text style={styles.title} numberOfLines={1}>
            {author?.name ?? ''}
          </Text>
        </View>
        {moment && moment.authorId !== meId && <IconButton name="dots" size="sm" label={t('report')} onPress={() => setReport(true)} />}
        <IconButton name="close" size="sm" label={t('close')} onPress={close} />
      </View>

      {!moment || !canView(graph, meId, moment) ? (
        <EmptyState icon="lock" title={t('not_found')} />
      ) : (
        <FlatList
          ref={list}
          data={posts}
          keyExtractor={(m) => m.id}
          contentContainerStyle={styles.list}
          showsVerticalScrollIndicator={false}
          initialNumToRender={Math.max(3, start + 2)}
          onLayout={() => {
            // Open at the tapped post; once only, so later updates do not yank the list.
            if (placed.current || start === 0) return;
            placed.current = true;
            requestAnimationFrame(() => list.current?.scrollToIndex({ index: start, animated: false }));
          }}
          onScrollToIndexFailed={(e) =>
            setTimeout(() => list.current?.scrollToOffset({ offset: e.averageItemLength * e.index, animated: false }), 50)
          }
          renderItem={({ item }) => (
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
          )}
        />
      )}

      {sheets.sheets}
      <Sheet
        visible={report}
        title={t('report_title')}
        options={REPORT_KEYS.map((k) => ({ label: t(k), onPress: () => setThanks(true) }))}
        onClose={() => setReport(false)}
      />
      <Sheet visible={thanks} title={t('report_thanks')} onClose={() => setThanks(false)} />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1, backgroundColor: colors.bg },
  header: { flexDirection: 'row', alignItems: 'center', gap: 10, paddingHorizontal: 18, paddingTop: 6, paddingBottom: 10 },
  kicker: { fontFamily: font.medium, fontSize: 11.5, color: colors.t3 },
  title: { fontFamily: font.displayBold, fontSize: 20, color: colors.text },
  list: { paddingTop: 4, paddingBottom: 40, gap: 18 },
});
