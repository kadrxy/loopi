import { Pressable, StyleSheet, View } from 'react-native';

import { colors } from './theme';

type Props = { value: boolean; onChange: (next: boolean) => void; label: string; disabled?: boolean };

export function Toggle({ value, onChange, label, disabled }: Props) {
  return (
    <Pressable
      accessibilityRole="switch"
      accessibilityLabel={label}
      accessibilityState={{ checked: value, disabled }}
      disabled={disabled}
      onPress={() => onChange(!value)}
      hitSlop={10}
      style={[styles.track, value && styles.on, disabled && { opacity: 0.4 }]}>
      <View style={[styles.knob, value ? styles.knobOn : styles.knobOff]} />
    </Pressable>
  );
}

const styles = StyleSheet.create({
  track: {
    width: 44,
    height: 26,
    borderRadius: 13,
    backgroundColor: 'rgba(255,255,255,0.16)',
    borderWidth: 1,
    borderColor: colors.line,
    justifyContent: 'center',
  },
  on: { backgroundColor: colors.text, borderColor: colors.text },
  knob: { width: 20, height: 20, borderRadius: 10, position: 'absolute' },
  knobOff: { left: 2, backgroundColor: 'rgba(255,255,255,0.72)' },
  knobOn: { left: 20, backgroundColor: colors.onWhite },
});
