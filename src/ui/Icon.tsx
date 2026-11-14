import { View } from 'react-native';
import { SvgXml } from 'react-native-svg';

import { ICON_DATA } from './icon-data';
import { colors } from './theme';

export type IconName = keyof typeof ICON_DATA;

type Props = { name: IconName; size?: number; color?: string; filled?: boolean };

// Built once per icon and weight; the SVG bodies use currentColor, so one string serves every color.
const xmlCache = new Map<string, string>();
function xmlFor(name: IconName, filled: boolean) {
  const key = filled ? `${name}:b` : name;
  let xml = xmlCache.get(key);
  if (!xml) {
    const d = ICON_DATA[name];
    xml = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 ${d.vb} ${d.vb}">${filled ? d.bold : d.line}</svg>`;
    xmlCache.set(key, xml);
  }
  return xml;
}

/** The only icon component in the app: Solar (bundled), line by default, bold when selected. */
export function Icon({ name, size = 22, color = colors.text, filled = false }: Props) {
  // Positioned wrapper: on web an un-positioned <svg> paints beneath Glass's absolute blur layers.
  return (
    <View pointerEvents="none" style={{ width: size, height: size }}>
      <SvgXml xml={xmlFor(name, filled)} width={size} height={size} color={color} />
    </View>
  );
}
