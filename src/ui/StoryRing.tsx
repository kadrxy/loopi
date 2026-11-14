import { Image } from 'expo-image';
import { StyleSheet, View } from 'react-native';
import Svg, { Circle } from 'react-native-svg';

import type { ImageRef } from '@/domain/types';

import { colors } from './theme';

type Props = { image?: ImageRef; segments: number; unseen: boolean; size?: number; dashed?: boolean; children?: React.ReactNode };

/** Story ring: one arc per moment, white when unseen. Shows the person's latest moment, not a face. */
export function StoryRing({ image, segments, unseen, size = 56, dashed, children }: Props) {
  const stroke = 2;
  const r = size / 2 - stroke;
  const c = 2 * Math.PI * r;
  const n = Math.max(1, segments);
  const gap = n > 1 ? 5 : 0;
  const dash = dashed ? '3 4' : n > 1 ? `${c / n - gap} ${gap}` : undefined;
  return (
    <View style={{ width: size, height: size }}>
      <Svg width={size} height={size} style={[StyleSheet.absoluteFill, { transform: [{ rotate: '-90deg' }] }]}>
        <Circle
          cx={size / 2}
          cy={size / 2}
          r={r}
          fill="none"
          stroke={unseen ? colors.text : 'rgba(255,255,255,0.25)'}
          strokeWidth={unseen ? stroke : 1.5}
          strokeLinecap="round"
          strokeDasharray={dash}
        />
      </Svg>
      <View style={[styles.inner, { borderRadius: size / 2 }]}>
        {image != null ? <Image source={image} style={StyleSheet.absoluteFill} contentFit="cover" /> : children}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  inner: { position: 'absolute', top: 5, left: 5, right: 5, bottom: 5, overflow: 'hidden', alignItems: 'center', justifyContent: 'center' },
});
