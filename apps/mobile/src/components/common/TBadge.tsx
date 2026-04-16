import React from 'react';
import { View, Text, StyleSheet, ViewStyle } from 'react-native';
import { useTheme } from '../../providers/ThemeProvider';
import { spacing, fontSize, fontWeight, radius } from '../../theme/spacing';

type BadgeVariant = 'default' | 'success' | 'warning' | 'error' | 'info' | 'membership' | 'live' | 'prize';
type BadgeSize = 'sm' | 'md';

interface TBadgeProps {
  label: string;
  variant?: BadgeVariant;
  size?: BadgeSize;
  membershipTier?: 'free' | 'plus' | 'club';
  style?: ViewStyle;
}

export const TBadge: React.FC<TBadgeProps> = ({
  label,
  variant = 'default',
  size = 'sm',
  membershipTier,
  style,
}) => {
  const { colors } = useTheme();

  const getBadgeColors = (): { bg: string; text: string } => {
    if (variant === 'membership' && membershipTier) {
      switch (membershipTier) {
        case 'plus':
          return { bg: colors.membership.plusLight, text: colors.membership.plus };
        case 'club':
          return { bg: colors.membership.clubLight, text: colors.membership.club };
        default:
          return { bg: colors.surfaceSecondary, text: colors.textSecondary };
      }
    }

    switch (variant) {
      case 'success':
        return { bg: colors.successBg, text: colors.success };
      case 'warning':
        return { bg: colors.warningBg, text: colors.warning };
      case 'error':
        return { bg: colors.errorBg, text: colors.error };
      case 'info':
        return { bg: colors.infoBg, text: colors.info };
      case 'live':
        return { bg: colors.error, text: colors.white };
      case 'prize':
        return { bg: colors.accent, text: '#1A1000' };
      default:
        return { bg: colors.surfaceSecondary, text: colors.textSecondary };
    }
  };

  const { bg, text } = getBadgeColors();
  const isSmall = size === 'sm';

  return (
    <View
      style={[
        styles.badge,
        {
          backgroundColor: bg,
          paddingHorizontal: isSmall ? spacing.sm : spacing.md,
          paddingVertical: isSmall ? 2 : spacing.xxs,
        },
        style,
      ]}
    >
      <Text
        style={[
          styles.text,
          {
            color: text,
            fontSize: isSmall ? fontSize.xxs : fontSize.xs,
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
    borderRadius: radius.full,
    alignSelf: 'flex-start',
  },
  text: {
    fontWeight: fontWeight.semibold as any,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
});