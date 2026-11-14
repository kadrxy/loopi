import { useRouter } from 'expo-router';
import { FlatList, StyleSheet, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { appStore, useApp } from '@/data';
import { useT } from '@/i18n';
import { Avatar, Button, colors, EmptyState, font, IconButton, type as T } from '@/ui';

/** People I blocked, each with an unblock button. */
export default function Blocked() {
  const t = useT();
  const router = useRouter();
  const meId = useApp((s) => s.meId);
  const graph = useApp((s) => s.graph);
  const ids = (graph.blocks ?? []).filter((b) => b.from === meId).map((b) => b.to);
  const close = () => (router.canGoBack() ? router.back() : router.replace('/settings'));

  return (
    <SafeAreaView edges={['top']} style={styles.screen}>
      <View style={styles.bar}>
        <Text style={[T.title, { flex: 1 }]}>{t('blocked_list')}</Text>
        <IconButton name="close" size="sm" label={t('close')} onPress={close} />
      </View>
      <FlatList
        data={ids}
        keyExtractor={(id) => id}
        contentContainerStyle={{ paddingBottom: 40, flexGrow: 1 }}
        ListEmptyComponent={<EmptyState icon="lock" title={t('blocked_empty')} />}
        renderItem={({ item: id }) => {
          const u = graph.users[id];
          return (
            <View style={styles.row}>
              <Avatar user={u} size={46} />
              <View style={{ flex: 1 }}>
                <Text style={styles.name} numberOfLines={1}>
                  {u?.name}
                </Text>
                <Text style={styles.handle} numberOfLines={1}>
                  @{u?.username}
                </Text>
              </View>
              <View style={{ width: 140 }}>
                <Button title={t('unblock')} kind="glass" size="md" onPress={() => appStore.getState().toggleBlock(id)} />
              </View>
            </View>
          );
        }}
      />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1, backgroundColor: colors.bg },
  bar: { flexDirection: 'row', alignItems: 'center', gap: 12, paddingHorizontal: 20, paddingTop: 8, paddingBottom: 10 },
  row: { flexDirection: 'row', alignItems: 'center', gap: 12, paddingHorizontal: 18, paddingVertical: 9, minHeight: 64 },
  name: { fontFamily: font.semibold, fontSize: 15, color: colors.text },
  handle: { fontFamily: font.regular, fontSize: 12.5, color: colors.t3 },
});
