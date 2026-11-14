import { Pressable, StyleSheet, View } from 'react-native';

import type { Reaction } from '@/domain/types';
import { useT, type TKey } from '@/i18n';
import { Burst, colors, Glass, Icon, radius, shadow, useBursts } from '@/ui';

export const REACTIONS: { kind: Reaction; label: TKey }[] = [
  { kind: 'heart', label: 'r_heart' },
  { kind: 'fire', label: 'r_fire' },
  { kind: 'laugh', label: 'r_laugh' },
  { kind: 'wow', label: 'r_wow' },
  { kind: 'sad', label: 'r_sad' },
  { kind: 'bravo', label: 'r_bravo' },
];

/** Six quick reactions as bold icons; the chosen one sits in a white circle and sprays a little fountain. */
export function ReactionBar({ selected, onPick }: { selected?: Reaction; onPick: (reaction: Reaction) => void }) {
  const t = useT();
  const [particles, fire] = useBursts();
  return (
    <View>
      <Burst particles={particles} />
      <Glass dark radius={radius.pill} style={styles.bar}>
        {REACTIONS.map(({ kind, label }, i) => {
          const on = selected === kind;
          return (
            <Pressable
              key={kind}
              accessibilityRole="button"
              accessibilityLabel={t(label)}
              accessibilityState={{ selected: on }}
              onPress={() => {
                if (!on) fire(kind, `${((i + 0.5) / REACTIONS.length) * 100}%`);
                onPick(kind);
              }}
              style={({ pressed }) => [styles.item, on && styles.on, { transform: [{ scale: pressed ? 0.88 : 1 }] }]}>
              <Icon name={kind} size={24} filled color={on ? colors.onWhite : colors.text} />
            </Pressable>
          );
        })}
      </Glass>
    </View>
  );
}

const styles = StyleSheet.create({
  bar: { flexDirection: 'row', justifyContent: 'space-between', padding: 5 },
  item: { width: 42, height: 42, borderRadius: 21, alignItems: 'center', justifyContent: 'center' },
  on: { backgroundColor: colors.text, ...shadow.glow },
});
