import React from 'react';
import { View, Text, StyleSheet, ViewStyle } from 'react-native';
import { useTheme } from '../../providers/ThemeProvider';
import { fontFamily } from '../../theme/typography';

type BadgeVariant = 'default' | 'success' | 'warning' | 'error' | 'info' | 'membership' | 'live' | 'prize';
type BadgeSize = 'sm' | 'md';

interface TBadgeProps {
  label: string;
  variant?: BadgeVariant;
  size?: BadgeSize;
  membershipTier?: 'free' | 'plus' | 'club';
  style?: ViewStyle;
}

/**
 * Night Court pill badge.  10-px uppercase label, rounded-full, subtle
 * tinted background per variant.  Drop-in replacement for legacy `TBadge`
 * call sites — accepts the same props.
 */
export const TBadge: React.FC<TBadgeProps> = ({
  label,
  variant = 'default',
  size = 'sm',
  membershipTier,
  style,
}) => {
  const { colors } = useTheme();

  const palette = (() => {
    if (variant === 'membership' && membershipTier) {
      switch (membershipTier) {
        case 'plus':
          return { bg: 'rgba(129,140,248,0.18)', fg: '#818CF8' };
        case 'club':
          return { bg: 'rgba(245,158,11,0.18)', fg: '#F59E0B' };
        default:
          return { bg: 'rgba(255,255,255,0.08)', fg: colors.textSecondary };
      }
    }
    switch (variant) {
      case 'success': return { bg: colors.successBg, fg: colors.success };
      case 'warning': return { bg: colors.warningBg, fg: colors.warning };
      case 'error':   return { bg: colors.errorBg, fg: colors.error };
      case 'info':    return { bg: colors.infoBg, fg: colors.info };
      case 'live':    return { bg: 'rgba(255,71,87,0.12)', fg: '#FF4757' };
      case 'prize':   return { bg: 'rgba(245,158,11,0.18)', fg: '#F59E0B' };
      default:        return { bg: 'rgba(255,255,255,0.08)', fg: colors.textSecondary };
    }
  })();

  const isSm = size === 'sm';

  return (
    <View
      style={[
        styles.badge,
        {
          backgroundColor: palette.bg,
          paddingHorizontal: isSm ? 9 : 12,
          paddingVertical: isSm ? 5 : 6,
        },
        style,
      ]}
    >
      <Text
        style={[
          styles.text,
          {
            color: palette.fg,
            fontSize: isSm ? 10 : 11,
          },
        ]}
      >
        {label}
      </Text>
    </View>
  );
};

const styles = StyleSheet.create({
  badge: {
    borderRadius: 999,
    alignSelf: 'flex-start',
  },
  text: {
    fontFamily: fontFamily.uiSemibold,
    fontWeight: '700' as const,
    letterSpacing: 0.6,
    textTransform: 'uppercase',
    lineHeight: 12,
  },
});
