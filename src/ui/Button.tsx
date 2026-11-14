import { Pressable, StyleSheet, Text, View, type StyleProp, type ViewStyle } from 'react-native';

import { Glass } from './Glass';
import { Icon, type IconName } from './Icon';
import { colors, font, radius, shadow } from './theme';

type Props = {
  title: string;
  onPress: () => void;
  kind?: 'primary' | 'glass';
  icon?: IconName;
  /** Round black disc with an icon on the right (onboarding CTA). */
  trailing?: IconName;
  disabled?: boolean;
  size?: 'lg' | 'md';
  style?: StyleProp<ViewStyle>;
};

export function Button({ title, onPress, kind = 'primary', icon, trailing, disabled, size = 'lg', style }: Props) {
  const h = size === 'lg' ? 54 : 42;
  const fg = kind === 'primary' ? colors.onWhite : colors.text;
  const content = (
    <View style={[styles.row, { height: h }, trailing && styles.withTrailing]}>
      {icon && <Icon name={icon} size={size === 'lg' ? 18 : 16} color={fg} />}
      <Text style={[styles.label, { color: fg, fontSize: size === 'lg' ? 15.5 : 13.5 }]} numberOfLines={1}>
        {title}
      </Text>
      {trailing && (
        <View style={[styles.disc, { width: h - 12, height: h - 12, borderRadius: (h - 12) / 2 }]}>
          <Icon name={trailing} size={18} color={colors.text} />
        </View>
      )}
    </View>
  );
  return (
    <Pressable
      accessibilityRole="button"
      accessibilityLabel={title}
      accessibilityState={{ disabled }}
      disabled={disabled}
      onPress={onPress}
      style={({ pressed }) => [{ opacity: disabled ? 0.4 : 1, transform: [{ scale: pressed ? 0.97 : 1 }] }, style]}>
      {kind === 'primary' ? (
        <View style={[styles.primary, shadow.glow]}>{content}</View>
      ) : (
        <Glass radius={radius.pill}>{content}</Glass>
      )}
    </Pressable>
  );
}

const styles = StyleSheet.create({
  primary: { backgroundColor: colors.text, borderRadius: radius.pill },
  row: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 8, paddingHorizontal: 20 },
  withTrailing: { justifyContent: 'space-between', paddingLeft: 24, paddingRight: 6 },
  label: { fontFamily: font.bold },
  disc: { backgroundColor: colors.onWhite, alignItems: 'center', justifyContent: 'center' },
});
