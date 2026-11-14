import { Image } from 'expo-image';
import { useEffect, useState, type ReactNode } from 'react';
import { StyleSheet, Text, View } from 'react-native';

import type { ImageRef, User } from '@/domain/types';
import { useT } from '@/i18n';

import { Avatar } from './Avatar';
import { Button } from './Button';
import { Glass } from './Glass';
import { Icon, type IconName } from './Icon';
import { colors, type as T } from './theme';

/** Overlapping circles: photos (latest moments) or initials. */
export function AvatarStack({ images, users, size = 20 }: { images?: ImageRef[]; users?: Pick<User, 'name'>[]; size?: number }) {
  const items = images ? images.map((img, i) => ({ key: `i${i}`, img })) : (users ?? []).map((u, i) => ({ key: `u${i}`, u }));
  return (
    <View style={styles.stack}>
      {items.slice(0, 3).map((it, i) => (
        <View key={it.key} style={[styles.stackItem, { width: size, height: size, borderRadius: size / 2, marginLeft: i ? -size * 0.35 : 0 }]}>
          {'img' in it ? <Image source={it.img} style={StyleSheet.absoluteFill} contentFit="cover" /> : <Avatar user={it.u} size={size - 3} />}
        </View>
      ))}
    </View>
  );
}

/** Empty state: icon in a glass disc, title, body, optional action. */
export function EmptyState({ icon, title, body, action }: { icon: IconName; title: string; body?: string; action?: ReactNode }) {
  return (
    <View style={styles.empty}>
      <Glass radius={34} style={styles.emptyIcon}>
        <Icon name={icon} size={28} color={colors.t2} />
      </Glass>
      <Text style={[T.h2, { textAlign: 'center' }]}>{title}</Text>
      {body && <Text style={[T.body, { color: colors.t3, textAlign: 'center' }]}>{body}</Text>}
      {action}
    </View>
  );
}

/** Current time as state, refreshed every `intervalMs` (keeps render pure). */
export function useNow(intervalMs = 30_000) {
  const [now, setNow] = useState(() => Date.now());
  useEffect(() => {
    const id = setInterval(() => setNow(Date.now()), intervalMs);
    return () => clearInterval(id);
  }, [intervalMs]);
  return now;
}

/** "now", "4 m", "2 h", "3 d" — localized. */
export function useTimeAgo() {
  const t = useT();
  return (ts: number) => {
    const mins = Math.floor((Date.now() - ts) / 60_000);
    if (mins < 1) return t('t_now');
    if (mins < 60) return t('t_min', { n: mins });
    const h = Math.floor(mins / 60);
    if (h < 24) return t('t_hour', { n: h });
    return t('t_day', { n: Math.floor(h / 24) });
  };
}

export function Wordmark({ size = 25 }: { size?: number }) {
  return (
    <Text style={[T.logo, { fontSize: size }]} accessibilityRole="header">
      loopi<Text style={{ color: colors.t4 }}>.</Text>
    </Text>
  );
}

export function PrimaryAction({ title, onPress }: { title: string; onPress: () => void }) {
  return <Button title={title} onPress={onPress} kind="glass" size="md" />;
}

const styles = StyleSheet.create({
  stack: { flexDirection: 'row' },
  stackItem: { borderWidth: 1.5, borderColor: colors.bg, overflow: 'hidden', alignItems: 'center', justifyContent: 'center', backgroundColor: colors.avatar },
  empty: { flex: 1, alignItems: 'center', justifyContent: 'center', padding: 32, gap: 12 },
  emptyIcon: { width: 68, height: 68, alignItems: 'center', justifyContent: 'center', marginBottom: 4 },
});
