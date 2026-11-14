import { useId } from 'react';
import { StyleSheet, View, type StyleProp, type ViewStyle } from 'react-native';
import Svg, { Defs, Ellipse, LinearGradient, RadialGradient, Rect, Stop } from 'react-native-svg';

/** Vertical fade to black, used over photos so glass text stays readable. */
export function Scrim({ from = 0, to = 0.85, style }: { from?: number; to?: number; style?: StyleProp<ViewStyle> }) {
  const id = useId().replace(/:/g, '');
  // The wrapper owns the size; the svg fills it (an svg alone falls back to 150px tall on web).
  return (
    <View pointerEvents="none" style={[StyleSheet.absoluteFill, style]}>
      <Svg width="100%" height="100%" preserveAspectRatio="none" viewBox="0 0 1 1">
        <Defs>
          <LinearGradient id={id} x1="0" y1="0" x2="0" y2="1">
            <Stop offset="0" stopColor="#000" stopOpacity={from} />
            <Stop offset="1" stopColor="#000" stopOpacity={to} />
          </LinearGradient>
        </Defs>
        <Rect x="0" y="0" width="1" height="1" fill={`url(#${id})`} />
      </Svg>
    </View>
  );
}

/** Soft white ambient glow (the "halo" from the approved mock). */
export function Halo({ width = 360, height = 260, opacity = 0.13, style }: { width?: number; height?: number; opacity?: number; style?: StyleProp<ViewStyle> }) {
  const id = useId().replace(/:/g, '');
  return (
    <View pointerEvents="none" style={[{ width, height }, style]}>
      <Svg width={width} height={height}>
        <Defs>
          <RadialGradient id={id} cx="50%" cy="50%" rx="50%" ry="50%">
            <Stop offset="0" stopColor="#FFF" stopOpacity={opacity} />
            <Stop offset="1" stopColor="#FFF" stopOpacity={0} />
          </RadialGradient>
        </Defs>
        <Ellipse cx={width / 2} cy={height / 2} rx={width / 2} ry={height / 2} fill={`url(#${id})`} />
      </Svg>
    </View>
  );
}
