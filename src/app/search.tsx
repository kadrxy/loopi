import { Image } from 'expo-image';
import { useRouter } from 'expo-router';
import { useMemo, useState } from 'react';
import { Pressable, ScrollView, StyleSheet, Text, TextInput, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { appStore, useApp } from '@/data';
import { discoverFor, fold, isFollowing, mapPlaces, searchUsers } from '@/domain/rules';
import { FollowButton } from '@/features/profile/ProfileView';
import { useT } from '@/i18n';
import { Avatar, colors, EmptyState, font, Glass, Icon, IconButton, radius } from '@/ui';

/** People and places, accent-insensitive; suggestions when the box is empty. */
export default function Search() {
  const t = useT();
  const router = useRouter();
  const meId = useApp((s) => s.meId);
  const graph = useApp((s) => s.graph);
  const moments = useApp((s) => s.moments);
  const [q, setQ] = useState('');

  const people = useMemo(() => searchUsers(graph, meId, q), [graph, meId, q]);
  const places = useMemo(() => {
    const f = fold(q.trim());
    return f ? mapPlaces(graph, meId, moments).filter((p) => fold(p.name).includes(f)) : [];
  }, [graph, meId, moments, q]);
  const suggested = useMemo(() => {
    const ids = [...new Set(discoverFor(graph, meId, moments).map((m) => m.authorId))];
    return ids.filter((id) => !isFollowing(graph, meId, id)).slice(0, 6);
  }, [graph, meId, moments]);

  const close = () => (router.canGoBack() ? router.back() : router.replace('/home'));
  const person = (id: string) => {
    const u = graph.users[id];
    return (
      <View key={id} style={styles.row}>
        <Pressable
          onPress={() => router.push({ pathname: '/user/[id]', params: { id } })}
          style={({ pressed }) => [styles.who, pressed && { opacity: 0.7 }]}
          accessibilityRole="button"
          accessibilityLabel={u?.name}>
          <Avatar user={u} size={46} />
          <View style={{ flex: 1 }}>
            <Text style={styles.name} numberOfLines={1}>
              {u?.name}
            </Text>
            <View style={styles.handleRow}>
              <Text style={styles.handle} numberOfLines={1}>
                @{u?.username}
              </Text>
              {u?.isPrivate && <Icon name="lock" size={12} color={colors.t3} />}
            </View>
          </View>
        </Pressable>
        <View style={{ width: 156 }}>
          <FollowButton userId={id} onPress={() => appStore.getState().toggleFollow(id)} />
        </View>
      </View>
    );
  };

  return (
    <SafeAreaView edges={['top']} style={styles.screen}>
      <View style={styles.bar}>
        <Glass radius={radius.pill} style={styles.field}>
          <Icon name="search" size={18} color={colors.t2} />
          <TextInput
            value={q}
            onChangeText={setQ}
            autoFocus
            placeholder={t('search_ph')}
            placeholderTextColor={colors.t3}
            autoCapitalize="none"
            autoCorrect={false}
            returnKeyType="search"
            style={styles.input}
            accessibilityLabel={t('search_ph')}
          />
          {!!q && <IconButton name="close" size="sm" label={t('close')} onPress={() => setQ('')} />}
        </Glass>
        <Pressable onPress={close} hitSlop={8} accessibilityRole="button">
          <Text style={styles.cancel}>{t('cancel')}</Text>
        </Pressable>
      </View>

      <ScrollView showsVerticalScrollIndicator={false} keyboardShouldPersistTaps="handled" contentContainerStyle={{ paddingBottom: 40 }}>
        {!q.trim() ? (
          <>
            <Text style={styles.section}>{t('search_suggested')}</Text>
            {suggested.map(person)}
          </>
        ) : people.length + places.length === 0 ? (
          <EmptyState icon="search" title={t('search_none')} />
        ) : (
          <>
            {people.length > 0 && <Text style={styles.section}>{t('search_people')}</Text>}
            {people.map(person)}
            {places.length > 0 && <Text style={styles.section}>{t('search_places')}</Text>}
            {places.map((p) => (
              <Pressable
                key={p.name}
                onPress={() => router.push({ pathname: '/post/[id]', params: { id: p.moments[0].id } })}
                style={({ pressed }) => [styles.row, pressed && styles.pressed]}
                accessibilityRole="button"
                accessibilityLabel={p.name}>
                <Image source={p.moments[0].image} style={styles.placeImg} contentFit="cover" />
                <View style={{ flex: 1 }}>
                  <View style={styles.handleRow}>
                    <Icon name="pin" size={14} filled />
                    <Text style={styles.name} numberOfLines={1}>
                      {p.name}
                    </Text>
                  </View>
                  <Text style={styles.handle}>{t('moment_count', { n: p.moments.length })}</Text>
                </View>
                <Icon name="caretRight" size={18} color={colors.t3} />
              </Pressable>
            ))}
          </>
        )}
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1, backgroundColor: colors.bg },
  bar: { flexDirection: 'row', alignItems: 'center', gap: 12, paddingHorizontal: 14, paddingTop: 8, paddingBottom: 8 },
  field: { flex: 1, flexDirection: 'row', alignItems: 'center', gap: 8, paddingLeft: 14, paddingRight: 5, minHeight: 46 },
  input: { flex: 1, fontFamily: font.regular, fontSize: 15, color: colors.text, paddingVertical: 10 },
  cancel: { fontFamily: font.semibold, fontSize: 14, color: colors.text },
  section: { fontFamily: font.semibold, fontSize: 12.5, color: colors.t3, paddingHorizontal: 20, paddingTop: 18, paddingBottom: 6 },
  who: { flex: 1, flexDirection: 'row', alignItems: 'center', gap: 12 },
  row: { flexDirection: 'row', alignItems: 'center', gap: 12, paddingHorizontal: 18, paddingVertical: 9, minHeight: 64 },
  pressed: { backgroundColor: 'rgba(255,255,255,0.04)' },
  name: { flexShrink: 1, fontFamily: font.semibold, fontSize: 15, color: colors.text },
  handleRow: { flexDirection: 'row', alignItems: 'center', gap: 5 },
  handle: { flexShrink: 1, fontFamily: font.regular, fontSize: 12.5, color: colors.t3 },
  placeImg: { width: 46, height: 46, borderRadius: 12, backgroundColor: colors.surface },
});
