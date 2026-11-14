import { Image } from 'expo-image';
import { StyleSheet, Text, View } from 'react-native';

import type { ImageRef, User } from '@/domain/types';

import { colors, font } from './theme';

type Props = { user?: Pick<User, 'name' | 'avatar'>; size?: number; ring?: boolean; image?: ImageRef };

/** The user's photo if they set one, else a monochrome initial; optionally ringed. */
export function Avatar({ user, size = 36, ring, image: override }: Props) {
  const inner = ring ? size - 6 : size;
  const image = override ?? user?.avatar;
  return (
    <View style={[styles.ringWrap, { width: size, height: size, borderRadius: size / 2 }, ring && styles.ring]}>
      <View style={[styles.circle, { width: inner, height: inner, borderRadius: inner / 2 }]}>
        {image != null ? (
          <Image source={image} style={StyleSheet.absoluteFill} contentFit="cover" />
        ) : (
          <Text style={[styles.initial, { fontSize: inner * 0.4 }]}>{(user?.name ?? '?').slice(0, 1).toUpperCase()}</Text>
        )}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  ringWrap: { alignItems: 'center', justifyContent: 'center' },
  ring: { borderWidth: 2, borderColor: colors.text },
  circle: { backgroundColor: colors.avatar, alignItems: 'center', justifyContent: 'center', overflow: 'hidden' },
  initial: { fontFamily: font.bold, color: colors.onWhite },
});
