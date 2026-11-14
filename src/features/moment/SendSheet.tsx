import * as Haptics from 'expo-haptics';
import { Image } from 'expo-image';
import { useMemo, useState } from 'react';
import { FlatList, StyleSheet, Text, View } from 'react-native';

import { appStore, useApp } from '@/data';
import { canMessage, isFollowing, isFriend } from '@/domain/rules';
import type { Moment } from '@/domain/types';
import { useT } from '@/i18n';
import { Avatar, BottomSheet, Button, colors, font, Icon } from '@/ui';

type Props = { moment?: Moment; visible: boolean; onClose: () => void };

/** Send a moment to people I can message (friends first). Each send is a DM that quotes the moment. */
export function SendSheet({ moment, visible, onClose }: Props) {
  const t = useT();
  const meId = useApp((s) => s.meId);
  const graph = useApp((s) => s.graph);
  const [sent, setSent] = useState<Record<string, boolean>>({});

  const people = useMemo(() => {
    const ids = Object.keys(graph.users).filter((id) => id !== meId && canMessage(graph, meId, id));
    const rank = (id: string) => (isFriend(graph, meId, id) ? 0 : isFollowing(graph, meId, id) ? 1 : 2);
    return ids.sort((a, b) => rank(a) - rank(b));
  }, [graph, meId]);

  const send = async (id: string) => {
    if (!moment || sent[id]) return;
    setSent((s) => ({ ...s, [id]: true }));
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light).catch(() => {});
    await appStore.getState().sendMessage(id, '', moment.id);
  };

  return (
    <BottomSheet
      visible={visible && !!moment}
      onClose={() => {
        onClose();
        setSent({});
      }}
      height={0.6}>
      <View style={styles.header}>
        {moment && <Image source={moment.image} style={styles.thumb} contentFit="cover" />}
        <Text style={styles.title}>{t('send_to')}</Text>
      </View>
      <FlatList
        data={people}
        keyExtractor={(id) => id}
        showsVerticalScrollIndicator={false}
        contentContainerStyle={styles.list}
        ListEmptyComponent={<Text style={styles.empty}>{t('send_nobody')}</Text>}
        renderItem={({ item: id }) => {
          const u = graph.users[id];
          const done = !!sent[id];
          return (
            <View style={styles.row}>
              <Avatar user={u} size={44} />
              <View style={{ flex: 1 }}>
                <Text style={styles.name} numberOfLines={1}>
                  {u?.name}
                </Text>
                <Text style={styles.handle} numberOfLines={1}>
                  @{u?.username}
                </Text>
              </View>
              <View style={{ width: 118 }}>
                {done ? (
                  <View style={styles.sent}>
                    <Icon name="tick" size={16} />
                    <Text style={styles.sentText}>{t('sent')}</Text>
                  </View>
                ) : (
                  <Button title={t('send')} size="md" onPress={() => send(id)} />
                )}
              </View>
            </View>
          );
        }}
      />
    </BottomSheet>
  );
}

const styles = StyleSheet.create({
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    paddingHorizontal: 16,
    paddingBottom: 12,
    borderBottomWidth: 1,
    borderBottomColor: colors.line,
  },
  thumb: { width: 40, height: 52, borderRadius: 10, backgroundColor: colors.surface },
  title: { fontFamily: font.bold, fontSize: 16, color: colors.text },
  list: { paddingHorizontal: 16, paddingVertical: 10, gap: 6 },
  empty: { fontFamily: font.regular, fontSize: 13, color: colors.t3, textAlign: 'center', paddingVertical: 30 },
  row: { flexDirection: 'row', alignItems: 'center', gap: 12, minHeight: 60 },
  name: { fontFamily: font.semibold, fontSize: 14.5, color: colors.text },
  handle: { fontFamily: font.regular, fontSize: 12, color: colors.t3 },
  sent: {
    height: 40,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: colors.line,
  },
  sentText: { fontFamily: font.semibold, fontSize: 13, color: colors.t2 },
});
