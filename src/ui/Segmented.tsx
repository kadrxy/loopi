import { useEffect, useState } from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import Animated, { useAnimatedStyle, useSharedValue, withSpring, type SharedValue } from 'react-native-reanimated';

import { Glass } from './Glass';
import { colors, font, radius, shadow } from './theme';

type Option<K extends string> = { key: K; label: string };
type Props<K extends string> = {
  options: Option<K>[];
  value: K;
  onChange: (key: K) => void;
  /** Optional 0..n-1 position driven by a pager, so the pill follows the finger. */
  progress?: Readonly<SharedValue<number>>;
};

export const SPRING = { damping: 20, stiffness: 240, mass: 0.9 };

/** Glass capsule with a sliding white pill (reference: dating app "For you / Nearby"). */
export function Segmented<K extends string>({ options, value, onChange, progress }: Props<K>) {
  const [width, setWidth] = useState(0);
  const index = Math.max(
    0,
    options.findIndex((o) => o.key === value),
  );
  const internal = useSharedValue(index);
  useEffect(() => {
    internal.set(withSpring(index, SPRING));
  }, [index, internal]);
  const segW = width / options.length;
  // Computed inline in each style: a nested worklet helper is rewritten by the React Compiler and then
  // cannot run on the UI thread, which froze the pill on phones (web runs everything on one thread).
  const pill = useAnimatedStyle(() => ({ transform: [{ translateX: (progress ? progress.value : internal.value) * segW }] }));
  // The dark labels live inside the pill and slide the opposite way, so whatever part of the pill sits
  // over a label shows that label dark: text never disappears mid-swipe.
  const inner = useAnimatedStyle(() => ({ transform: [{ translateX: -(progress ? progress.value : internal.value) * segW }] }));

  return (
    <Glass radius={radius.pill} style={styles.wrap}>
      <View style={styles.row} accessibilityRole="tablist" onLayout={(e) => setWidth(e.nativeEvent.layout.width)}>
        {options.map((o) => {
          const selected = o.key === value;
          return (
            <Pressable
              key={o.key}
              accessibilityRole="tab"
              accessibilityLabel={o.label}
              accessibilityState={{ selected }}
              onPress={() => onChange(o.key)}
              style={styles.tab}>
              <Text style={styles.label} numberOfLines={1}>
                {o.label}
              </Text>
            </Pressable>
          );
        })}
        {width > 0 && (
          <Animated.View pointerEvents="none" style={[styles.pill, { width: segW }, pill]}>
            <View style={styles.clip} accessibilityElementsHidden importantForAccessibility="no-hide-descendants">
              <Animated.View style={[styles.row, { width }, inner]}>
                {options.map((o) => (
                  <View key={o.key} style={styles.tab}>
                    <Text style={[styles.label, styles.labelSelected]} numberOfLines={1}>
                      {o.label}
                    </Text>
                  </View>
                ))}
              </Animated.View>
            </View>
          </Animated.View>
        )}
      </View>
    </Glass>
  );
}

const styles = StyleSheet.create({
  wrap: { padding: 4 },
  row: { flexDirection: 'row' },
  pill: { position: 'absolute', top: 0, bottom: 0, left: 0, borderRadius: radius.pill, backgroundColor: colors.text, ...shadow.glow },
  clip: { flex: 1, borderRadius: radius.pill, overflow: 'hidden' },
  tab: { flex: 1, height: 38, borderRadius: radius.pill, alignItems: 'center', justifyContent: 'center' },
  label: { fontFamily: font.semibold, fontSize: 14, color: colors.t3 },
  labelSelected: { color: colors.onWhite },
});
