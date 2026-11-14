import { useEffect } from 'react';
import { StyleSheet, type ViewStyle } from 'react-native';
import Animated, {
  Extrapolation,
  interpolate,
  runOnJS,
  useAnimatedScrollHandler,
  useAnimatedStyle,
  useSharedValue,
  withTiming,
  type AnimatedStyle,
} from 'react-native-reanimated';

import { LoopLoader } from './LoopLoader';

export const PULL_TRIGGER = 72;
const HOLD = 64;

/**
 * Pull to refresh with the brand loader (iOS, where scroll views bounce). The loader fades in as the
 * list is pulled; releasing past the trigger refreshes, and while refreshing a spacer holds the
 * content down so the loader never sits on top of it. `rest` is the resting scroll offset (e.g. a
 * negative contentInset). Android/web keep the system RefreshControl instead.
 */
export function usePullRefresh(refreshing: boolean, onRefresh: () => void, rest = 0, pullEnabled = true) {
  const pull = useSharedValue(0);
  /** How far the list is scrolled down from its resting top (0 at the top). */
  const scrollY = useSharedValue(0);
  const busy = useSharedValue(refreshing ? 1 : 0);
  const hold = useSharedValue(0);
  useEffect(() => {
    busy.set(refreshing ? 1 : 0);
    hold.set(withTiming(refreshing ? HOLD : 0, { duration: refreshing ? 180 : 260 }));
  }, [refreshing, busy, hold]);

  const onScroll = useAnimatedScrollHandler({
    onScroll: (e) => {
      pull.value = Math.max(0, -(e.contentOffset.y - rest));
      scrollY.value = Math.max(0, e.contentOffset.y - rest);
    },
    onEndDrag: (e) => {
      if (pullEnabled && !busy.value && -(e.contentOffset.y - rest) > PULL_TRIGGER) runOnJS(onRefresh)();
    },
  });

  const loader = useAnimatedStyle(() => {
    const k = busy.value ? 1 : interpolate(pull.value, [12, PULL_TRIGGER], [0, 1], Extrapolation.CLAMP);
    return { opacity: k, transform: [{ scale: 0.55 + k * 0.45 }] };
  });
  const spacer = useAnimatedStyle(() => ({ height: hold.value }));

  return { onScroll, loader, spacer, pull, scrollY };
}

/** The brand loader, positioned by the caller (just under a header or the status bar). */
export function PullLoader({ style, top }: { style: AnimatedStyle<ViewStyle>; top: number }) {
  return (
    <Animated.View pointerEvents="none" style={[styles.loader, { top }, style]}>
      <LoopLoader size={44} />
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  loader: { position: 'absolute', alignSelf: 'center', zIndex: 5 },
});
