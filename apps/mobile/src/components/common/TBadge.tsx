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
          return { bg: 'rgba(129,140,248,0.15)', text: '#818CF8' };
        case 'club':
          return { bg: 'rgba(245,158,11,0.15)', text: '#F59E0B' };
        default:
          return { bg: '#16162A', text: 'rgba(255,255,255,0.6)' };
      }
    }

    switch (variant) {
      case 'success':
        return { bg: 'rgba(16,185,129,0.12)', text: '#10B981' };
      case 'warning':
        return { bg: 'rgba(245,158,11,0.12)', text: '#F59E0B' };
      case 'error':
        return { bg: 'rgba(255,71,87,0.12)', text: '#FF4757' };
      case 'info':
        return { bg: 'rgba(99,102,241,0.12)', text: '#818CF8' };
      case 'live':
        return { bg: '#FF4757', text: '#FFFFFF' };
      case 'prize':
        return { bg: '#F59E0B', text: '#1A1000' };
      default:
        return { bg: '#16162A', text: 'rgba(255,255,255,0.6)' };
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