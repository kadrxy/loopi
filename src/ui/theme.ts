// LOOPI design tokens — monochrome glass. Colour only ever comes from user photos.
export const colors = {
  bg: '#000000',
  text: '#FFFFFF',
  t2: 'rgba(255,255,255,0.72)',
  t3: 'rgba(255,255,255,0.48)',
  t4: 'rgba(255,255,255,0.30)',
  line: 'rgba(255,255,255,0.10)',
  edge: 'rgba(255,255,255,0.13)',
  highlight: 'rgba(255,255,255,0.18)',
  glassLight: 'rgba(255,255,255,0.09)',
  glassDark: 'rgba(16,16,18,0.58)',
  surface: '#0E0E10',
  scrim: 'rgba(0,0,0,0.6)',
  avatar: '#E5E5EA',
  /** The one accent: read receipts (two blue ticks), as people expect from messaging apps. */
  read: '#53BDEB',
  onWhite: '#000000',
} as const;

export const radius = { sm: 12, md: 18, lg: 26, xl: 32, pill: 999 } as const;
export const space = { xs: 4, sm: 8, md: 12, lg: 16, xl: 24, xxl: 32 } as const;

export const font = {
  light: 'BeVietnamPro_300Light',
  regular: 'BeVietnamPro_400Regular',
  medium: 'BeVietnamPro_500Medium',
  semibold: 'BeVietnamPro_600SemiBold',
  bold: 'BeVietnamPro_700Bold',
  heavy: 'BeVietnamPro_800ExtraBold',
  accent: 'PlayfairDisplay_500Medium_Italic',
  /** Brand display face (rounded, heavy) — logo and big titles. */
  display: 'Nunito_900Black',
  displayBold: 'Nunito_800ExtraBold',
} as const;

export const type = {
  hero: { fontFamily: font.light, fontSize: 30, lineHeight: 36, letterSpacing: -0.9, color: colors.text },
  title: { fontFamily: font.displayBold, fontSize: 24, lineHeight: 30, letterSpacing: -0.4, color: colors.text },
  name: { fontFamily: font.display, fontSize: 34, lineHeight: 38, letterSpacing: -0.8, color: colors.text },
  h2: { fontFamily: font.semibold, fontSize: 17, lineHeight: 22, letterSpacing: -0.3, color: colors.text },
  body: { fontFamily: font.regular, fontSize: 15, lineHeight: 21, color: colors.text },
  bodyStrong: { fontFamily: font.semibold, fontSize: 15, lineHeight: 21, color: colors.text },
  label: { fontFamily: font.semibold, fontSize: 13, lineHeight: 17, color: colors.text },
  caption: { fontFamily: font.regular, fontSize: 12.5, lineHeight: 17, color: colors.t3 },
  micro: { fontFamily: font.medium, fontSize: 10.5, lineHeight: 14, color: colors.t2 },
  stat: { fontFamily: font.light, fontSize: 21, lineHeight: 26, letterSpacing: -0.4, color: colors.text, fontVariant: ['tabular-nums' as const] },
  logo: { fontFamily: font.display, fontSize: 28, letterSpacing: -0.8, color: colors.text },
} as const;

export const shadow = {
  lift: { shadowColor: '#000', shadowOpacity: 0.45, shadowRadius: 18, shadowOffset: { width: 0, height: 10 }, elevation: 10 },
  glow: { shadowColor: '#FFF', shadowOpacity: 0.22, shadowRadius: 18, shadowOffset: { width: 0, height: 6 }, elevation: 6 },
} as const;

export const hit = { top: 8, bottom: 8, left: 8, right: 8 } as const;
