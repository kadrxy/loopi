import { Text, type TextProps } from 'react-native';

import { type as T } from './theme';

type Variant = keyof typeof T;

/** Text with the design system's type presets (custom fonts need a family per weight). */
export function Txt({ variant = 'body', style, ...rest }: TextProps & { variant?: Variant }) {
  return <Text {...rest} style={[T[variant], style]} />;
}
