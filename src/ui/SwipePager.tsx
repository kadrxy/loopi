import { forwardRef, useCallback, useImperativeHandle, useRef, useState, type ReactNode } from 'react';
import { useWindowDimensions, View } from 'react-native';
import Animated, { useAnimatedRef, useAnimatedScrollHandler, useSharedValue, type SharedValue } from 'react-native-reanimated';

export type SwipePagerRef = { goTo: (index: number, animated?: boolean) => void };

type Props = {
  pages: ReactNode[];
  initialIndex?: number;
  onIndexChange?: (index: number) => void;
  /** Page position (0..n-1) that follows the finger; drive a Segmented pill or headers with it. */
  progress?: SharedValue<number>;
  /** Take the active page's height: for a pager inside a vertical ScrollView (profile grid). */
  autoHeight?: boolean;
};

/** Horizontal, finger-following pages: swipe left/right or call goTo(i). */
export const SwipePager = forwardRef<SwipePagerRef, Props>(function SwipePager(
  { pages, initialIndex = 0, onIndexChange, progress: external, autoHeight },
  ref,
) {
  const { width } = useWindowDimensions();
  const scroller = useAnimatedRef<Animated.ScrollView>();
  const own = useSharedValue(initialIndex);
  const progress = external ?? own;
  const [index, setIndex] = useState(initialIndex);
  const [heights, setHeights] = useState<number[]>([]);
  const [frameH, setFrameH] = useState(0);
  const placed = useRef(false);

  const onScroll = useAnimatedScrollHandler((e) => {
    progress.value = e.contentOffset.x / width;
  });

  const settle = useCallback(
    (i: number) => {
      setIndex(i);
      onIndexChange?.(i);
    },
    [onIndexChange],
  );

  useImperativeHandle(ref, () => ({
    goTo(i, animated = true) {
      scroller.current?.scrollTo({ x: i * width, animated });
      settle(i);
    },
  }));

  return (
    <Animated.ScrollView
      ref={scroller}
      horizontal
      pagingEnabled
      bounces={false}
      showsHorizontalScrollIndicator={false}
      onScroll={onScroll}
      scrollEventThrottle={16}
      contentOffset={{ x: initialIndex * width, y: 0 }}
      onLayout={(e) => {
        setFrameH(e.nativeEvent.layout.height);
        // contentOffset is not honoured everywhere (Android, web): place the first page once.
        if (placed.current || !initialIndex) return;
        placed.current = true;
        scroller.current?.scrollTo({ x: initialIndex * width, animated: false });
      }}
      onMomentumScrollEnd={(e) => settle(Math.round(e.nativeEvent.contentOffset.x / width))}
      style={autoHeight && heights[index] ? { height: heights[index], flexGrow: 0 } : undefined}>
      {pages.map((page, i) => (
        // Full-height pages need an explicit height: horizontal scroll content does not stretch everywhere (web).
        <View key={i} style={autoHeight ? { width, alignSelf: 'flex-start' } : { width, height: frameH || '100%' }}>
          {autoHeight ? (
            <View
              onLayout={(e) => {
                const h = e.nativeEvent.layout.height;
                setHeights((hs) => (hs[i] === h ? hs : Object.assign([...hs], { [i]: h })));
              }}>
              {page}
            </View>
          ) : (
            page
          )}
        </View>
      ))}
    </Animated.ScrollView>
  );
});
