import { BlurView } from 'expo-blur';
import type { ReactNode } from 'react';
import { StyleSheet, View, type StyleProp, type ViewStyle } from 'react-native';

import { colors, radius as R } from './theme';

type Props = {
  children?: ReactNode;
  style?: StyleProp<ViewStyle>;
  radius?: number;
  /** Darker glass for use over photos. */
  dark?: boolean;
  intensity?: number;
};

/** Frosted glass surface: blur + translucent fill + hairline edge + top highlight. */
export function Glass({ children, style, radius = R.lg, dark, intensity = 30 }: Props) {
  return (
    <View style={[styles.base, { borderRadius: radius }, style]}>
      {/* Each layer repeats the radius: some renderers don't clip backdrop blur to the parent's corners. */}
      <BlurView pointerEvents="none" intensity={intensity} tint="dark" style={[StyleSheet.absoluteFill, styles.layer, { borderRadius: radius }]} />
      <View
        pointerEvents="none"
        style={[StyleSheet.absoluteFill, styles.layer, { borderRadius: radius, backgroundColor: dark ? colors.glassDark : colors.glassLight }]}
      />
      <View pointerEvents="none" style={[styles.highlight, { left: radius / 2, right: radius / 2 }]} />
      {children}
    </View>
  );
}

const styles = StyleSheet.create({
  // zIndex 0 makes this a stacking context; the decorative layers sit at -1 so content
  // (text inputs, svgs) always paints above them on every platform, including web.
  base: { overflow: 'hidden', borderWidth: 1, borderColor: colors.edge, zIndex: 0 },
  layer: { zIndex: -1 },
  highlight: { position: 'absolute', top: 0, height: 1, backgroundColor: colors.highlight, zIndex: -1 },
});
