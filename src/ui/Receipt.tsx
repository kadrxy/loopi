import type { MessageStatus } from '@/domain/types';

import { Icon } from './Icon';
import { colors } from './theme';

/** One tick = sent, two = delivered, two blue = read. `onLight` for white bubbles. */
export function Receipt({ status, size = 15, onLight }: { status?: MessageStatus; size?: number; onLight?: boolean }) {
  if (!status) return null;
  const grey = onLight ? 'rgba(0,0,0,0.45)' : colors.t3;
  if (status === 'sent') return <Icon name="tick" size={size} color={grey} />;
  return <Icon name="checks" size={size} color={status === 'read' ? colors.read : grey} />;
}
