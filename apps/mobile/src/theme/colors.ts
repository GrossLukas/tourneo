// ============================================
// TURNEO – Premium Design System 2026
// Color Tokens for Light & Dark Mode
// ============================================

// Brand Colors (constant across modes)
export const brand = {
  teal: {
    50: '#E6F7F8',
    100: '#B3E8EC',
    200: '#80D9E0',
    300: '#4DCAD4',
    400: '#26BEC9',
    500: '#0A7E8C',
    600: '#086E7A',
    700: '#065B66',
    800: '#044952',
    900: '#02333A',
  },
  coral: {
    50: '#FDF0ED',
    100: '#F9D4CC',
    200: '#F4B5A8',
    300: '#EF9684',
    400: '#EB7D6A',
    500: '#E8654A',
    600: '#D5533A',
    700: '#B8422E',
    800: '#9A3323',
    900: '#7D2519',
  },
} as const;

// Neutral palette
export const neutral = {
  0: '#FFFFFF',
  50: '#FAFBFC',
  100: '#F3F4F6',
  150: '#EBEDF0',
  200: '#E5E7EB',
  300: '#D1D5DB',
  400: '#9CA3AF',
  500: '#6B7280',
  600: '#4B5563',
  700: '#374151',
  800: '#1F2937',
  850: '#1A1F2B',
  900: '#111827',
  950: '#0B0F19',
} as const;

// Membership tier colors
export const membership = {
  free: '#6B7280',
  plus: '#7C3AED',
  plusLight: '#EDE9FE',
  plusDark: '#4C1D95',
  club: '#D97706',
  clubLight: '#FEF3C7',
  clubDark: '#92400E',
} as const;

// Status / semantic colors
export const semantic = {
  success: { light: '#059669', dark: '#34D399', bg_light: '#ECFDF5', bg_dark: 'rgba(52,211,153,0.12)' },
  warning: { light: '#D97706', dark: '#FBBF24', bg_light: '#FFFBEB', bg_dark: 'rgba(251,191,36,0.12)' },
  error: { light: '#DC2626', dark: '#F87171', bg_light: '#FEF2F2', bg_dark: 'rgba(248,113,113,0.12)' },
  info: { light: '#2563EB', dark: '#60A5FA', bg_light: '#EFF6FF', bg_dark: 'rgba(96,165,250,0.12)' },
} as const;

// ============================================
// Theme Tokens – Light Mode
// ============================================
const lightTokens = {
  // Backgrounds
  bg: '#FFFFFF',
  bgSecondary: '#F7F8FA',
  bgTertiary: '#F0F1F3',
  bgElevated: '#FFFFFF',
  bgInverse: '#111827',

  // Surfaces (cards, sheets)
  surface: '#FFFFFF',
  surfaceSecondary: '#F7F8FA',
  surfaceHover: '#F3F4F6',
  surfacePressed: '#E5E7EB',

  // Text
  textPrimary: '#111827',
  textSecondary: '#4B5563',
  textTertiary: '#9CA3AF',
  textInverse: '#FFFFFF',
  textLink: '#0A7E8C',

  // Borders
  border: '#E5E7EB',
  borderLight: '#F3F4F6',
  borderFocus: '#0A7E8C',
  divider: '#F0F1F3',

  // Brand
  primary: '#0A7E8C',
  primaryLight: '#E6F7F8',
  primaryDark: '#065B66',
  accent: '#E8654A',
  accentLight: '#FDF0ED',

  // Status
  success: '#059669',
  successBg: '#ECFDF5',
  warning: '#D97706',
  warningBg: '#FFFBEB',
  error: '#DC2626',
  errorBg: '#FEF2F2',
  info: '#2563EB',
  infoBg: '#EFF6FF',

  // Overlays
  overlay: 'rgba(0,0,0,0.4)',
  overlayHeavy: 'rgba(0,0,0,0.6)',
  shimmer: '#F3F4F6',

  // Tab bar
  tabBar: 'rgba(255,255,255,0.92)',
  tabBarBorder: '#E5E7EB',

  // Shadows
  shadowColor: '#000000',
  shadowOpacity: 0.06,

  // Card
  cardBg: '#FFFFFF',
  cardBorder: '#F0F1F3',
  cardShadowOpacity: 0.08,
} as const;

// ============================================
// Theme Tokens – Dark Mode
// ============================================
const darkTokens = {
  // Backgrounds
  bg: '#0B0F19',
  bgSecondary: '#111827',
  bgTertiary: '#1A1F2B',
  bgElevated: '#1A1F2B',
  bgInverse: '#FFFFFF',

  // Surfaces (cards, sheets) – deep grays, NOT pure black
  surface: '#161B26',
  surfaceSecondary: '#1E2433',
  surfaceHover: '#242B3D',
  surfacePressed: '#2A3349',

  // Text
  textPrimary: '#F0F2F5',
  textSecondary: '#9CA3AF',
  textTertiary: '#6B7280',
  textInverse: '#111827',
  textLink: '#26BEC9',

  // Borders
  border: '#2A3349',
  borderLight: '#1E2433',
  borderFocus: '#26BEC9',
  divider: '#1E2433',

  // Brand
  primary: '#26BEC9',
  primaryLight: 'rgba(38,190,201,0.12)',
  primaryDark: '#0A7E8C',
  accent: '#EB7D6A',
  accentLight: 'rgba(235,125,106,0.12)',

  // Status
  success: '#34D399',
  successBg: 'rgba(52,211,153,0.12)',
  warning: '#FBBF24',
  warningBg: 'rgba(251,191,36,0.12)',
  error: '#F87171',
  errorBg: 'rgba(248,113,113,0.12)',
  info: '#60A5FA',
  infoBg: 'rgba(96,165,250,0.12)',

  // Overlays
  overlay: 'rgba(0,0,0,0.6)',
  overlayHeavy: 'rgba(0,0,0,0.8)',
  shimmer: '#1E2433',

  // Tab bar
  tabBar: 'rgba(11,15,25,0.92)',
  tabBarBorder: '#1E2433',

  // Shadows
  shadowColor: '#000000',
  shadowOpacity: 0.3,

  // Card
  cardBg: '#161B26',
  cardBorder: '#2A3349',
  cardShadowOpacity: 0.2,
} as const;

export type ColorScheme = 'light' | 'dark';
export type ThemeTokens = {
  [K in keyof typeof lightTokens]: (typeof lightTokens)[K] | (typeof darkTokens)[K];
};

export const getTheme = (scheme: ColorScheme): ThemeTokens => {
  return scheme === 'dark' ? darkTokens : lightTokens;
};

// Convenience: full color access (tokens + brand + neutral + membership)
export const getColors = (scheme: ColorScheme) => ({
  ...getTheme(scheme),
  brand,
  neutral,
  membership,
  semantic,
  // Palette access (use brand.teal / brand.coral for indexed colors)
  // primary/accent/success/etc are already string tokens from getTheme()
  white: '#FFFFFF' as const,
  black: '#000000' as const,
});

export type Colors = ReturnType<typeof getColors>;