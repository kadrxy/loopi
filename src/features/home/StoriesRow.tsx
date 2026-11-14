import { Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';

import type { Graph, StoryGroup, User } from '@/domain/types';
import { useT } from '@/i18n';
import { Avatar, colors, font, Icon, StoryRing } from '@/ui';

type Props = {
  me?: User;
  groups: StoryGroup[];
  graph: Graph;
  onAdd: () => void;
  /** origin = where the finger touched, so the story can open as a circle from there. */
  onOpen: (group: StoryGroup, origin: { x: number; y: number }) => void;
};

/** "You" first (dashed ring + plus), then one ring per friend; the ring shows their latest moment. */
export function StoriesRow({ me, groups, graph, onAdd, onOpen }: Props) {
  const t = useT();
  return (
    <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.row}>
      <Pressable style={styles.item} onPress={onAdd} accessibilityRole="button" accessibilityLabel={t('tab_create')}>
        <View>
          <StoryRing segments={1} unseen={false} dashed size={58}>
            <Avatar user={me} size={48} />
          </StoryRing>
          <View style={styles.add}>
            <Icon name="plus" size={12} color={colors.onWhite} />
          </View>
        </View>
        <Text style={styles.name} numberOfLines={1}>
          {t('stories_you')}
        </Text>
      </Pressable>
      {groups.map((g) => (
        <Pressable key={g.userId} style={styles.item} onPress={(e) => onOpen(g, { x: e.nativeEvent.pageX, y: e.nativeEvent.pageY })} accessibilityRole="button" accessibilityLabel={graph.users[g.userId]?.name}>
          <StoryRing image={g.moments[0]?.image} segments={g.moments.length} unseen={g.unseen} size={58} />
          <Text style={styles.name} numberOfLines={1}>
            {graph.users[g.userId]?.name.split(' ')[0]}
          </Text>
        </Pressable>
      ))}
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  row: { paddingHorizontal: 14, paddingVertical: 12, gap: 12 },
  item: { width: 60, alignItems: 'center', gap: 6 },
  name: { fontFamily: font.medium, fontSize: 11, color: colors.t2 },
  add: {
    position: 'absolute',
    right: -1,
    bottom: -1,
    width: 20,
    height: 20,
    borderRadius: 10,
    backgroundColor: colors.text,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 2.5,
    borderColor: colors.bg,
  },
});
