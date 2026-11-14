import { Image } from 'expo-image';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { useEffect, useRef, useState } from 'react';
import { FlatList, KeyboardAvoidingView, Platform, Pressable, StyleSheet, Text, TextInput, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { appStore, useApp } from '@/data';
import { canMessage, replyPreview } from '@/domain/rules';
import type { Message } from '@/domain/types';
import { pickPhoto } from '@/features/media/pickPhoto';
import { ProfilePeek } from '@/features/profile/ProfilePeek';
import { useSafetyMenu } from '@/features/profile/SafetyMenu';
import { useT } from '@/i18n';
import { Avatar, colors, font, Glass, Icon, IconButton, radius, Receipt, Sheet } from '@/ui';

export default function Chat() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const t = useT();
  const router = useRouter();
  const listRef = useRef<FlatList<Message>>(null);
  const meId = useApp((s) => s.meId);
  const graph = useApp((s) => s.graph);
  const moments = useApp((s) => s.moments);
  const conversation = useApp((s) => s.conversations[id]);
  const typing = useApp((s) => !!s.typing[id]);
  const [text, setText] = useState('');
  const [attach, setAttach] = useState(false);
  const [peek, setPeek] = useState(false);
  const safety = useSafetyMenu(id, () => (router.canGoBack() ? router.back() : router.replace('/inbox')));
  const other = graph.users[id];
  const msgs = conversation ?? [];
  const dmOk = canMessage(graph, meId, id);
  const lang = useApp((s) => s.settings.lang);
  const clock = (ms: number) => new Date(ms).toLocaleTimeString(lang === 'tr' ? 'tr-TR' : 'en-GB', { hour: '2-digit', minute: '2-digit' });

  // Reading the chat marks their messages read (also new ones that arrive while it is open).
  const incoming = msgs.filter((m) => m.fromId !== meId).length;
  useEffect(() => {
    appStore.getState().markRead(id);
  }, [id, incoming]);

  const sendPhoto = async (source: 'camera' | 'library') => {
    const uri = await pickPhoto(source);
    if (uri) appStore.getState().sendMessage(id, '', undefined, uri);
  };
  const send = () => {
    const body = text.trim();
    if (!body) return;
    setText('');
    appStore.getState().sendMessage(id, body);
  };

  return (
    <SafeAreaView style={styles.screen} edges={['top', 'bottom']}>
      <KeyboardAvoidingView style={{ flex: 1 }} behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
        <View style={styles.header}>
          <Pressable style={styles.who} onPress={() => setPeek(true)} accessibilityRole="button">
            <Avatar user={other} size={38} />
            <View style={{ flex: 1 }}>
              <Text style={styles.name} numberOfLines={1}>
                {other?.name}
              </Text>
              <View style={styles.statusRow}>
                <View style={styles.online} />
                <Text style={styles.status}>{typing ? t('typing') : t('online')}</Text>
              </View>
            </View>
          </Pressable>
          <IconButton name="dots" size="sm" label={t('more')} onPress={safety.open} />
        </View>

        <FlatList
          ref={listRef}
          data={msgs}
          keyExtractor={(m) => m.id}
          contentContainerStyle={styles.list}
          onContentSizeChange={() => listRef.current?.scrollToEnd({ animated: true })}
          ListHeaderComponent={
            <Glass dark radius={radius.pill} style={styles.day}>
              <Text style={styles.dayText}>{t('today')}</Text>
            </Glass>
          }
          ListFooterComponent={
            typing ? (
              <Glass dark radius={20} style={[styles.bubble, styles.typing]}>
                <View style={styles.typingDot} />
                <View style={[styles.typingDot, { opacity: 0.6 }]} />
                <View style={[styles.typingDot, { opacity: 0.35 }]} />
              </Glass>
            ) : undefined
          }
          renderItem={({ item: m }) => {
            const out = m.fromId === meId;
            const replyTo = replyPreview(graph, meId, moments, m.replyToMomentId);
            return (
              <View style={{ alignItems: out ? 'flex-end' : 'flex-start', gap: 4 }}>
                {replyTo && (
                  <Pressable
                    onPress={() => router.push({ pathname: '/post/[id]', params: { id: replyTo.id } })}
                    style={{ alignItems: out ? 'flex-end' : 'flex-start', gap: 4 }}>
                    <View style={styles.replyLabel}>
                      <Icon name="reply" size={11} color={colors.t3} />
                      <Text style={styles.meta}>{t('photo_reply')}</Text>
                    </View>
                    <Image source={replyTo.image} style={styles.thumb} contentFit="cover" />
                  </Pressable>
                )}
                {m.image != null && (
                  <View>
                    <Image source={m.image} style={styles.photo} contentFit="cover" transition={150} />
                    {!m.body && (
                      <View style={styles.photoMeta}>
                        <Text style={styles.photoTime}>{clock(m.createdAt)}</Text>
                        {out && <Receipt status={m.status} size={14} />}
                      </View>
                    )}
                  </View>
                )}
                {!m.body ? null : out ? (
                  <View style={[styles.bubble, styles.out]}>
                    <Text style={styles.outText}>
                      {m.body}
                      <Text style={styles.metaSpacer}>{'      ' + clock(m.createdAt) + '    '}</Text>
                    </Text>
                    <View style={styles.bubbleMeta}>
                      <Text style={styles.outTime}>{clock(m.createdAt)}</Text>
                      <Receipt status={m.status} size={14} onLight />
                    </View>
                  </View>
                ) : (
                  <Glass dark radius={20} style={[styles.bubble, styles.in]}>
                    <Text style={styles.inText}>
                      {m.body}
                      <Text style={styles.metaSpacer}>{'      ' + clock(m.createdAt)}</Text>
                    </Text>
                    <View style={styles.bubbleMeta}>
                      <Text style={styles.inTime}>{clock(m.createdAt)}</Text>
                    </View>
                  </Glass>
                )}
              </View>
            );
          }}
        />

        {dmOk ? (
          <View style={styles.bar}>
            <IconButton name="galleryAdd" label={t('from_gallery')} onPress={() => setAttach(true)} />
            <Glass dark radius={radius.pill} style={styles.inputWrap}>
              <TextInput
                value={text}
                onChangeText={setText}
                onSubmitEditing={send}
                placeholder={t('message_ph')}
                placeholderTextColor={colors.t3}
                returnKeyType="send"
                style={styles.input}
                accessibilityLabel={t('message_ph')}
              />
              <Pressable onPress={() => sendPhoto('camera')} hitSlop={8} accessibilityRole="button" accessibilityLabel={t('take_photo')}>
                <Icon name="camera" size={20} color={colors.t2} />
              </Pressable>
            </Glass>
            <Pressable
              onPress={send}
              style={({ pressed }) => [styles.send, { transform: [{ scale: pressed ? 0.92 : 1 }] }]}
              accessibilityRole="button"
              accessibilityLabel={t('send')}>
              <Icon name="send" size={19} color={colors.onWhite} filled />
            </Pressable>
          </View>
        ) : (
          <Glass dark radius={radius.pill} style={styles.locked}>
            <Icon name="lock" size={16} color={colors.t3} />
            <Text style={styles.meta}>{t('dm_locked')}</Text>
          </Glass>
        )}
      </KeyboardAvoidingView>
      {safety.sheets}
      <ProfilePeek userId={peek ? id : undefined} onClose={() => setPeek(false)} />
      <Sheet
        visible={attach}
        title={t('photo')}
        options={[
          { label: t('take_photo'), icon: 'camera', onPress: () => sendPhoto('camera') },
          { label: t('from_gallery'), icon: 'images', onPress: () => sendPhoto('library') },
        ]}
        onClose={() => setAttach(false)}
      />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1, backgroundColor: colors.bg },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    paddingHorizontal: 14,
    paddingVertical: 10,
    borderBottomWidth: 1,
    borderBottomColor: colors.line,
  },
  who: { flex: 1, flexDirection: 'row', alignItems: 'center', gap: 10, minHeight: 44 },
  name: { fontFamily: font.semibold, fontSize: 15, color: colors.text },
  statusRow: { flexDirection: 'row', alignItems: 'center', gap: 5 },
  online: { width: 6, height: 6, borderRadius: 3, backgroundColor: colors.text },
  status: { fontFamily: font.regular, fontSize: 11.5, color: colors.t3 },
  list: { padding: 14, gap: 8 },
  day: { alignSelf: 'center', paddingHorizontal: 12, paddingVertical: 4, marginBottom: 6 },
  dayText: { fontFamily: font.semibold, fontSize: 11, color: colors.t2 },
  bubble: { maxWidth: '78%', paddingHorizontal: 14, paddingVertical: 10 },
  in: { borderBottomLeftRadius: 6 },
  out: { backgroundColor: colors.text, borderRadius: 20, borderBottomRightRadius: 6 },
  inText: { fontFamily: font.regular, fontSize: 14.5, lineHeight: 20, color: colors.text },
  outText: { fontFamily: font.medium, fontSize: 14.5, lineHeight: 20, color: colors.onWhite },
  replyLabel: { flexDirection: 'row', alignItems: 'center', gap: 4 },
  // Time and ticks sit in the bubble's bottom-right corner; an invisible copy reserves their room.
  metaSpacer: { fontSize: 11, color: 'transparent' },
  bubbleMeta: { position: 'absolute', right: 10, bottom: 6, flexDirection: 'row', alignItems: 'center', gap: 3 },
  outTime: { fontFamily: font.regular, fontSize: 11, color: 'rgba(0,0,0,0.5)' },
  inTime: { fontFamily: font.regular, fontSize: 11, color: colors.t3 },
  photoMeta: {
    position: 'absolute',
    right: 10,
    bottom: 8,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 3,
    backgroundColor: colors.scrim,
    borderRadius: 10,
    paddingHorizontal: 6,
    paddingVertical: 2,
  },
  photoTime: { fontFamily: font.regular, fontSize: 11, color: colors.text },
  meta: { fontFamily: font.regular, fontSize: 11, color: colors.t3 },
  photo: { width: 200, height: 260, borderRadius: 20, borderWidth: 1, borderColor: colors.edge, backgroundColor: colors.surface },
  thumb: { width: 112, height: 140, borderRadius: 18, borderWidth: 1, borderColor: colors.edge, backgroundColor: colors.surface },
  typing: { flexDirection: 'row', gap: 4, alignSelf: 'flex-start', paddingVertical: 14, marginTop: 8, borderBottomLeftRadius: 6 },
  typingDot: { width: 6, height: 6, borderRadius: 3, backgroundColor: 'rgba(255,255,255,0.75)' },
  bar: { flexDirection: 'row', alignItems: 'center', gap: 8, paddingHorizontal: 12, paddingVertical: 10 },
  inputWrap: { flex: 1, flexDirection: 'row', alignItems: 'center', paddingLeft: 16, paddingRight: 14, minHeight: 46 },
  input: { flex: 1, fontFamily: font.regular, fontSize: 14.5, color: colors.text, paddingVertical: 10 },
  send: { width: 46, height: 46, borderRadius: 23, backgroundColor: colors.text, alignItems: 'center', justifyContent: 'center' },
  locked: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 8, margin: 12, paddingVertical: 14 },
});
