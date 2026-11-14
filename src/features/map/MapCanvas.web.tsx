// Web preview stand-in: react-native-maps has no web build. Pins are projected onto a dark grid.
import { Image } from 'expo-image';
import { forwardRef, useImperativeHandle, useState } from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';

import type { MapPlace } from '@/domain/types';
import { colors, font } from '@/ui';

export type MapCanvasRef = { focus: (p: { lat: number; lng: number }) => void };
type Props = { places: MapPlace[]; selected?: string; onSelect: (name: string) => void; bottomInset: number };

/** City centre, close enough that pins around Hải Châu / Mỹ Khê do not overlap. */
export const DA_NANG = { latitude: 16.0655, longitude: 108.2295, latitudeDelta: 0.065, longitudeDelta: 0.065 };

export const MapCanvas = forwardRef<MapCanvasRef, Props>(function MapCanvas({ places, selected, onSelect, bottomInset }, ref) {
  const [box, setBox] = useState({ w: 1, h: 1 });
  useImperativeHandle(ref, () => ({ focus: () => {} }));
  const lats = places.map((p) => p.lat);
  const lngs = places.map((p) => p.lng);
  const [minLat, maxLat] = [Math.min(...lats, 16.0) - 0.01, Math.max(...lats, 16.1) + 0.01];
  const [minLng, maxLng] = [Math.min(...lngs, 108.15) - 0.01, Math.max(...lngs, 108.3) + 0.01];
  const usableH = box.h - bottomInset - 170;
  const pos = (p: MapPlace) => ({
    left: ((p.lng - minLng) / (maxLng - minLng)) * (box.w - 80) + 14,
    top: 150 + (1 - (p.lat - minLat) / (maxLat - minLat)) * usableH,
  });
  return (
    <View style={styles.map} onLayout={(e) => setBox({ w: e.nativeEvent.layout.width, h: e.nativeEvent.layout.height })}>
      {Array.from({ length: 14 }, (_, i) => (
        <View key={`h${i}`} style={[styles.lineH, { top: `${(i + 1) * 7}%` }]} />
      ))}
      {Array.from({ length: 8 }, (_, i) => (
        <View key={`v${i}`} style={[styles.lineV, { left: `${(i + 1) * 12}%` }]} />
      ))}
      <View style={styles.sea} />
      {places.map((p) => (
        <Pressable key={p.name} onPress={() => onSelect(p.name)} style={[styles.pinWrap, pos(p)]} accessibilityRole="button" accessibilityLabel={p.name}>
          <View style={[styles.pin, p.name === selected && styles.pinOn]}>
            <Image source={p.moments[0].image} style={styles.photo} contentFit="cover" />
            {p.moments.length > 1 && (
              <View style={styles.count}>
                <Text style={styles.countText}>{p.moments.length}</Text>
              </View>
            )}
          </View>
          <View style={styles.tail} />
        </Pressable>
      ))}
    </View>
  );
});

const styles = StyleSheet.create({
  map: { ...StyleSheet.absoluteFill, backgroundColor: '#101010', overflow: 'hidden' },
  lineH: { position: 'absolute', left: 0, right: 0, height: 1, backgroundColor: 'rgba(255,255,255,0.05)' },
  lineV: { position: 'absolute', top: 0, bottom: 0, width: 1, backgroundColor: 'rgba(255,255,255,0.05)' },
  sea: { position: 'absolute', right: -70, top: -40, bottom: -40, width: '30%', backgroundColor: '#000', borderLeftWidth: 1, borderColor: 'rgba(255,255,255,0.08)', transform: [{ rotate: '8deg' }] },
  pinWrap: { position: 'absolute', alignItems: 'center' },
  pin: { width: 52, height: 52, borderRadius: 18, borderWidth: 3, borderColor: colors.text, backgroundColor: colors.surface },
  pinOn: { transform: [{ scale: 1.15 }] },
  photo: { flex: 1, borderRadius: 15 },
  tail: { width: 10, height: 10, marginTop: -6, backgroundColor: colors.text, transform: [{ rotate: '45deg' }] },
  count: { position: 'absolute', top: -8, right: -8, minWidth: 20, height: 20, borderRadius: 10, paddingHorizontal: 5, backgroundColor: colors.text, alignItems: 'center', justifyContent: 'center' },
  countText: { fontFamily: font.heavy, fontSize: 10.5, color: colors.onWhite },
});
