import { Pressable, StyleSheet, Text, View } from 'react-native';

import { Glass } from './Glass';
import { Icon, type IconName } from './Icon';
import { colors, font, radius } from './theme';

type Props = {
  label: string;
  icon?: IconName;
  iconFilled?: boolean;
  selected?: boolean;
  disabled?: boolean;
  dark?: boolean;
  onPress?: () => void;
  size?: 'sm' | 'md';
};

/** Small glass pill; white when selected. Not pressable when onPress is absent. */
export function Chip({ label, icon, iconFilled, selected, disabled, dark, onPress, size = 'sm' }: Props) {
  const fg = selected ? colors.onWhite : colors.text;
  const pad = size === 'md' ? styles.md : styles.sm;
  const body = (
    <View style={[styles.row, pad]}>
      {icon && <Icon name={icon} size={size === 'md' ? 15 : 13} color={fg} filled={iconFilled || selected} />}
      <Text style={[styles.label, { color: fg, fontSize: size === 'md' ? 13 : 11 }]} numberOfLines={1}>
        {label}
      </Text>
    </View>
  );
  const surface = selected ? <View style={styles.selected}>{body}</View> : <Glass radius={radius.pill} dark={dark}>{body}</Glass>;
  if (!onPress) return surface;
  return (
    <Pressable
      accessibilityRole="button"
      accessibilityLabel={label}
      accessibilityState={{ selected, disabled }}
      disabled={disabled}
      onPress={onPress}
      hitSlop={6}
      style={{ opacity: disabled ? 0.4 : 1 }}>
      {surface}
    </Pressable>
  );
}

const styles = StyleSheet.create({
  row: { flexDirection: 'row', alignItems: 'center', gap: 5 },
  sm: { paddingVertical: 5, paddingLeft: 8, paddingRight: 10 },
  md: { paddingVertical: 9, paddingLeft: 12, paddingRight: 14, minHeight: 40 },
  selected: { backgroundColor: colors.text, borderRadius: radius.pill, borderWidth: 1, borderColor: colors.text },
  label: { fontFamily: font.semibold },
});
