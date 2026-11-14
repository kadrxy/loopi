import { useRouter } from 'expo-router';
import { useRef, useState } from 'react';
import { FlatList, Pressable, RefreshControl, StyleSheet, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { useApp, useRefresh } from '@/data';
import type { Message } from '@/domain/types';
import { ProfilePeek } from '@/features/profile/ProfilePeek';
import { useT } from '@/i18n';
import { Avatar, colors, EmptyState, font, Halo, Icon, Receipt, type as T, useTabReselect, useTimeAgo } from '@/ui';
import { useTabBarSpace } from '@/ui/GlassTabBar';

type Row = { id: string; msgs: Message[]; last: Message };

export default function Inbox() {
  const t = useT();
  const ago = useTimeAgo();
  const router = useRouter();
  const bottomSpace = useTabBarSpace();
  const meId = useApp((s) => s.meId);
  const graph = useApp((s) => s.graph);
  const conversations = useApp((s) => s.conversations);
  const typing = useApp((s) => s.typing);
  const { refreshing, onRefresh } = useRefresh();
  const list = useRef<FlatList<Row>>(null);
  const [peek, setPeek] = useState<string>();
  useTabReselect('inbox', () => list.current?.scrollToOffset({ offset: 0, animated: true }));
  const rows: Row[] = Object.entries(conversations)
    .filter(([, msgs]) => msgs.length)
    .map(([id, msgs]) => ({ id, msgs, last: msgs[msgs.length - 1] }))
    .sort((a, b) => b.last.createdAt - a.last.createdAt);

  return (
    <SafeAreaView edges={['top']} style={styles.screen}>
      <Halo style={styles.halo} />
      <Text style={[T.title, styles.title]}>{t('tab_inbox')}</Text>
      <FlatList
        ref={list}
        showsVerticalScrollIndicator={false}
        data={rows}
        keyExtractor={(r) => r.id}
        contentContainerStyle={{ paddingBottom: bottomSpace, paddingTop: 8, flexGrow: 1 }}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={colors.text} />}
        ListEmptyComponent={<EmptyState icon="chats" title={t('tab_inbox')} body={t('inbox_empty')} />}
        renderItem={({ item }) => {
          const u = graph.users[item.id];
          const unread = item.msgs.some((m) => m.fromId !== meId && !m.read);
          const mineLast = item.last.fromId === meId;
          return (
            <Pressable
              onPress={() => router.push({ pathname: '/chat/[id]', params: { id: item.id } })}
              style={({ pressed }) => [styles.row, pressed && { backgroundColor: 'rgba(255,255,255,0.04)' }]}
              accessibilityRole="button"
              accessibilityLabel={u?.name}>
              <Pressable onPress={() => setPeek(item.id)} hitSlop={4} accessibilityRole="button" accessibilityLabel={u?.name}>
                <Avatar user={u} size={52} ring={unread} />
              </Pressable>
              <View style={{ flex: 1, gap: 2 }}>
                <Text style={[styles.name, !unread && { fontFamily: font.medium }]} numberOfLines={1}>
                  {u?.name}
                </Text>
                <View style={styles.previewRow}>
                  {mineLast && !typing[item.id] && <Receipt status={item.last.status} size={15} />}
                  {(item.last.replyToMomentId || item.last.image != null) && <Icon name="camera" size={13} color={colors.t3} />}
                  <Text style={[styles.preview, unread && { color: colors.t2 }]} numberOfLines={1}>
                    {typing[item.id] ? t('typing') : item.last.body || t('photo')}
                  </Text>
                </View>
              </View>
              <View style={{ alignItems: 'flex-end', gap: 6 }}>
                <Text style={styles.time}>{ago(item.last.createdAt)}</Text>
                {unread && <View style={styles.dot} />}
              </View>
            </Pressable>
          );
        }}
      />
      <ProfilePeek userId={peek} onClose={() => setPeek(undefined)} />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1, backgroundColor: colors.bg },
  halo: { position: 'absolute', top: -130, alignSelf: 'center' },
  title: { paddingHorizontal: 20, paddingTop: 10, paddingBottom: 6 },
  row: { flexDirection: 'row', alignItems: 'center', gap: 12, paddingHorizontal: 18, paddingVertical: 10, minHeight: 72 },
  name: { fontFamily: font.semibold, fontSize: 15, color: colors.text },
  previewRow: { flexDirection: 'row', alignItems: 'center', gap: 5 },
  preview: { flex: 1, fontFamily: font.regular, fontSize: 13, color: colors.t3 },
  time: { fontFamily: font.regular, fontSize: 11.5, color: colors.t3 },
  dot: { width: 8, height: 8, borderRadius: 4, backgroundColor: colors.text },
});
