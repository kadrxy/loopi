import * as Haptics from 'expo-haptics';
import { useRef, useState, type ComponentRef } from 'react';
import { FlatList, Pressable, StyleSheet, Text, TextInput, View } from 'react-native';
import Animated, { FadeInDown } from 'react-native-reanimated';

import { appStore, useApp } from '@/data';
import type { Comment, Graph, Moment } from '@/domain/types';
import { useT } from '@/i18n';
import { Avatar, BottomSheet, colors, font, Icon, radius, useTimeAgo } from '@/ui';

type Props = { visible: boolean; moment: Moment; graph: Graph; onClose: () => void; onComment: (body: string) => void };

/** Comments as a draggable sheet: who, when, likes and replies per comment, composer pinned below. */
export function CommentsSheet({ visible, moment, graph, onClose, onComment }: Props) {
  const t = useT();
  const ago = useTimeAgo();
  const meId = useApp((s) => s.meId);
  const [text, setText] = useState('');
  const [replyTo, setReplyTo] = useState<string | null>(null);
  const input = useRef<ComponentRef<typeof TextInput>>(null);
  const list = useRef<FlatList<Comment>>(null);
  const me = graph.users[meId];

  const send = () => {
    const body = text.trim();
    if (!body) return;
    onComment(body);
    setText('');
    setReplyTo(null);
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light).catch(() => {});
    setTimeout(() => list.current?.scrollToEnd({ animated: true }), 120);
  };
  const reply = (c: Comment) => {
    const u = graph.users[c.authorId];
    if (!u) return;
    setReplyTo(u.name);
    setText(`@${u.username} `);
    input.current?.focus();
  };

  return (
    <BottomSheet visible={visible} onClose={onClose} height={0.72}>
      <View style={styles.header}>
        <Text style={styles.title}>{t('comments')}</Text>
        <Text style={styles.count}>{moment.comments.length}</Text>
      </View>

      <FlatList
        ref={list}
        data={moment.comments}
        keyExtractor={(c) => c.id}
        style={{ flex: 1 }}
        contentContainerStyle={styles.list}
        keyboardShouldPersistTaps="handled"
        showsVerticalScrollIndicator={false}
        ListEmptyComponent={
          <View style={styles.empty}>
            <Icon name="chat" size={34} color={colors.t3} />
            <Text style={styles.emptyTitle}>{t('no_comments')}</Text>
            <Text style={styles.emptyBody}>{t('first_comment')}</Text>
          </View>
        }
        renderItem={({ item: c, index }) => {
          const u = graph.users[c.authorId];
          const likes = c.likedBy?.length ?? 0;
          const liked = !!c.likedBy?.includes(meId);
          return (
            <Animated.View entering={FadeInDown.delay(Math.min(index, 6) * 30).duration(260)} style={styles.row}>
              <Avatar user={u} size={36} />
              <View style={{ flex: 1, gap: 3 }}>
                <View style={styles.nameRow}>
                  <Text style={styles.name} numberOfLines={1}>
                    {u?.name}
                  </Text>
                  {c.authorId === moment.authorId && (
                    <View style={styles.author}>
                      <Text style={styles.authorText}>{t('author')}</Text>
                    </View>
                  )}
                  <Text style={styles.time}>{ago(c.createdAt)}</Text>
                </View>
                <Text style={styles.body}>{c.body}</Text>
                <Pressable onPress={() => reply(c)} hitSlop={8} accessibilityRole="button" style={styles.replyBtn}>
                  <Text style={styles.replyText}>{t('reply')}</Text>
                </Pressable>
              </View>
              <Pressable
                onPress={() => {
                  if (!liked) Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light).catch(() => {});
                  appStore.getState().likeComment(moment.id, c.id);
                }}
                hitSlop={10}
                style={styles.like}
                accessibilityRole="button"
                accessibilityLabel={t('like')}
                accessibilityState={{ selected: liked }}>
                <Icon name="heart" size={17} filled={liked} color={liked ? colors.text : colors.t3} />
                {likes > 0 && <Text style={styles.likeCount}>{likes}</Text>}
              </Pressable>
            </Animated.View>
          );
        }}
      />

      <View style={styles.composer}>
        {replyTo && (
          <View style={styles.replying}>
            <Text style={styles.replyingText} numberOfLines={1}>
              {t('replying_to', { name: replyTo })}
            </Text>
            <Pressable
              onPress={() => {
                setReplyTo(null);
                setText('');
              }}
              hitSlop={8}
              accessibilityRole="button"
              accessibilityLabel={t('cancel')}>
              <Icon name="close" size={16} color={colors.t3} />
            </Pressable>
          </View>
        )}
        <View style={styles.inputRow}>
          <Avatar user={me} size={34} />
          <View style={styles.field}>
            <TextInput
              ref={input}
              value={text}
              onChangeText={setText}
              onSubmitEditing={send}
              placeholder={t('comment_ph')}
              placeholderTextColor={colors.t3}
              returnKeyType="send"
              maxLength={300}
              style={styles.input}
              accessibilityLabel={t('comment_ph')}
            />
          </View>
          <Pressable
            onPress={send}
            disabled={!text.trim()}
            style={({ pressed }) => [styles.send, { opacity: text.trim() ? 1 : 0.4, transform: [{ scale: pressed ? 0.92 : 1 }] }]}
            accessibilityRole="button"
            accessibilityLabel={t('send')}>
            <Icon name="arrowUp" size={18} color={colors.onWhite} />
          </Pressable>
        </View>
      </View>
    </BottomSheet>
  );
}

const styles = StyleSheet.create({
  header: {
    flexDirection: 'row',
    alignItems: 'baseline',
    justifyContent: 'center',
    gap: 6,
    paddingBottom: 10,
    borderBottomWidth: 1,
    borderBottomColor: colors.line,
  },
  title: { fontFamily: font.bold, fontSize: 15, color: colors.text },
  count: { fontFamily: font.medium, fontSize: 13, color: colors.t3 },
  list: { paddingHorizontal: 16, paddingTop: 14, paddingBottom: 10, gap: 18, flexGrow: 1 },
  empty: { flex: 1, alignItems: 'center', justifyContent: 'center', gap: 8, paddingVertical: 40 },
  emptyTitle: { fontFamily: font.semibold, fontSize: 15, color: colors.text },
  emptyBody: { fontFamily: font.regular, fontSize: 13, color: colors.t3 },
  row: { flexDirection: 'row', gap: 12 },
  nameRow: { flexDirection: 'row', alignItems: 'center', gap: 6 },
  name: { flexShrink: 1, fontFamily: font.semibold, fontSize: 13, color: colors.text },
  author: { paddingHorizontal: 6, paddingVertical: 1, borderRadius: radius.pill, backgroundColor: 'rgba(255,255,255,0.12)' },
  authorText: { fontFamily: font.semibold, fontSize: 10, color: colors.t2 },
  time: { fontFamily: font.regular, fontSize: 11.5, color: colors.t3 },
  body: { fontFamily: font.regular, fontSize: 14, lineHeight: 20, color: colors.text },
  replyBtn: { alignSelf: 'flex-start', marginTop: 2 },
  replyText: { fontFamily: font.semibold, fontSize: 12, color: colors.t3 },
  like: { alignItems: 'center', gap: 2, paddingTop: 4, minWidth: 28 },
  likeCount: { fontFamily: font.medium, fontSize: 11, color: colors.t3 },
  composer: { borderTopWidth: 1, borderTopColor: colors.line, paddingHorizontal: 12, paddingTop: 10, gap: 8 },
  replying: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingHorizontal: 6 },
  replyingText: { flex: 1, fontFamily: font.regular, fontSize: 12, color: colors.t3 },
  inputRow: { flexDirection: 'row', alignItems: 'center', gap: 10 },
  field: {
    flex: 1,
    borderRadius: radius.pill,
    backgroundColor: 'rgba(255,255,255,0.08)',
    borderWidth: 1,
    borderColor: colors.line,
    paddingHorizontal: 16,
  },
  input: { fontFamily: font.regular, fontSize: 14.5, color: colors.text, paddingVertical: 11 },
  send: { width: 40, height: 40, borderRadius: 20, backgroundColor: colors.text, alignItems: 'center', justifyContent: 'center' },
});
