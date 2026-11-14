import * as Haptics from 'expo-haptics';
import { Image } from 'expo-image';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { useCallback, useEffect, useMemo, useRef, useState, type ReactNode } from 'react';
import { KeyboardAvoidingView, PanResponder, Platform, Pressable, StyleSheet, Text, TextInput, useWindowDimensions, View } from 'react-native';
import Animated, {
  Easing,
  Extrapolation,
  interpolate,
  runOnJS,
  useAnimatedRef,
  useAnimatedScrollHandler,
  useAnimatedStyle,
  useSharedValue,
  withSpring,
  withTiming,
  type SharedValue,
} from 'react-native-reanimated';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { appStore, useApp } from '@/data';
import { canMessage, storyGroups } from '@/domain/rules';
import type { StoryGroup } from '@/domain/types';
import { useT } from '@/i18n';
import { Avatar, colors, font, Glass, Icon, IconButton, radius, Scrim, useTimeAgo } from '@/ui';

const STORY_MS = 5000;
const OPEN_MS = 480;
const CLOSE_MS = 340;

/** Stories: open as a circle from the tapped ring, close as a circle into the centre, cube between people. */
export default function StoryViewer() {
  const router = useRouter();
  const { width: W, height: H } = useWindowDimensions();
  const params = useLocalSearchParams<{
    id: string;
    ox?: string;
    oy?: string;
  }>();
  const meId = useApp((s) => s.meId);
  const graph = useApp((s) => s.graph);
  const moments = useApp((s) => s.moments);
  const seen = useApp((s) => s.seen);
  const order = useApp((s) => s.seenAtRefresh);

  // Freeze the order at open time so marking groups as seen does not reshuffle pages under the finger.
  const [groups] = useState<StoryGroup[]>(() =>
    storyGroups(graph, meId, moments)
      .map((g) => ({ ...g, unseen: !seen[g.userId] }))
      .sort((a, b) => Number(!!order[a.userId]) - Number(!!order[b.userId])),
  );
  const start = Math.max(
    0,
    groups.findIndex((g) => g.userId === params.id),
  );
  const [active, setActive] = useState(start);

  // Circle reveal: the radius grows from the touch point; on close it shrinks into the screen centre.
  const origin = useSharedValue({
    x: Number(params.ox ?? W / 2),
    y: Number(params.oy ?? H / 2),
  });
  const reveal = useSharedValue(0);
  const closing = useRef(false);
  // Start the circle only once the screen is up and the first photo is drawn; started on mount, it
  // would finish behind the modal's own presentation and the photo would pop in already full size.
  const started = useRef(false);
  const startReveal = useCallback(() => {
    if (started.current) return;
    started.current = true;
    reveal.set(withTiming(1, { duration: OPEN_MS, easing: Easing.out(Easing.cubic) }));
  }, [reveal]);
  useEffect(() => {
    const fallback = setTimeout(startReveal, 500);
    return () => clearTimeout(fallback);
  }, [startReveal]);
  const close = useCallback(() => {
    if (closing.current) return;
    closing.current = true;
    origin.set({ x: W / 2, y: H / 2 });
    reveal.set(
      withTiming(0, { duration: CLOSE_MS, easing: Easing.in(Easing.cubic) }, (done) => {
        if (done) runOnJS(router.back)();
      }),
    );
  }, [W, H, origin, reveal, router]);

  const circle = useAnimatedStyle(() => {
    const { x, y } = origin.value;
    const r = Math.max(0.5, reveal.value * Math.hypot(Math.max(x, W - x), Math.max(y, H - y)));
    return {
      left: x - r,
      top: y - r,
      width: r * 2,
      height: r * 2,
      borderRadius: r,
    };
  });
  const inner = useAnimatedStyle(() => {
    const { x, y } = origin.value;
    const r = Math.max(0.5, reveal.value * Math.hypot(Math.max(x, W - x), Math.max(y, H - y)));
    return { left: r - x, top: r - y };
  });
  // Pull down to dismiss: the story follows the finger, shrinks and rounds its corners; the screen
  // below shows through. Far or fast enough closes it, otherwise it springs back.
  const dragX = useSharedValue(0);
  const dragY = useSharedValue(0);
  const card = useAnimatedStyle(() => {
    const p = Math.min(1, Math.max(0, dragY.value / (H * 0.6)));
    return {
      borderRadius: p * 48,
      transform: [{ translateX: dragX.value * 0.35 }, { translateY: Math.max(0, dragY.value) * 0.85 }, { scale: 1 - p * 0.32 }],
    };
  });
  const backdrop = useAnimatedStyle(() => {
    const p = Math.min(1, Math.max(0, dragY.value / (H * 0.6)));
    return { opacity: reveal.value * 0.7 * (1 - p) };
  });
  // Stable across renders so the page's responder is never rebuilt mid-gesture.
  const drag = useMemo(
    () => ({
      move: (dx: number, dy: number) => {
        dragX.set(dx);
        dragY.set(Math.max(0, dy));
      },
      /** Returns true when the story closes. */
      end: (dy: number, vy: number) => {
        if (dy > 140 || (vy > 0.9 && dy > 30)) {
          close();
          return true;
        }
        dragX.set(withSpring(0, { damping: 18, stiffness: 220 }));
        dragY.set(withSpring(0, { damping: 18, stiffness: 220 }));
        return false;
      },
    }),
    [dragX, dragY, close],
  );

  // Cube between people.
  const pager = useAnimatedRef<Animated.ScrollView>();
  const x = useSharedValue(start * W);
  const onScroll = useAnimatedScrollHandler((e) => {
    x.value = e.contentOffset.x;
  });
  const goToGroup = (i: number) => {
    if (i < 0) return;
    if (i >= groups.length) return close();
    pager.current?.scrollTo({ x: i * W, animated: true });
    setActive(i);
  };
  useEffect(() => {
    const g = groups[active];
    if (g) appStore.getState().markSeen(g.userId);
  }, [active, groups]);

  if (!groups.length) return null;

  return (
    <View style={StyleSheet.absoluteFill}>
      <Animated.View style={[StyleSheet.absoluteFill, styles.backdrop, backdrop]} />
      <Animated.View style={[StyleSheet.absoluteFill, styles.card, card]}>
        <Animated.View style={[styles.circle, circle]}>
          <Animated.View style={[{ position: 'absolute', width: W, height: H }, inner]}>
            <Animated.ScrollView
              ref={pager}
              horizontal
              pagingEnabled
              bounces={false}
              showsHorizontalScrollIndicator={false}
              onScroll={onScroll}
              scrollEventThrottle={16}
              contentOffset={{ x: start * W, y: 0 }}
              onLayout={() => {
                if (start) pager.current?.scrollTo({ x: start * W, animated: false });
              }}
              onMomentumScrollEnd={(e) => setActive(Math.round(e.nativeEvent.contentOffset.x / W))}
              style={styles.pager}>
              {groups.map((g, i) => (
                <CubeFace key={g.userId} index={i} x={x} width={W}>
                  <StoryPage
                    group={g}
                    active={i === active}
                    onPrevGroup={() => goToGroup(i - 1)}
                    onNextGroup={() => goToGroup(i + 1)}
                    onClose={close}
                    drag={drag}
                    onReady={i === start ? startReveal : undefined}
                  />
                </CubeFace>
              ))}
            </Animated.ScrollView>
          </Animated.View>
        </Animated.View>
      </Animated.View>
    </View>
  );
}

/** One face of the cube: rotates around the edge it shares with its neighbour. */
function CubeFace({ index, x, width, children }: { index: number; x: SharedValue<number>; width: number; children: ReactNode }) {
  const style = useAnimatedStyle(() => {
    const d = (index * width - x.value) / width; // 0 = centred, 1 = one page to the right
    const angle = interpolate(d, [-1, 0, 1], [-90, 0, 90], Extrapolation.CLAMP);
    const pivot = d > 0 ? -width / 2 : width / 2; // the right page turns on its left edge and vice versa
    return {
      opacity: Math.abs(d) >= 1 ? 0 : 1,
      transform: [{ perspective: width * 2.2 }, { translateX: pivot }, { rotateY: `${angle}deg` }, { translateX: -pivot }],
    };
  });
  return <Animated.View style={[{ width, height: '100%', backfaceVisibility: 'hidden' }, style]}>{children}</Animated.View>;
}

type Drag = {
  move: (dx: number, dy: number) => void;
  end: (dy: number, vy: number) => boolean;
};
type PageProps = {
  group: StoryGroup;
  active: boolean;
  onPrevGroup: () => void;
  onNextGroup: () => void;
  onClose: () => void;
  drag: Drag;
  /** Called once the first photo is on screen (opens the circle). */
  onReady?: () => void;
};

function StoryPage({ group, active, onPrevGroup, onNextGroup, onClose, drag, onReady }: PageProps) {
  const t = useT();
  const ago = useTimeAgo();
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const meId = useApp((s) => s.meId);
  const graph = useApp((s) => s.graph);
  const user = graph.users[group.userId];
  const [i, setI] = useState(0);
  const [paused, setPaused] = useState(false);
  const [reply, setReply] = useState('');
  const [sent, setSent] = useState(false);
  const moment = group.moments[i];
  const liked = useApp((s) => s.moments.find((m) => m.id === moment?.id)?.reactions[meId] === 'heart');
  const canReply = canMessage(graph, meId, group.userId);

  // Progress of the current moment; restarts on change, pauses on hold or while typing.
  const bar = useSharedValue(0);
  const next = () => (i < group.moments.length - 1 ? setI(i + 1) : onNextGroup());
  const prev = () => (i > 0 ? setI(i - 1) : onPrevGroup());
  useEffect(() => {
    bar.set(0);
  }, [i, active, bar]);
  useEffect(() => {
    if (!active || paused) return;
    const left = STORY_MS * (1 - bar.get());
    bar.set(
      withTiming(1, { duration: left, easing: Easing.linear }, (done) => {
        if (done) runOnJS(next)();
      }),
    );
    return () => {
      bar.set(bar.get()); // cancel the timing and freeze where it is
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [i, active, paused]);

  // Pull down to dismiss, following the finger (the viewer animates the card).
  const pan = useMemo(
    () =>
      PanResponder.create({
        onMoveShouldSetPanResponder: (_, g) => g.dy > 8 && Math.abs(g.dy) > Math.abs(g.dx) * 1.2,
        // Native keeps the drag even if the pager asks; web's ScrollView cannot take a refusal.
        onPanResponderTerminationRequest: () => Platform.OS === 'web',
        onPanResponderGrant: () => setPaused(true),
        onPanResponderMove: (_, g) => drag.move(g.dx, g.dy),
        onPanResponderRelease: (_, g) => {
          if (!drag.end(g.dy, g.vy)) setPaused(false);
        },
        onPanResponderTerminate: (_, g) => {
          if (!drag.end(g.dy, g.vy)) setPaused(false);
        },
      }),
    [drag],
  );

  const send = async () => {
    const body = reply.trim();
    if (!body || !moment) return;
    await appStore.getState().sendMessage(group.userId, body, moment.id);
    setReply('');
    setSent(true);
    setPaused(false);
    Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success).catch(() => {});
    setTimeout(() => setSent(false), 1600);
  };

  if (!moment) return null;
  return (
    <KeyboardAvoidingView style={styles.page} behavior={Platform.OS === 'ios' ? 'padding' : undefined} {...pan.panHandlers}>
      <Image source={moment.image} style={StyleSheet.absoluteFill} contentFit="cover" transition={0} cachePolicy="memory-disk" priority="high" onDisplay={i === 0 ? onReady : undefined} />
      <Scrim from={0.55} to={0} style={{ bottom: '70%' }} />
      <Scrim from={0} to={0.75} style={{ top: '62%' }} />

      {/* Tap zones: left third back, the rest forward; hold to pause. */}
      <View style={StyleSheet.absoluteFill}>
        <Pressable
          style={styles.zoneLeft}
          onPress={prev}
          onLongPress={() => setPaused(true)}
          onPressOut={() => setPaused(false)}
          delayLongPress={180}
          accessibilityRole="button"
          accessibilityLabel={t('back')}
        />
        <Pressable
          style={styles.zoneRight}
          onPress={next}
          onLongPress={() => setPaused(true)}
          onPressOut={() => setPaused(false)}
          delayLongPress={180}
          accessibilityRole="button"
          accessibilityLabel={t('next')}
        />
      </View>

      <View style={[styles.top, { paddingTop: insets.top + 8 }]} pointerEvents="box-none">
        <View style={styles.bars}>
          {group.moments.map((m, k) => (
            <ProgressBar key={m.id} state={k < i ? 'done' : k === i ? 'now' : 'todo'} bar={bar} />
          ))}
        </View>
        <View style={styles.head}>
          <Pressable
            style={styles.who}
            onPress={() =>
              router.push({
                pathname: '/user/[id]',
                params: { id: group.userId },
              })
            }
            accessibilityRole="button"
            accessibilityLabel={user?.name}>
            <Avatar user={user} size={34} />
            <Text style={styles.name} numberOfLines={1}>
              {user?.name}
            </Text>
            <Text style={styles.ago}>{ago(moment.createdAt)}</Text>
          </Pressable>
          {paused && <Icon name="pause" size={18} filled />}
          <IconButton name="close" size="sm" dark label={t('close')} onPress={onClose} />
        </View>
      </View>

      <View style={[styles.bottom, { paddingBottom: insets.bottom + 10 }]}>
        {!!moment.caption && (
          <Text style={styles.caption} numberOfLines={3}>
            {moment.caption}
          </Text>
        )}
        {sent && (
          <Glass dark radius={radius.pill} style={styles.sent}>
            <Icon name="check" size={14} filled />
            <Text style={styles.sentText}>{t('sent')}</Text>
          </Glass>
        )}
        <View style={styles.replyRow}>
          {canReply ? (
            <Glass dark radius={radius.pill} style={styles.reply}>
              <TextInput
                value={reply}
                onChangeText={setReply}
                onFocus={() => setPaused(true)}
                onBlur={() => setPaused(false)}
                onSubmitEditing={send}
                placeholder={t('story_reply_ph')}
                placeholderTextColor={colors.t2}
                returnKeyType="send"
                style={styles.replyInput}
                accessibilityLabel={t('story_reply_ph')}
              />
              {!!reply.trim() && <IconButton name="send" size="sm" label={t('send')} onPress={send} />}
            </Glass>
          ) : (
            <View style={{ flex: 1 }} />
          )}
          <IconButton name="heart" filled={liked} dark label={t('like')} onPress={() => appStore.getState().react(moment.id, 'heart')} />
        </View>
      </View>
    </KeyboardAvoidingView>
  );
}

function ProgressBar({ state, bar }: { state: 'done' | 'now' | 'todo'; bar: SharedValue<number> }) {
  const fill = useAnimatedStyle(() => ({
    width: `${(state === 'done' ? 1 : state === 'now' ? bar.value : 0) * 100}%`,
  }));
  return (
    <View style={styles.track}>
      <Animated.View style={[styles.fill, fill]} />
    </View>
  );
}

const styles = StyleSheet.create({
  backdrop: { backgroundColor: colors.bg },
  card: { overflow: 'hidden' },
  circle: {
    position: 'absolute',
    overflow: 'hidden',
    backgroundColor: colors.bg,
  },
  pager: { flex: 1 },
  page: { flex: 1, backgroundColor: colors.bg, overflow: 'hidden' },
  zoneLeft: { position: 'absolute', left: 0, top: 0, bottom: 0, width: '33%' },
  zoneRight: {
    position: 'absolute',
    right: 0,
    top: 0,
    bottom: 0,
    width: '67%',
  },
  top: {
    position: 'absolute',
    left: 0,
    right: 0,
    paddingHorizontal: 10,
    gap: 10,
  },
  bars: { flexDirection: 'row', gap: 4 },
  track: {
    flex: 1,
    height: 3,
    borderRadius: 2,
    backgroundColor: 'rgba(255,255,255,0.3)',
    overflow: 'hidden',
  },
  fill: { height: '100%', backgroundColor: colors.text },
  head: { flexDirection: 'row', alignItems: 'center', gap: 10 },
  who: { flex: 1, flexDirection: 'row', alignItems: 'center', gap: 8 },
  name: {
    flexShrink: 1,
    fontFamily: font.semibold,
    fontSize: 14,
    color: colors.text,
  },
  ago: { fontFamily: font.regular, fontSize: 12, color: colors.t2 },
  bottom: {
    position: 'absolute',
    left: 0,
    right: 0,
    bottom: 0,
    paddingHorizontal: 12,
    gap: 12,
  },
  caption: {
    fontFamily: font.semibold,
    fontSize: 16,
    lineHeight: 22,
    color: colors.text,
    paddingHorizontal: 4,
  },
  sent: {
    alignSelf: 'center',
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingVertical: 6,
    paddingHorizontal: 12,
  },
  sentText: { fontFamily: font.semibold, fontSize: 12, color: colors.text },
  replyRow: { flexDirection: 'row', alignItems: 'center', gap: 10 },
  reply: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    paddingLeft: 16,
    paddingRight: 5,
    minHeight: 48,
  },
  replyInput: {
    flex: 1,
    fontFamily: font.regular,
    fontSize: 14.5,
    color: colors.text,
    paddingVertical: 12,
  },
});
