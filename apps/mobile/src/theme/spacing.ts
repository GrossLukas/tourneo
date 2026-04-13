// ============================================
// TURNEO - Spacing & Layout System
// Based on 4pt grid
// ============================================

export const spacing = {
  xxs: 2,
  xs: 4,
  sm: 8,
  md: 12,
  lg: 16,
  xl: 20,
  xxl: 28,
  '2xl': 24,
  '3xl': 32,
  '4xl': 40,
  '5xl': 48,
  '6xl': 64,
} as const;

export const borderRadius = {
  xs: 4,
  sm: 6,
  md: 8,
  lg: 10,
  xl: 12,
  '2xl': 16,
  '3xl': 20,
  full: 9999,
} as const;

export const fontSize = {
  xxs: 9,
  xs: 11,
  sm: 13,
  base: 15,
  md: 17,
  lg: 20,
  xl: 22,
  xxl: 26,
  '2xl': 28,
  '3xl': 34,
} as const;

export const fontWeight = {
  light: '300' as const,
  regular: '400' as const,
  medium: '500' as const,
  semibold: '600' as const,
  bold: '700' as const,
};

export const shadows = {
  sm: {
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.06,
    shadowRadius: 2,
    elevation: 1,
  },
  md: {
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.08,
    shadowRadius: 4,
    elevation: 3,
  },
  lg: {
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.1,
    shadowRadius: 12,
    elevation: 5,
  },
  xl: {
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.16,
    shadowRadius: 32,
    elevation: 8,
  },
};

export const layout = {
  screenPadding: spacing.lg,
  cardPadding: spacing.lg,
  sectionSpacing: spacing['2xl'],
  inputHeight: 48,
  buttonHeight: 50,
  buttonHeightSm: 40,
  tabBarHeight: 84,
  headerHeight: 56,
};