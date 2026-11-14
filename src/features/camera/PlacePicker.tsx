import * as Location from 'expo-location';
import { useMemo, useState } from 'react';
import { ActivityIndicator, FlatList, Pressable, StyleSheet, Text, TextInput, View } from 'react-native';

import { POPULAR_PLACES, useApp } from '@/data';
import { fold, mapPlaces } from '@/domain/rules';
import type { Place } from '@/domain/types';
import { useT } from '@/i18n';
import { BottomSheet, colors, font, Icon, radius } from '@/ui';

type Props = { visible: boolean; onClose: () => void; onPick: (place: Place) => void };

/** Tag where a moment was taken: my current location, places friends used, or popular spots. */
export function PlacePicker({ visible, onClose, onPick }: Props) {
  const t = useT();
  const meId = useApp((s) => s.meId);
  const graph = useApp((s) => s.graph);
  const moments = useApp((s) => s.moments);
  const [q, setQ] = useState('');
  const [locating, setLocating] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const places = useMemo(() => {
    const seen = new Set<string>();
    const all = [...mapPlaces(graph, meId, moments), ...POPULAR_PLACES].filter((p) => !seen.has(p.name) && seen.add(p.name));
    const f = fold(q.trim());
    return (f ? all.filter((p) => fold(p.name).includes(f)) : all).map(({ name, lat, lng }) => ({ name, lat, lng }));
  }, [graph, meId, moments, q]);

  const pick = (p: Place) => {
    onPick(p);
    onClose();
    setQ('');
  };

  // Ask only now (when the person taps it), then name the spot by reverse geocoding.
  const useCurrent = async () => {
    setError(null);
    setLocating(true);
    try {
      const perm = await Location.requestForegroundPermissionsAsync();
      if (!perm.granted) return setError(t('loc_denied'));
      const pos = await Location.getCurrentPositionAsync({ accuracy: Location.Accuracy.Balanced });
      const [addr] = await Location.reverseGeocodeAsync(pos.coords).catch(() => []);
      const name = addr?.name || addr?.street || addr?.district || addr?.city || t('loc_here');
      pick({ name, lat: pos.coords.latitude, lng: pos.coords.longitude });
    } catch {
      setError(t('loc_failed'));
    } finally {
      setLocating(false);
    }
  };

  return (
    <BottomSheet visible={visible} onClose={onClose} height={0.7}>
      <View style={styles.searchWrap}>
        <Icon name="search" size={17} color={colors.t3} />
        <TextInput
          value={q}
          onChangeText={setQ}
          placeholder={t('loc_search')}
          placeholderTextColor={colors.t3}
          autoCorrect={false}
          style={styles.search}
          accessibilityLabel={t('loc_search')}
        />
      </View>
      <FlatList
        data={places}
        keyExtractor={(p) => p.name}
        keyboardShouldPersistTaps="handled"
        showsVerticalScrollIndicator={false}
        contentContainerStyle={styles.list}
        ListHeaderComponent={
          <View>
            <Pressable onPress={useCurrent} style={({ pressed }) => [styles.row, pressed && styles.pressed]} accessibilityRole="button">
              <View style={[styles.iconBox, styles.iconBoxOn]}>
                {locating ? <ActivityIndicator color={colors.onWhite} /> : <Icon name="gps" size={18} color={colors.onWhite} />}
              </View>
              <Text style={styles.name}>{t('loc_current')}</Text>
            </Pressable>
            {error && <Text style={styles.error}>{error}</Text>}
            <Text style={styles.section}>{t('loc_popular')}</Text>
          </View>
        }
        renderItem={({ item }) => (
          <Pressable onPress={() => pick(item)} style={({ pressed }) => [styles.row, pressed && styles.pressed]} accessibilityRole="button">
            <View style={styles.iconBox}>
              <Icon name="pin" size={18} />
            </View>
            <Text style={styles.name} numberOfLines={1}>
              {item.name}
            </Text>
          </Pressable>
        )}
      />
    </BottomSheet>
  );
}

const styles = StyleSheet.create({
  searchWrap: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginHorizontal: 16,
    marginBottom: 6,
    paddingHorizontal: 14,
    borderRadius: radius.pill,
    backgroundColor: 'rgba(255,255,255,0.08)',
    borderWidth: 1,
    borderColor: colors.line,
  },
  search: { flex: 1, fontFamily: font.regular, fontSize: 14.5, color: colors.text, paddingVertical: 11 },
  list: { paddingHorizontal: 16, paddingBottom: 16 },
  row: { flexDirection: 'row', alignItems: 'center', gap: 12, minHeight: 56, borderRadius: 14, paddingHorizontal: 4 },
  pressed: { backgroundColor: 'rgba(255,255,255,0.05)' },
  iconBox: { width: 38, height: 38, borderRadius: 12, backgroundColor: 'rgba(255,255,255,0.08)', alignItems: 'center', justifyContent: 'center' },
  iconBoxOn: { backgroundColor: colors.text },
  name: { flex: 1, fontFamily: font.semibold, fontSize: 14.5, color: colors.text },
  section: { fontFamily: font.semibold, fontSize: 12, color: colors.t3, paddingTop: 12, paddingBottom: 4, paddingHorizontal: 4 },
  error: { fontFamily: font.regular, fontSize: 12.5, color: colors.t2, paddingHorizontal: 4, paddingBottom: 6 },
});
