import React from 'react';
import { View, Text, StyleSheet, ViewStyle } from 'react-native';
import { useAppColors } from '../../hooks/useColorScheme';
import { spacing, fontSize, fontWeight, borderRadius } from '../../theme/spacing';

type BadgeVariant = 'default' | 'success' | 'warning' | 'error' | 'info' | 'membership';
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
  const colors = useAppColors();

  const getColors = (): { bg: string; text: string } => {
    if (variant === 'membership' && membershipTier) {
      switch (membershipTier) {
        case 'plus':
          return { bg: colors.membership.plus + '20', text: colors.membership.plus };
        case 'club':
          return { bg: colors.membership.club + '20', text: colors.membership.club };
        default:
          return { bg: colors.neutral[200], text: colors.neutral[600] };
      }
    }

    switch (variant) {
      case 'success':
        return { bg: colors.status.success + '20', text: colors.status.success };
      case 'warning':
        return { bg: colors.status.warning + '20', text: colors.status.warning };
      case 'error':
        return { bg: colors.status.error + '20', text: colors.status.error };
      case 'info':
        return { bg: colors.primary[100], text: colors.primary[700] };
      default:
        return { bg: colors.neutral[200], text: colors.neutral[700] };
    }
  };

  const { bg, text } = getColors();
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
    borderRadius: borderRadius.full,
    alignSelf: 'flex-start',
  },
  text: {
    fontWeight: fontWeight.semibold as any,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
});