import { useEffect, useMemo, useState, type ReactNode } from 'react';
import { KeyboardAvoidingView, Modal, PanResponder, Platform, Pressable, StyleSheet, useWindowDimensions, View } from 'react-native';
import Animated, { Easing, runOnJS, useAnimatedStyle, useSharedValue, withSpring, withTiming } from 'react-native-reanimated';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { useT } from '@/i18n';

import { colors, radius } from './theme';

type Props = {
  visible: boolean;
  onClose: () => void;
  children: ReactNode;
  /** Fraction of the screen height the sheet may take (content decides below that). */
  maxHeight?: number;
  /** Fixed height fraction, for sheets with their own scrolling list (comments). */
  height?: number;
};

const SPRING = { damping: 22, stiffness: 260, mass: 0.9 };

/** Slides up with a spring over a dimmed backdrop; drag the grabber (or tap outside) to close. */
export function BottomSheet({ visible, onClose, children, maxHeight = 0.88, height }: Props) {
  const t = useT();
  const { height: H } = useWindowDimensions();
  const insets = useSafeAreaInsets();
  const [mounted, setMounted] = useState(visible);
  const y = useSharedValue(H);
  const fade = useSharedValue(0);

  if (visible && !mounted) setMounted(true);

  useEffect(() => {
    if (visible) {
      y.set(withSpring(0, SPRING));
      fade.set(withTiming(1, { duration: 220 }));
    } else if (mounted) {
      fade.set(withTiming(0, { duration: 200 }));
      y.set(
        withTiming(H, { duration: 220, easing: Easing.in(Easing.cubic) }, (done) => {
          if (done) runOnJS(setMounted)(false);
        }),
      );
    }
  }, [visible, mounted, H, y, fade]);

  const drag = useMemo(
    () =>
      PanResponder.create({
        onStartShouldSetPanResponder: () => true,
        onMoveShouldSetPanResponder: (_, g) => g.dy > 4,
        onPanResponderMove: (_, g) => y.set(Math.max(0, g.dy)),
        onPanResponderRelease: (_, g) => {
          if (g.dy > 110 || g.vy > 1) onClose();
          else y.set(withSpring(0, SPRING));
        },
      }),
    [onClose, y],
  );

  const sheet = useAnimatedStyle(() => ({ transform: [{ translateY: y.value }] }));
  const backdrop = useAnimatedStyle(() => ({ opacity: fade.value }));

  if (!mounted) return null;
  return (
    <Modal visible transparent animationType="none" onRequestClose={onClose} statusBarTranslucent>
      <Animated.View style={[StyleSheet.absoluteFill, styles.backdrop, backdrop]}>
        <Pressable style={StyleSheet.absoluteFill} onPress={onClose} accessibilityRole="button" accessibilityLabel={t('close')} />
      </Animated.View>
      <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : undefined} style={styles.anchor} pointerEvents="box-none">
        <Animated.View
          style={[
            styles.sheet,
            { paddingBottom: Math.max(insets.bottom, 12), maxHeight: H * maxHeight },
            height ? { height: H * height } : undefined,
            sheet,
          ]}
          accessibilityViewIsModal>
          <View {...drag.panHandlers} style={styles.grabZone}>
            <View style={styles.grabber} />
          </View>
          {children}
        </Animated.View>
      </KeyboardAvoidingView>
    </Modal>
  );
}

const styles = StyleSheet.create({
  backdrop: { backgroundColor: 'rgba(0,0,0,0.6)' },
  anchor: { flex: 1, justifyContent: 'flex-end' },
  sheet: {
    backgroundColor: '#0E0E0E',
    borderTopLeftRadius: radius.xl,
    borderTopRightRadius: radius.xl,
    borderWidth: 1,
    borderBottomWidth: 0,
    borderColor: colors.line,
    overflow: 'hidden',
  },
  grabZone: { alignItems: 'center', paddingTop: 10, paddingBottom: 6 },
  grabber: { width: 40, height: 5, borderRadius: 3, backgroundColor: 'rgba(255,255,255,0.28)' },
});
