// ============================================
// TURNEO - Color System
// Premium Sports App Design
// ============================================

export const colors = {
  // Primary Brand
  primary: {
    50: '#E6F7F8',
    100: '#B3E8EC',
    200: '#80D9E0',
    300: '#4DCAD4',
    400: '#26BEC9',
    500: '#0A7E8C', // Main brand color - Deep Teal
    600: '#086E7A',
    700: '#065B66',
    800: '#044952',
    900: '#02333A',
  },

  // Secondary / Accent
  secondary: {
    50: '#FDF0ED',
    100: '#F9D4CC',
    200: '#F4B5A8',
    300: '#EF9684',
    400: '#EB7D6A',
    500: '#E8654A', // Warm Coral
    600: '#D5533A',
    700: '#B8422E',
    800: '#9A3323',
    900: '#7D2519',
  },

  // Membership Tiers
  membership: {
    free: '#6B7280',
    plus: '#7C3AED',
    plusLight: '#EDE9FE',
    club: '#D97706',
    clubLight: '#FEF3C7',
  },

  // Status
  success: {
    50: '#ECFDF5',
    100: '#D1FAE5',
    500: '#059669',
    600: '#047857',
    700: '#036B4E',
  },

  warning: {
    50: '#FFFBEB',
    100: '#FEF3C7',
    500: '#D97706',
    600: '#B45309',
  },

  error: {
    50: '#FEF2F2',
    100: '#FEE2E2',
    500: '#DC2626',
    600: '#B91C1C',
  },

  info: {
    50: '#EFF6FF',
    100: '#DBEAFE',
    500: '#2563EB',
    600: '#1D4ED8',
  },

  // Neutrals - Light Mode
  light: {
    background: '#F7F8FA',
    surface: '#FFFFFF',
    surfaceSecondary: '#F1F3F5',
    textPrimary: '#1A1D21',
    textSecondary: '#6B7280',
    textTertiary: '#9CA3AF',
    border: '#E5E7EB',
    borderLight: '#F3F4F6',
    divider: '#F1F3F5',
    overlay: 'rgba(0,0,0,0.5)',
  },

  // Neutrals - Dark Mode
  dark: {
    background: '#0D1117',
    surface: '#161B22',
    surfaceSecondary: '#21262D',
    textPrimary: '#F0F2F5',
    textSecondary: '#8B949E',
    textTertiary: '#6E7681',
    border: '#30363D',
    borderLight: '#21262D',
    divider: '#21262D',
    overlay: 'rgba(0,0,0,0.7)',
  },

  // Absolute
  white: '#FFFFFF',
  black: '#000000',
  transparent: 'transparent',
};

export type ColorScheme = 'light' | 'dark';

export const getColors = (scheme: ColorScheme) => ({
  primary: colors.primary[500],
  primaryLight: colors.primary[100],
  secondary: colors.secondary[500],
  secondaryLight: colors.secondary[100],
  background: scheme === 'light' ? colors.light.background : colors.dark.background,
  surface: scheme === 'light' ? colors.light.surface : colors.dark.surface,
  surfaceSecondary: scheme === 'light' ? colors.light.surfaceSecondary : colors.dark.surfaceSecondary,
  textPrimary: scheme === 'light' ? colors.light.textPrimary : colors.dark.textPrimary,
  textSecondary: scheme === 'light' ? colors.light.textSecondary : colors.dark.textSecondary,
  textTertiary: scheme === 'light' ? colors.light.textTertiary : colors.dark.textTertiary,
  border: scheme === 'light' ? colors.light.border : colors.dark.border,
  borderLight: scheme === 'light' ? colors.light.borderLight : colors.dark.borderLight,
  divider: scheme === 'light' ? colors.light.divider : colors.dark.divider,
  overlay: scheme === 'light' ? colors.light.overlay : colors.dark.overlay,
  success: colors.success[500],
  warning: colors.warning[500],
  error: colors.error[500],
  info: colors.info[500],
  memberFree: colors.membership.free,
  memberPlus: colors.membership.plus,
  memberPlusLight: colors.membership.plusLight,
  memberClub: colors.membership.club,
  memberClubLight: colors.membership.clubLight,
  white: colors.white,
  black: colors.black,
});