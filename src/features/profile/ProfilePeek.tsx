import { Image } from 'expo-image';
import { useRouter } from 'expo-router';
import { Pressable, StyleSheet, Text, View } from 'react-native';

import { appStore, useApp } from '@/data';
import { canView, isFollowing, isFriend } from '@/domain/rules';
import { useT, type TKey } from '@/i18n';
import { Avatar, BottomSheet, Button, colors, font, Icon, Scrim } from '@/ui';

import { FollowButton } from './ProfileView';

type Props = { userId?: string; onClose: () => void };

/** A quick look at someone from a chat: who they are, a few numbers, latest moments; full profile on demand. */
export function ProfilePeek({ userId, onClose }: Props) {
  const t = useT();
  const router = useRouter();
  const meId = useApp((s) => s.meId);
  const graph = useApp((s) => s.graph);
  const moments = useApp((s) => s.moments);
  const user = userId ? graph.users[userId] : undefined;

  const others = Object.keys(graph.users).filter((id) => id !== userId);
  const stats: [TKey, number][] = user
    ? [
        ['followers', others.filter((id) => isFollowing(graph, id, user.id)).length],
        ['following', others.filter((id) => isFollowing(graph, user.id, id)).length],
        ['friends', others.filter((id) => isFriend(graph, user.id, id)).length],
      ]
    : [];
  const latest = user
    ? moments
        .filter((m) => m.authorId === user.id && canView(graph, meId, m))
        .sort((a, b) => b.createdAt - a.createdAt)
        .slice(0, 3)
    : [];
  const open = (go: () => void) => {
    onClose();
    setTimeout(go, 180);
  };

  return (
    <BottomSheet visible={!!user} onClose={onClose}>
      {user && (
        <View style={styles.body}>
          <View style={styles.cover}>
            {user.cover != null && <Image source={user.cover} style={StyleSheet.absoluteFill} contentFit="cover" />}
            <Scrim from={0.1} to={0.85} />
          </View>
          <View style={styles.pic}>
            <Avatar user={user} size={76} />
          </View>
          <Text style={styles.name} numberOfLines={1}>
            {user.name}
          </Text>
          <View style={styles.handleRow}>
            <Text style={styles.handle}>@{user.username}</Text>
            <Icon name={user.isPrivate ? 'lock' : 'globe'} size={12} color={colors.t3} />
          </View>
          {!!user.bio && (
            <Text style={styles.bio} numberOfLines={2}>
              {user.bio}
            </Text>
          )}

          <View style={styles.stats}>
            {stats.map(([k, n]) => (
              <View key={k} style={styles.stat}>
                <Text style={styles.statN}>{n}</Text>
                <Text style={styles.statLabel}>{t(k)}</Text>
              </View>
            ))}
          </View>

          {latest.length > 0 && (
            <View style={styles.grid}>
              {latest.map((m) => (
                <Pressable
                  key={m.id}
                  onPress={() => open(() => router.push({ pathname: '/post/[id]', params: { id: m.id } }))}
                  style={styles.cell}
                  accessibilityRole="imagebutton"
                  accessibilityLabel={m.caption || t('peek_moments')}>
                  <Image source={m.image} style={StyleSheet.absoluteFill} contentFit="cover" cachePolicy="memory-disk" />
                </Pressable>
              ))}
            </View>
          )}

          <View style={styles.actions}>
            <Button
              title={t('view_profile')}
              kind="glass"
              size="md"
              onPress={() => open(() => router.push({ pathname: '/user/[id]', params: { id: user.id } }))}
              style={{ flex: 1 }}
            />
            {user.id !== meId && (
              <View style={{ flex: 1 }}>
                <FollowButton userId={user.id} onPress={() => appStore.getState().toggleFollow(user.id)} />
              </View>
            )}
          </View>
        </View>
      )}
    </BottomSheet>
  );
}

const styles = StyleSheet.create({
  body: { alignItems: 'center', paddingHorizontal: 16, paddingBottom: 6 },
  cover: { alignSelf: 'stretch', height: 96, borderRadius: 22, overflow: 'hidden', backgroundColor: colors.surface },
  pic: { marginTop: -42, padding: 3, borderRadius: 44, backgroundColor: '#0E0E0E', borderWidth: 2, borderColor: colors.text },
  name: { marginTop: 8, fontFamily: font.display, fontSize: 22, color: colors.text },
  handleRow: { flexDirection: 'row', alignItems: 'center', gap: 5, marginTop: 2 },
  handle: { fontFamily: font.regular, fontSize: 12.5, color: colors.t3 },
  bio: { marginTop: 8, fontFamily: font.regular, fontSize: 13, lineHeight: 18, color: colors.t2, textAlign: 'center' },
  stats: {
    flexDirection: 'row',
    alignSelf: 'stretch',
    marginTop: 14,
    paddingVertical: 10,
    borderTopWidth: 1,
    borderBottomWidth: 1,
    borderColor: colors.line,
  },
  stat: { flex: 1, alignItems: 'center' },
  statN: { fontFamily: font.bold, fontSize: 16, color: colors.text },
  statLabel: { fontFamily: font.regular, fontSize: 11, color: colors.t3 },
  grid: { flexDirection: 'row', alignSelf: 'stretch', gap: 6, marginTop: 14 },
  cell: { flex: 1, aspectRatio: 0.78, borderRadius: 14, overflow: 'hidden', backgroundColor: colors.surface },
  actions: { flexDirection: 'row', alignSelf: 'stretch', gap: 8, marginTop: 16 },
});
