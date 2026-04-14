// ============================================
// TURNEO – Night Court Theme 2026
// Dark-Mode-First Color System
// ============================================

// ─── Night Court Palette (primary export) ────
export const nightCourtColors = {
  // Backgrounds
  background:          '#0A0A14',
  backgroundElevated:  '#0D0D1A',
  backgroundCard:      '#111127',
  backgroundInput:     '#16162A',
  backgroundOverlay:   'rgba(10,10,20,0.85)',

  // Primary – Electric Indigo
  primary:             '#6366F1',
  primaryLight:        '#818CF8',
  primaryDark:         '#4F46E5',
  primaryBg:           'rgba(99,102,241,0.12)',

  // Prize – Gold
  gold:                '#F59E0B',
  goldLight:           '#FCD34D',
  goldBg:              'rgba(245,158,11,0.12)',

  // Alerts & Live
  danger:              '#FF4757',
  dangerBg:            'rgba(255,71,87,0.12)',
  success:             '#10B981',
  successBg:           'rgba(16,185,129,0.12)',
  warning:             '#F59E0B',
  warningBg:           'rgba(245,158,11,0.12)',

  // Text
  textPrimary:         '#FFFFFF',
  textSecondary:       'rgba(255,255,255,0.6)',
  textTertiary:        'rgba(255,255,255,0.35)',
  textDisabled:        'rgba(255,255,255,0.2)',

  // Borders
  border:              'rgba(255,255,255,0.08)',
  borderStrong:        'rgba(255,255,255,0.15)',
  borderPrimary:       'rgba(99,102,241,0.3)',
  divider:             'rgba(255,255,255,0.06)',

  // Tiers
  tierFree:            '#888780',
  tierPlus:            '#818CF8',
  tierClub:            '#F59E0B',

  // Sport categories
  padelColor:          '#10B981',
  fifaColor:           '#6366F1',

  // Static
  white:               '#FFFFFF',
  black:               '#000000',
  transparent:         'transparent',
} as const;

// ─── Light Mode Fallback ────
export const lightColors = {
  background:          '#F8F8FF',
  backgroundElevated:  '#FFFFFF',
  backgroundCard:      '#FFFFFF',
  backgroundInput:     '#F1F1F8',
  backgroundOverlay:   'rgba(10,10,20,0.5)',
  primary:             '#4F46E5',
  primaryLight:        '#6366F1',
  primaryDark:         '#3730A3',
  primaryBg:           'rgba(79,70,229,0.08)',
  gold:                '#D97706',
  goldLight:           '#F59E0B',
  goldBg:              'rgba(217,119,6,0.08)',
  danger:              '#EF4444',
  dangerBg:            'rgba(239,68,68,0.08)',
  success:             '#059669',
  successBg:           'rgba(5,150,105,0.08)',
  warning:             '#D97706',
  warningBg:           'rgba(217,119,6,0.08)',
  textPrimary:         '#0A0A14',
  textSecondary:       'rgba(10,10,20,0.6)',
  textTertiary:        'rgba(10,10,20,0.35)',
  textDisabled:        'rgba(10,10,20,0.2)',
  border:              'rgba(10,10,20,0.08)',
  borderStrong:        'rgba(10,10,20,0.15)',
  borderPrimary:       'rgba(79,70,229,0.3)',
  divider:             'rgba(10,10,20,0.06)',
  tierFree:            '#6B7280',
  tierPlus:            '#4F46E5',
  tierClub:            '#D97706',
  padelColor:          '#059669',
  fifaColor:           '#4F46E5',
  white:               '#FFFFFF',
  black:               '#000000',
  transparent:         'transparent',
} as const;

// ─── Default: Night Court (Dark Mode First) ────
export const colors = nightCourtColors;
export default colors;

// ============================================
// Legacy compatibility layer
// All existing call sites use getColors(scheme)/useAppColors() with token
// names like primary/textPrimary/border/cardBg/surface/etc. We map every
// legacy field to the Night Court palette so screens auto-adopt the new
// theme without per-file edits.
// ============================================

// Brand palette – legacy "teal" namespace remapped to Indigo so any
// remaining `brand.teal[X]` references render in the new color.
export const brand = {
  teal: {
    50:  'rgba(99,102,241,0.05)',
    100: 'rgba(99,102,241,0.10)',
    200: 'rgba(99,102,241,0.20)',
    300: 'rgba(99,102,241,0.30)',
    400: '#A5B4FC',
    500: '#818CF8',
    600: '#6366F1',
    700: '#4F46E5',
    800: '#4338CA',
    900: '#3730A3',
  },
  indigo: {
    50:  'rgba(99,102,241,0.05)',
    100: 'rgba(99,102,241,0.10)',
    200: 'rgba(99,102,241,0.20)',
    300: 'rgba(99,102,241,0.30)',
    400: '#A5B4FC',
    500: '#818CF8',
    600: '#6366F1',
    700: '#4F46E5',
    800: '#4338CA',
    900: '#3730A3',
  },
  coral: {
    50:  'rgba(255,71,87,0.05)',
    100: 'rgba(255,71,87,0.10)',
    200: 'rgba(255,71,87,0.20)',
    300: 'rgba(255,71,87,0.30)',
    400: '#FF6B7A',
    500: '#FF4757',
    600: '#E63946',
    700: '#C9303E',
    800: '#A82632',
    900: '#7D1B25',
  },
  gold: {
    50:  'rgba(245,158,11,0.05)',
    100: 'rgba(245,158,11,0.10)',
    200: 'rgba(245,158,11,0.20)',
    300: 'rgba(245,158,11,0.30)',
    400: '#FCD34D',
    500: '#F59E0B',
    600: '#D97706',
    700: '#B45309',
    800: '#92400E',
    900: '#78350F',
  },
} as const;

// Neutral – mapped to dark-on-dark hierarchy for Night Court
export const neutral = {
  0:   '#FFFFFF',
  50:  '#F8F8FF',
  100: 'rgba(255,255,255,0.92)',
  150: 'rgba(255,255,255,0.85)',
  200: 'rgba(255,255,255,0.75)',
  300: 'rgba(255,255,255,0.6)',
  400: 'rgba(255,255,255,0.45)',
  500: 'rgba(255,255,255,0.35)',
  600: 'rgba(255,255,255,0.25)',
  700: 'rgba(255,255,255,0.15)',
  800: 'rgba(255,255,255,0.08)',
  850: '#16162A',
  900: '#111127',
  950: '#0A0A14',
} as const;

export const membership = {
  free:      '#888780',
  plus:      '#818CF8',
  plusLight: 'rgba(129,140,248,0.15)',
  plusDark:  '#4F46E5',
  club:      '#F59E0B',
  clubLight: 'rgba(245,158,11,0.15)',
  clubDark:  '#B45309',
} as const;

export const semantic = {
  success: { light: '#10B981', dark: '#10B981', bg_light: 'rgba(16,185,129,0.12)', bg_dark: 'rgba(16,185,129,0.12)' },
  warning: { light: '#F59E0B', dark: '#F59E0B', bg_light: 'rgba(245,158,11,0.12)', bg_dark: 'rgba(245,158,11,0.12)' },
  error:   { light: '#FF4757', dark: '#FF4757', bg_light: 'rgba(255,71,87,0.12)', bg_dark: 'rgba(255,71,87,0.12)' },
  info:    { light: '#6366F1', dark: '#818CF8', bg_light: 'rgba(99,102,241,0.12)', bg_dark: 'rgba(99,102,241,0.12)' },
} as const;

// ============================================
// Theme Tokens – Night Court (default / dark)
// Every legacy token name now points at Night Court values so existing
// screens render dark-mode-first without edits.
// ============================================
const darkTokens = {
  // Backgrounds
  bg:           '#0A0A14',
  bgSecondary:  '#0D0D1A',
  bgTertiary:   '#111127',
  bgElevated:   '#0D0D1A',
  bgInverse:    '#FFFFFF',

  // Surfaces (cards, sheets)
  surface:          '#111127',
  surfaceSecondary: '#16162A',
  surfaceHover:     '#1A1A33',
  surfacePressed:   '#1F1F3D',

  // Text
  textPrimary:   '#FFFFFF',
  textSecondary: 'rgba(255,255,255,0.6)',
  textTertiary:  'rgba(255,255,255,0.35)',
  textInverse:   '#0A0A14',
  textLink:      '#818CF8',

  // Borders
  border:       'rgba(255,255,255,0.08)',
  borderLight:  'rgba(255,255,255,0.06)',
  borderFocus:  '#6366F1',
  divider:      'rgba(255,255,255,0.06)',

  // Brand
  primary:       '#6366F1',
  primaryLight:  'rgba(99,102,241,0.12)',
  primaryDark:   '#4F46E5',
  accent:        '#F59E0B',
  accentLight:   'rgba(245,158,11,0.12)',

  // Status
  success:   '#10B981',
  successBg: 'rgba(16,185,129,0.12)',
  warning:   '#F59E0B',
  warningBg: 'rgba(245,158,11,0.12)',
  error:     '#FF4757',
  errorBg:   'rgba(255,71,87,0.12)',
  info:      '#818CF8',
  infoBg:    'rgba(99,102,241,0.12)',

  // Overlays
  overlay:      'rgba(10,10,20,0.7)',
  overlayHeavy: 'rgba(10,10,20,0.9)',
  shimmer:      'rgba(255,255,255,0.06)',

  // Tab bar
  tabBar:       '#0A0A14',
  tabBarBorder: 'rgba(255,255,255,0.08)',

  // Shadows – flat in dark mode
  shadowColor:   '#000000',
  shadowOpacity: 0,

  // Card
  cardBg:             '#111127',
  cardBorder:         'rgba(255,255,255,0.08)',
  cardShadowOpacity:  0,
} as const;

// ============================================
// Theme Tokens – Light Mode (fallback)
// ============================================
const lightTokens = {
  bg:           '#F8F8FF',
  bgSecondary:  '#FFFFFF',
  bgTertiary:   '#F1F1F8',
  bgElevated:   '#FFFFFF',
  bgInverse:    '#0A0A14',

  surface:          '#FFFFFF',
  surfaceSecondary: '#F1F1F8',
  surfaceHover:     '#EAEAF2',
  surfacePressed:   '#DDDDE8',

  textPrimary:   '#0A0A14',
  textSecondary: 'rgba(10,10,20,0.6)',
  textTertiary:  'rgba(10,10,20,0.4)',
  textInverse:   '#FFFFFF',
  textLink:      '#4F46E5',

  border:       'rgba(10,10,20,0.08)',
  borderLight:  'rgba(10,10,20,0.05)',
  borderFocus:  '#4F46E5',
  divider:      'rgba(10,10,20,0.06)',

  primary:       '#4F46E5',
  primaryLight:  'rgba(79,70,229,0.08)',
  primaryDark:   '#3730A3',
  accent:        '#D97706',
  accentLight:   'rgba(217,119,6,0.08)',

  success:   '#059669',
  successBg: 'rgba(5,150,105,0.08)',
  warning:   '#D97706',
  warningBg: 'rgba(217,119,6,0.08)',
  error:     '#EF4444',
  errorBg:   'rgba(239,68,68,0.08)',
  info:      '#4F46E5',
  infoBg:    'rgba(79,70,229,0.08)',

  overlay:      'rgba(10,10,20,0.4)',
  overlayHeavy: 'rgba(10,10,20,0.6)',
  shimmer:      'rgba(10,10,20,0.06)',

  tabBar:       'rgba(255,255,255,0.96)',
  tabBarBorder: 'rgba(10,10,20,0.08)',

  shadowColor:   '#000000',
  shadowOpacity: 0.06,

  cardBg:            '#FFFFFF',
  cardBorder:        'rgba(10,10,20,0.06)',
  cardShadowOpacity: 0.06,
} as const;

export type ColorScheme = 'light' | 'dark';
export type ThemeTokens = {
  [K in keyof typeof darkTokens]: (typeof darkTokens)[K] | (typeof lightTokens)[K];
};

// Default to Night Court (dark) regardless of unknown schemes
export const getTheme = (scheme: ColorScheme): ThemeTokens => {
  return scheme === 'light' ? lightTokens : darkTokens;
};

// Convenience: full color access
export const getColors = (scheme: ColorScheme) => ({
  ...getTheme(scheme),
  brand,
  neutral,
  membership,
  semantic,
  white: '#FFFFFF' as const,
  black: '#000000' as const,
  // Night Court raw palette (always dark) — for direct access where needed
  nightCourt: nightCourtColors,
});

export type Colors = ReturnType<typeof getColors>;
