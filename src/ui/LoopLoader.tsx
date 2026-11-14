import { useEffect } from 'react';
import { StyleSheet, Text, View } from 'react-native';
import Animated, { Easing, useAnimatedStyle, useSharedValue, withRepeat, withSequence, withTiming } from 'react-native-reanimated';
import Svg, { Circle } from 'react-native-svg';

import { colors, font } from './theme';

/** Brand loading mark: a breathing white "L" tile inside a spinning dashed ring. */
export function LoopLoader({ size = 84 }: { size?: number }) {
  const spin = useSharedValue(0);
  const pulse = useSharedValue(1);
  useEffect(() => {
    spin.value = withRepeat(withTiming(1, { duration: 1600, easing: Easing.linear }), -1);
    pulse.value = withRepeat(withSequence(withTiming(0.9, { duration: 650 }), withTiming(1, { duration: 650 })), -1);
  }, [spin, pulse]);
  const ringStyle = useAnimatedStyle(() => ({ transform: [{ rotate: `${spin.value * 360}deg` }] }));
  const tileStyle = useAnimatedStyle(() => ({ transform: [{ scale: pulse.value }] }));
  const tile = size * 0.56;
  return (
    <View style={{ width: size, height: size, alignItems: 'center', justifyContent: 'center' }} accessibilityRole="progressbar">
      <Animated.View style={[StyleSheet.absoluteFill, ringStyle]}>
        <Svg width={size} height={size}>
          <Circle cx={size / 2} cy={size / 2} r={size / 2 - 2} stroke={colors.text} strokeOpacity={0.35} strokeWidth={2} strokeDasharray="10 8" fill="none" />
        </Svg>
      </Animated.View>
      <Animated.View style={[styles.tile, { width: tile, height: tile, borderRadius: tile * 0.3 }, tileStyle]}>
        <Text style={[styles.letter, { fontSize: tile * 0.68, lineHeight: tile * 0.9 }]}>L</Text>
      </Animated.View>
    </View>
  );
}

export function FullScreenLoader() {
  return (
    <View style={styles.full}>
      <LoopLoader />
    </View>
  );
}

const styles = StyleSheet.create({
  tile: { backgroundColor: colors.text, alignItems: 'center', justifyContent: 'center' },
  letter: { fontFamily: font.display, color: colors.onWhite },
  full: { flex: 1, backgroundColor: colors.bg, alignItems: 'center', justifyContent: 'center' },
});
