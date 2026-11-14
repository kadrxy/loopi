import { Image } from 'expo-image';
import { forwardRef, useImperativeHandle, useRef, useState } from 'react';
import { StyleSheet, Text, View } from 'react-native';
import MapView, { Marker } from 'react-native-maps';

import type { MapPlace } from '@/domain/types';
import { colors, font } from '@/ui';

export type MapCanvasRef = { focus: (p: { lat: number; lng: number }) => void };
type Props = { places: MapPlace[]; selected?: string; onSelect: (name: string) => void; bottomInset: number };

/** City centre, close enough that pins around Hải Châu / Mỹ Khê do not overlap. */
export const DA_NANG = { latitude: 16.0655, longitude: 108.2295, latitudeDelta: 0.065, longitudeDelta: 0.065 };

/** Native map (Apple Maps on iOS, Google on Android), dark and monochrome, with photo pins. */
export const MapCanvas = forwardRef<MapCanvasRef, Props>(function MapCanvas({ places, selected, onSelect, bottomInset }, ref) {
  const map = useRef<MapView>(null);
  useImperativeHandle(ref, () => ({
    focus: ({ lat, lng }) => map.current?.animateToRegion({ latitude: lat, longitude: lng, latitudeDelta: 0.05, longitudeDelta: 0.05 }, 450),
  }));
  return (
    <MapView
      ref={map}
      style={StyleSheet.absoluteFill}
      initialRegion={DA_NANG}
      userInterfaceStyle="dark"
      mapType="standard"
      customMapStyle={DARK_STYLE}
      showsPointsOfInterests={false}
      showsCompass={false}
      toolbarEnabled={false}
      mapPadding={{ top: 0, left: 0, right: 0, bottom: bottomInset }}>
      {places.map((p) => (
        <PhotoPin key={p.name} place={p} active={p.name === selected} onPress={() => onSelect(p.name)} />
      ))}
    </MapView>
  );
});

function PhotoPin({ place, active, onPress }: { place: MapPlace; active: boolean; onPress: () => void }) {
  // Custom marker views are snapshotted; keep tracking until the photo has loaded.
  const [tracks, setTracks] = useState(true);
  return (
    <Marker
      coordinate={{ latitude: place.lat, longitude: place.lng }}
      onPress={onPress}
      tracksViewChanges={tracks || active}
      anchor={{ x: 0.5, y: 1 }}>
      <View style={[styles.pin, active && styles.pinOn]}>
        <Image source={place.moments[0].image} style={styles.photo} contentFit="cover" onLoad={() => setTimeout(() => setTracks(false), 300)} />
        {place.moments.length > 1 && (
          <View style={styles.count}>
            <Text style={styles.countText}>{place.moments.length}</Text>
          </View>
        )}
      </View>
      <View style={styles.tail} />
    </Marker>
  );
}

const styles = StyleSheet.create({
  pin: { width: 52, height: 52, borderRadius: 18, borderWidth: 3, borderColor: colors.text, backgroundColor: colors.surface },
  pinOn: { transform: [{ scale: 1.15 }] },
  photo: { flex: 1, borderRadius: 15 },
  tail: { alignSelf: 'center', width: 10, height: 10, marginTop: -6, backgroundColor: colors.text, transform: [{ rotate: '45deg' }] },
  count: {
    position: 'absolute',
    top: -8,
    right: -8,
    minWidth: 20,
    height: 20,
    borderRadius: 10,
    paddingHorizontal: 5,
    backgroundColor: colors.text,
    alignItems: 'center',
    justifyContent: 'center',
  },
  countText: { fontFamily: font.heavy, fontSize: 10.5, color: colors.onWhite },
});

// Google Maps (Android) monochrome dark style; Apple Maps follows userInterfaceStyle instead.
const DARK_STYLE = [
  { elementType: 'geometry', stylers: [{ color: '#111111' }] },
  { elementType: 'labels.icon', stylers: [{ visibility: 'off' }] },
  { elementType: 'labels.text.fill', stylers: [{ color: '#8a8a8a' }] },
  { elementType: 'labels.text.stroke', stylers: [{ color: '#111111' }] },
  { featureType: 'poi', stylers: [{ visibility: 'off' }] },
  { featureType: 'road', elementType: 'geometry', stylers: [{ color: '#2a2a2a' }] },
  { featureType: 'road.highway', elementType: 'geometry', stylers: [{ color: '#3a3a3a' }] },
  { featureType: 'transit', stylers: [{ visibility: 'off' }] },
  { featureType: 'water', elementType: 'geometry', stylers: [{ color: '#000000' }] },
];
