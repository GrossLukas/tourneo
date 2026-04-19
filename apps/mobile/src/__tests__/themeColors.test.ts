import { getColors, getTheme, nightCourtColors, lightColors } from '../theme/colors';

describe('Theme Colors', () => {
  describe('nightCourtColors', () => {
    it('has all required background colors', () => {
      expect(nightCourtColors.background).toBe('#0A0A14');
      expect(nightCourtColors.backgroundElevated).toBe('#0D0D1A');
      expect(nightCourtColors.backgroundCard).toBe('#111127');
    });

    it('has primary color palette', () => {
      expect(nightCourtColors.primary).toBe('#6366F1');
      expect(nightCourtColors.primaryLight).toBe('#818CF8');
      expect(nightCourtColors.primaryDark).toBe('#4F46E5');
    });

    it('has semantic colors', () => {
      expect(nightCourtColors.success).toBe('#10B981');
      expect(nightCourtColors.danger).toBe('#FF4757');
      expect(nightCourtColors.warning).toBe('#F59E0B');
    });
  });

  describe('getTheme', () => {
    it('returns dark tokens for dark scheme', () => {
      const theme = getTheme('dark');
      expect(theme.bg).toBe('#0A0A14');
      expect(theme.textPrimary).toBe('#FFFFFF');
      expect(theme.primary).toBe('#6366F1');
    });

    it('returns light tokens for light scheme', () => {
      const theme = getTheme('light');
      expect(theme.bg).toBe('#F8F8FF');
      expect(theme.textPrimary).toBe('#0A0A14');
      expect(theme.primary).toBe('#4F46E5');
    });
  });

  describe('getColors', () => {
    it('includes theme tokens and brand palette', () => {
      const colors = getColors('dark');
      expect(colors.primary).toBe('#6366F1');
      expect(colors.brand).toBeDefined();
      expect(colors.membership).toBeDefined();
      expect(colors.semantic).toBeDefined();
      expect(colors.white).toBe('#FFFFFF');
      expect(colors.black).toBe('#000000');
    });

    it('includes nightCourt raw palette', () => {
      const colors = getColors('dark');
      expect(colors.nightCourt.primary).toBe('#6366F1');
    });

    it('has all required token keys for dark mode', () => {
      const colors = getColors('dark');
      const requiredKeys = [
        'bg', 'surface', 'textPrimary', 'textSecondary', 'textTertiary',
        'primary', 'error', 'success', 'warning', 'border', 'divider',
        'tabBar', 'tabBarBorder', 'cardBg', 'cardBorder',
      ];
      for (const key of requiredKeys) {
        expect(colors).toHaveProperty(key);
      }
    });

    it('has all required token keys for light mode', () => {
      const colors = getColors('light');
      const requiredKeys = [
        'bg', 'surface', 'textPrimary', 'textSecondary', 'textTertiary',
        'primary', 'error', 'success', 'warning', 'border', 'divider',
        'tabBar', 'tabBarBorder', 'cardBg', 'cardBorder',
      ];
      for (const key of requiredKeys) {
        expect(colors).toHaveProperty(key);
      }
    });
  });

  describe('light vs dark consistency', () => {
    it('both modes have the same keys', () => {
      const darkColors = getColors('dark');
      const lightColors = getColors('light');
      const darkKeys = Object.keys(darkColors).sort();
      const lightKeys = Object.keys(lightColors).sort();
      expect(darkKeys).toEqual(lightKeys);
    });
  });
});
