import { Image } from 'expo-image';
import { useRef, useState } from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import Animated, { useAnimatedStyle, useSharedValue, withDelay, withSequence, withSpring, withTiming } from 'react-native-reanimated';

import type { Graph, Moment, Reaction } from '@/domain/types';
import { ReactionBar } from '@/features/moment/ReactionBar';
import { useT, type TKey } from '@/i18n';
import { Avatar, AvatarStack, Burst, Chip, colors, font, Glass, Icon, IconButton, radius, Scrim, useBursts, useTimeAgo, type IconName } from '@/ui';

export const AUDIENCE_ICON: Record<Moment['audience'], IconName> = { everyone: 'globe', followers: 'users', friends: 'heart' };
export const AUDIENCE_KEY: Record<Moment['audience'], TKey> = { everyone: 'aud_everyone', followers: 'aud_followers', friends: 'aud_friends' };

type Props = {
  moment: Moment;
  graph: Graph;
  meId: string;
  height: number;
  onOpenUser: () => void;
  onLike: () => void;
  /** Opens the comments sheet in place. */
  onComments: () => void;
  /** Opens the "send to" sheet. */
  onSend: () => void;
  /** Long-press the heart to pick another reaction (fire, haha, wow…). */
  onReact: (reaction: Reaction) => void;
};

export function MomentCard({ moment, graph, meId, height, onOpenUser, onLike, onComments, onSend, onReact }: Props) {
  const [picking, setPicking] = useState(false);
  const t = useT();
  const ago = useTimeAgo();
  const [particles, fire] = useBursts();
  const [photoParticles, firePhoto] = useBursts();
  // Double-tap the photo to like (big heart pop + fountain); a single tap does nothing, like Instagram.
  const lastTap = useRef(0);
  const heart = useSharedValue(0);
  const heartStyle = useAnimatedStyle(() => ({ opacity: heart.value, transform: [{ scale: 0.5 + heart.value * 0.7 }] }));
  const onPhotoPress = () => {
    if (picking) return setPicking(false);
    const now = Date.now();
    if (now - lastTap.current < 280) {
      lastTap.current = 0;
      if (moment.reactions[meId] !== 'heart') onLike();
      firePhoto('heart', '50%');
      heart.set(withSequence(withSpring(1, { damping: 9, stiffness: 260 }), withDelay(380, withTiming(0, { duration: 240 }))));
    } else {
      lastTap.current = now;
    }
  };
  const author = graph.users[moment.authorId];
  const reactors = Object.keys(moment.reactions).filter((id) => id !== meId);
  const mine = moment.reactions[meId];
  const liked = !!mine;
  const reactionCount = Object.keys(moment.reactions).length;
  const firstName = reactors[0] ? graph.users[reactors[0]]?.name.split(' ')[0] : undefined;
  const lastComment = moment.comments[moment.comments.length - 1];

  return (
    <View style={styles.wrap}>
      <Pressable
        onPress={onPhotoPress}
        accessibilityRole="imagebutton"
        accessibilityLabel={moment.caption || author?.name}
        style={[styles.card, { height }]}>
        <Image
          source={moment.image}
          style={StyleSheet.absoluteFill}
          contentFit="cover"
          transition={200}
          cachePolicy="memory-disk"
          recyclingKey={moment.id}
        />
        <Scrim from={0} to={0.82} style={{ top: '45%' }} />
        <Animated.View pointerEvents="none" style={[styles.bigHeart, heartStyle]}>
          <Icon name="heart" size={104} filled />
        </Animated.View>
        <View pointerEvents="none" style={styles.photoBurst}>
          <Burst particles={photoParticles} />
        </View>

        <Pressable onPress={onOpenUser} style={styles.whoPos} hitSlop={4} accessibilityRole="button" accessibilityLabel={author?.name}>
          <Glass dark radius={radius.pill} style={styles.who}>
            <Avatar user={author} size={30} />
            <View style={{ flexShrink: 1 }}>
              <Text style={styles.whoName} numberOfLines={1}>
                {author?.name}
              </Text>
              <Text style={styles.whoSub} numberOfLines={1}>
                @{author?.username} · {ago(moment.createdAt)}
              </Text>
            </View>
          </Glass>
        </Pressable>

        <View style={styles.audPos}>
          <Chip dark icon={AUDIENCE_ICON[moment.audience]} iconFilled label={t(AUDIENCE_KEY[moment.audience])} />
        </View>

        <View style={styles.rail}>
          <View>
            <Burst particles={particles} />
            <IconButton
              name={mine ?? 'heart'}
              filled={liked}
              size="sm"
              dark
              label={t('like')}
              onPress={() => {
                // Tap: like, or take back whatever reaction I left.
                if (mine) return onReact(mine);
                fire('heart', '50%');
                onLike();
              }}
              onLongPress={() => setPicking(true)}
              caption={String(reactionCount)}
            />
          </View>
          <IconButton name="chat" size="sm" dark label={t('comments')} onPress={onComments} caption={String(moment.comments.length)} />
          <IconButton name="send" size="sm" dark label={t('send_to')} onPress={onSend} />
        </View>

        {picking && (
          <View style={styles.picker}>
            <ReactionBar
              selected={mine}
              onPick={(r) => {
                onReact(r);
                setTimeout(() => setPicking(false), 450);
              }}
            />
          </View>
        )}

        <View style={[styles.bottom, picking && { opacity: 0 }]}>
          {moment.place && (
            <View style={styles.place}>
              <Icon name="pin" size={13} filled />
              <Text style={styles.placeText} numberOfLines={1}>
                {moment.place.name}
              </Text>
            </View>
          )}
          {!!moment.caption && (
            <Text style={styles.caption} numberOfLines={2}>
              {moment.caption}
            </Text>
          )}
          {firstName && (
            <View style={styles.liked}>
              <AvatarStack users={reactors.map((id) => graph.users[id]).filter(Boolean)} size={20} />
              <Text style={styles.likedText} numberOfLines={1}>
                {reactors.length > 1 ? t('liked_by', { name: firstName, n: reactors.length - 1 }) : t('liked_by_one', { name: firstName })}
              </Text>
            </View>
          )}
        </View>
      </Pressable>

      {lastComment && (
        <Pressable onPress={onComments} accessibilityRole="button" accessibilityLabel={t('view_comments', { n: moment.comments.length })}>
          <Glass radius={20} style={styles.comment}>
            <Avatar user={graph.users[lastComment.authorId]} size={24} />
            <Text style={styles.commentName} numberOfLines={1}>
              {graph.users[lastComment.authorId]?.name.split(' ')[0]}
            </Text>
            <Text style={styles.commentBody} numberOfLines={1}>
              {lastComment.body}
            </Text>
            <Text style={styles.commentTime}>{ago(lastComment.createdAt)}</Text>
          </Glass>
        </Pressable>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: { marginHorizontal: 10, gap: 8 },
  bigHeart: { position: 'absolute', top: 0, left: 0, right: 0, bottom: 0, alignItems: 'center', justifyContent: 'center' },
  photoBurst: { position: 'absolute', left: 0, right: 0, top: 0, bottom: '42%' },
  card: { borderRadius: 30, overflow: 'hidden', backgroundColor: colors.surface },
  whoPos: { position: 'absolute', top: 12, left: 12, maxWidth: '62%' },
  who: { flexDirection: 'row', alignItems: 'center', gap: 8, paddingVertical: 5, paddingLeft: 5, paddingRight: 14 },
  whoName: { fontFamily: font.semibold, fontSize: 13, color: colors.text },
  whoSub: { fontFamily: font.regular, fontSize: 10.5, color: colors.t2 },
  audPos: { position: 'absolute', top: 15, right: 12 },
  picker: { position: 'absolute', left: 12, right: 12, bottom: 16, zIndex: 30 },
  rail: { position: 'absolute', right: 12, bottom: 16, gap: 12, alignItems: 'center' },
  bottom: { position: 'absolute', left: 14, right: 68, bottom: 16, gap: 8 },
  place: { flexDirection: 'row', alignItems: 'center', gap: 4 },
  placeText: { flexShrink: 1, fontFamily: font.semibold, fontSize: 12, color: colors.t2 },
  caption: { fontFamily: font.semibold, fontSize: 15, lineHeight: 20, color: colors.text },
  liked: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  likedText: { fontFamily: font.regular, fontSize: 11.5, color: colors.t2, flexShrink: 1 },
  comment: { flexDirection: 'row', alignItems: 'center', gap: 8, paddingVertical: 8, paddingLeft: 8, paddingRight: 12 },
  commentName: { maxWidth: '35%', fontFamily: font.semibold, fontSize: 12, color: colors.text },
  commentBody: { flex: 1, fontFamily: font.regular, fontSize: 12, color: colors.t2 },
  commentTime: { flexShrink: 0, fontFamily: font.regular, fontSize: 10.5, color: colors.t3 },
});
