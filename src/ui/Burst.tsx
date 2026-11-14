import * as Haptics from 'expo-haptics';
import { useCallback, useEffect, useState } from 'react';
import { StyleSheet, View, type DimensionValue } from 'react-native';
import Animated, { Easing, useAnimatedStyle, useSharedValue, withDelay, withTiming } from 'react-native-reanimated';

import { Icon, type IconName } from './Icon';
import { shouldReduceMotion } from './motion';
import { colors } from './theme';

type Particle = { id: number; icon: IconName; x: DimensionValue; dx: number; dy: number; rot: number; delay: number; size: number };
let seq = 1;

/** Icon fountain: call fire('fire', '50%') and a handful of bold icons spray up and fade. */
export function useBursts() {
  const [particles, setParticles] = useState<Particle[]>([]);
  const fire = useCallback((icon: IconName, x: DimensionValue = '50%') => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light).catch(() => {});
    if (shouldReduceMotion()) return; // the haptic tap is the feedback; no flying particles
    const batch: Particle[] = Array.from({ length: 9 }, (_, i) => ({
      id: seq++,
      icon,
      x,
      dx: (Math.random() - 0.5) * 140,
      dy: -(120 + Math.random() * 160),
      rot: (Math.random() - 0.5) * 70,
      delay: i * 28,
      size: 18 + Math.random() * 16,
    }));
    setParticles((p) => [...p, ...batch]);
    const ids = new Set(batch.map((b) => b.id));
    setTimeout(() => setParticles((p) => p.filter((q) => !ids.has(q.id))), 1300);
  }, []);
  return [particles, fire] as const;
}

/** Render inside a relatively positioned parent; particles start at its bottom edge. */
export function Burst({ particles }: { particles: Particle[] }) {
  return (
    <View pointerEvents="none" style={styles.layer}>
      {particles.map((p) => (
        <Piece key={p.id} p={p} />
      ))}
    </View>
  );
}

function Piece({ p }: { p: Particle }) {
  const t = useSharedValue(0);
  useEffect(() => {
    t.value = withDelay(p.delay, withTiming(1, { duration: 950, easing: Easing.out(Easing.cubic) }));
  }, [t, p.delay]);
  const style = useAnimatedStyle(() => ({
    opacity: t.value < 0.7 ? 1 : 1 - (t.value - 0.7) / 0.3,
    transform: [
      { translateX: p.dx * t.value },
      { translateY: p.dy * t.value },
      { scale: 0.4 + t.value * 0.9 },
      { rotate: `${p.rot * t.value}deg` },
    ],
  }));
  return (
    <Animated.View style={[styles.piece, { left: p.x }, style]}>
      <Icon name={p.icon} size={p.size} filled color={colors.text} />
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  layer: { ...StyleSheet.absoluteFill, overflow: 'visible', zIndex: 20 },
  piece: { position: 'absolute', bottom: 10, marginLeft: -14 },
});
