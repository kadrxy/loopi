import type { BottomTabBarProps } from 'expo-router/js-tabs';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import Animated, { Extrapolation, interpolate, useAnimatedStyle } from 'react-native-reanimated';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { useApp } from '@/data';
import { unreadThreads } from '@/domain/rules';

import { Glass } from './Glass';
import { Icon, type IconName } from './Icon';
import { homeProgress } from './immersive';
import { emitTabReselect } from './tabReselect';
import { colors, font, shadow } from './theme';

const ICON: Record<string, IconName> = { home: 'home', friends: 'friends', inbox: 'chat', profile: 'profile' };
export const TAB_BAR_HEIGHT = 66;

/** Bottom space screens leave so content can scroll above the floating glass bar. */
export function useTabBarSpace() {
  const insets = useSafeAreaInsets();
  return TAB_BAR_HEIGHT + Math.max(insets.bottom, 12) + 16;
}

export function GlassTabBar({ state, descriptors, navigateToTab }: BottomTabBarProps) {
  const insets = useSafeAreaInsets();
  const meId = useApp((s) => s.meId);
  const conversations = useApp((s) => s.conversations);
  const unread = unreadThreads(conversations, meId);
  const centerTab = useApp((s) => s.settings.centerTab);
  const current = state.routes[state.index]?.name;
  const onHome = current === 'home';
  // On Home, the bar slides away as the side page (camera or map) is swiped in.
  const slide = useAnimatedStyle(() => {
    const hidden = onHome ? interpolate(homeProgress.value, [0, 1], [1, 0], Extrapolation.CLAMP) : 0;
    return { opacity: 1 - hidden, transform: [{ translateY: hidden * 130 }] };
  });
  if (current === 'center' && centerTab === 'camera') return null; // the camera is full-screen

  return (
    <Animated.View pointerEvents="box-none" style={[styles.wrap, { bottom: Math.max(insets.bottom, 12) }, slide]}>
      <Glass dark radius={30} style={styles.bar} intensity={45}>
        {state.routes.map((route, i) => {
          const focused = i === state.index;
          const title = descriptors[route.key]?.options.title ?? route.name;
          if (route.name === 'center') {
            return (
              <Pressable
                key={route.key}
                accessibilityRole="button"
                accessibilityLabel={title}
                onPress={() => navigateToTab(route.key)}
                style={({ pressed }) => [styles.plusSlot, { transform: [{ scale: pressed ? 0.94 : 1 }] }]}>
                <View style={[styles.plus, shadow.glow]}>
                  <Icon name={centerTab === 'map' ? 'map' : 'camera'} size={25} filled color={colors.onWhite} />
                </View>
              </Pressable>
            );
          }
          return (
            <Pressable
              key={route.key}
              accessibilityRole="tab"
              accessibilityLabel={title}
              accessibilityState={{ selected: focused }}
              onPress={() => (focused ? emitTabReselect(route.name) : navigateToTab(route.key))}
              style={styles.item}>
              <View>
                <Icon name={ICON[route.name] ?? 'home'} size={24} filled={focused} color={focused ? colors.text : colors.t4} />
                {route.name === 'inbox' && unread > 0 && (
                  <View style={styles.badge}>
                    <Text style={styles.badgeText}>{unread}</Text>
                  </View>
                )}
              </View>
              <Text style={[styles.label, focused && { color: colors.text }]} numberOfLines={1}>
                {title}
              </Text>
              {focused && <View style={styles.dot} />}
            </Pressable>
          );
        })}
      </Glass>
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  wrap: { position: 'absolute', left: 12, right: 12 },
  bar: { height: TAB_BAR_HEIGHT, flexDirection: 'row', alignItems: 'center', justifyContent: 'space-around', overflow: 'visible' },
  item: { width: 62, alignItems: 'center', gap: 3, paddingVertical: 6 },
  label: { fontFamily: font.medium, fontSize: 10, color: colors.t4 },
  dot: { position: 'absolute', bottom: -4, width: 4, height: 4, borderRadius: 2, backgroundColor: colors.text },
  plusSlot: { width: 62, alignItems: 'center' },
  plus: {
    width: 56,
    height: 56,
    borderRadius: 28,
    backgroundColor: colors.text,
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: -30,
    borderWidth: 5,
    borderColor: colors.bg,
  },
  badge: {
    position: 'absolute',
    top: -5,
    right: -9,
    minWidth: 17,
    height: 17,
    paddingHorizontal: 4,
    borderRadius: 9,
    backgroundColor: colors.text,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 2,
    borderColor: colors.bg,
  },
  badgeText: { fontFamily: font.heavy, fontSize: 9.5, color: colors.onWhite },
});
