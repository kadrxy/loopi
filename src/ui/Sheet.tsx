import { Modal, Pressable, StyleSheet, Text, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { useT } from '@/i18n';

import { Button } from './Button';
import { Glass } from './Glass';
import { Icon, type IconName } from './Icon';
import { colors, font, radius, type as T } from './theme';

export type SheetOption = {
  label: string;
  onPress: () => void;
  icon?: IconName;
  selected?: boolean;
  disabled?: boolean;
};

type Props = { visible: boolean; title?: string; body?: string; options?: SheetOption[]; onClose: () => void };

/** Cross-platform bottom sheet (Android's Alert supports at most 3 buttons). */
export function Sheet({ visible, title, body, options = [], onClose }: Props) {
  const t = useT();
  const insets = useSafeAreaInsets();
  return (
    <Modal visible={visible} transparent animationType="fade" onRequestClose={onClose} statusBarTranslucent>
      <Pressable style={styles.backdrop} onPress={onClose} accessibilityLabel={t('close')} />
      <Glass dark radius={radius.xl} style={[styles.sheet, { paddingBottom: insets.bottom + 16 }]} intensity={50}>
        <View style={styles.grabber} />
        {title && <Text style={[T.h2, styles.title]}>{title}</Text>}
        {body && <Text style={[T.body, styles.body]}>{body}</Text>}
        {options.map((o) => (
          <Pressable
            key={o.label}
            accessibilityRole="button"
            accessibilityState={{ selected: o.selected, disabled: o.disabled }}
            disabled={o.disabled}
            onPress={() => {
              onClose();
              o.onPress();
            }}
            style={({ pressed }) => [styles.row, pressed && styles.rowPressed, o.selected && styles.rowSelected, o.disabled && { opacity: 0.4 }]}>
            {o.icon && <Icon name={o.icon} size={18} color={colors.t2} />}
            <Text style={[styles.rowText, o.selected && { fontFamily: font.semibold }]}>{o.label}</Text>
            {o.selected && <Icon name="check" size={18} />}
          </Pressable>
        ))}
        <Button title={options.length ? t('cancel') : t('ok')} kind="glass" size="md" onPress={onClose} style={{ marginTop: 10 }} />
      </Glass>
    </Modal>
  );
}

const styles = StyleSheet.create({
  backdrop: { flex: 1, backgroundColor: colors.scrim },
  sheet: { position: 'absolute', left: 8, right: 8, bottom: 8, padding: 16, paddingTop: 10, borderBottomLeftRadius: radius.xl, borderBottomRightRadius: radius.xl },
  grabber: { alignSelf: 'center', width: 38, height: 4, borderRadius: 2, backgroundColor: colors.t4, marginBottom: 14 },
  title: { marginBottom: 6, paddingHorizontal: 6 },
  body: { color: colors.t2, marginBottom: 10, paddingHorizontal: 6 },
  row: { flexDirection: 'row', alignItems: 'center', gap: 10, minHeight: 50, paddingHorizontal: 12, borderRadius: radius.md },
  rowPressed: { backgroundColor: 'rgba(255,255,255,0.06)' },
  rowSelected: { backgroundColor: 'rgba(255,255,255,0.10)' },
  rowText: { flex: 1, fontFamily: font.regular, fontSize: 15, color: colors.text },
});
