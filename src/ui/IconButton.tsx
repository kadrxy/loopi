import { Pressable, StyleSheet, Text, View } from 'react-native';

import { Glass } from './Glass';
import { Icon, type IconName } from './Icon';
import { colors, font } from './theme';

type Props = {
  name: IconName;
  label: string;
  onPress?: () => void;
  onLongPress?: () => void;
  size?: 'md' | 'sm';
  filled?: boolean;
  /** Darker glass for use over photos. */
  dark?: boolean;
  badge?: number;
  /** Optional caption under the button (e.g. a count on a photo rail). */
  caption?: string;
};

/** Round glass button with a Phosphor icon; 44pt hit area even at the small size. */
export function IconButton({ name, label, onPress, onLongPress, size = 'md', filled, dark, badge, caption }: Props) {
  const d = size === 'md' ? 40 : 34;
  return (
    <Pressable
      accessibilityRole="button"
      accessibilityLabel={label}
      onPress={onPress}
      onLongPress={onLongPress}
      delayLongPress={260}
      hitSlop={(44 - d) / 2 + 2}
      style={({ pressed }) => [styles.wrap, { transform: [{ scale: pressed ? 0.94 : 1 }] }]}>
      <View>
        <Glass radius={d / 2} dark={dark} style={{ width: d, height: d, alignItems: 'center', justifyContent: 'center' }}>
          <Icon name={name} size={size === 'md' ? 20 : 17} filled={filled} />
        </Glass>
        {!!badge && (
          <View style={styles.badge}>
            <Text style={styles.badgeText}>{badge > 9 ? '9+' : badge}</Text>
          </View>
        )}
      </View>
      {caption != null && <Text style={styles.caption}>{caption}</Text>}
    </Pressable>
  );
}

const styles = StyleSheet.create({
  wrap: { alignItems: 'center', gap: 2 },
  badge: {
    position: 'absolute',
    top: -4,
    right: -4,
    minWidth: 18,
    height: 18,
    paddingHorizontal: 4,
    borderRadius: 9,
    backgroundColor: colors.text,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 2,
    borderColor: colors.bg,
  },
  badgeText: { fontFamily: font.heavy, fontSize: 10, color: colors.onWhite },
  caption: { fontFamily: font.semibold, fontSize: 10.5, color: colors.text },
});
