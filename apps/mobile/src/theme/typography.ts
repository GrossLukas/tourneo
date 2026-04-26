/**
 * TURNEO – Night Court Typography
 *
 * Three families:
 *  - Outfit (display): headings, hero numbers
 *  - Inter (UI): body, labels
 *  - JetBrains Mono: scores, ELO, numeric
 *
 * Fonts are loaded via expo-font in `useNightCourtFonts()` so this module is
 * safe to import from anywhere.  When fonts haven't loaded yet React Native
 * falls back to the system font – the design still reads correctly because
 * weights and letter-spacing carry the type identity.
 */

export const fontFamily = {
  displayRegular:  'Outfit_500Medium',
  displaySemibold: 'Outfit_600SemiBold',
  displayBold:     'Outfit_700Bold',
  displayExtra:    'Outfit_800ExtraBold',

  uiRegular:  'Inter_400Regular',
  uiMedium:   'Inter_500Medium',
  uiSemibold: 'Inter_600SemiBold',
  uiBold:     'Inter_700Bold',

  monoMedium: 'JetBrainsMono_500Medium',
  monoBold:   'JetBrainsMono_700Bold',
} as const;

export type TextRole =
  | 'h1'
  | 'screenTitle'
  | 'cardTitle'
  | 'sectionHeader'
  | 'listTitle'
  | 'eloBig'
  | 'scoreDigit'
  | 'body'
  | 'meta'
  | 'micro';

export const typography: Record<TextRole, {
  fontFamily: string;
  fontSize: number;
  letterSpacing: number;
  lineHeight?: number;
}> = {
  h1:            { fontFamily: fontFamily.displayExtra,    fontSize: 28, letterSpacing: -0.7 },
  screenTitle:   { fontFamily: fontFamily.displayExtra,    fontSize: 22, letterSpacing: -0.5 },
  cardTitle:     { fontFamily: fontFamily.displayBold,     fontSize: 20, letterSpacing: -0.4 },
  sectionHeader: { fontFamily: fontFamily.displayBold,     fontSize: 19, letterSpacing: -0.4 },
  listTitle:     { fontFamily: fontFamily.displaySemibold, fontSize: 15, letterSpacing: -0.2 },
  eloBig:        { fontFamily: fontFamily.monoBold,        fontSize: 38, letterSpacing: -1.5 },
  scoreDigit:    { fontFamily: fontFamily.monoBold,        fontSize: 17, letterSpacing: 0 },
  body:          { fontFamily: fontFamily.uiMedium,        fontSize: 13, letterSpacing: 0, lineHeight: 18 },
  meta:          { fontFamily: fontFamily.uiMedium,        fontSize: 12, letterSpacing: 0.2 },
  micro:         { fontFamily: fontFamily.uiSemibold,      fontSize: 10, letterSpacing: 0.6 },
};
