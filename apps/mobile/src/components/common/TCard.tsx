import React from 'react';
import { View, StyleSheet, TouchableOpacity, ViewStyle } from 'react-native';
import { useTheme } from '../../providers/ThemeProvider';
import { spacing, radius, shadow } from '../../theme/spacing';

interface TCardProps {
  children: React.ReactNode;
  onPress?: () => void;
  variant?: 'default' | 'elevated' | 'outlined';
  padding?: keyof typeof spacing;
  style?: ViewStyle;
}

export const TCard: React.FC<TCardProps> = ({
  children,
  onPress,
  variant = 'default',
  padding = 'md',
  style,
}) => {
  const { colors } = useTheme();

  const getCardStyle = (): ViewStyle => {
    const base: ViewStyle = {
      backgroundColor: colors.cardBg,
      borderRadius: radius.lg,
      padding: spacing[padding],
    };

    switch (variant) {
      case 'elevated':
        return { ...base, ...shadow.md, shadowColor: colors.shadowColor, shadowOpacity: colors.cardShadowOpacity };
      case 'outlined':
        return { ...base, borderWidth: 1, borderColor: colors.cardBorder };
      default:
        return { ...base, ...shadow.sm, shadowColor: colors.shadowColor, shadowOpacity: colors.cardShadowOpacity };
    }
  };

  if (onPress) {
    return (
      <TouchableOpacity
        onPress={onPress}
        activeOpacity={0.7}
        style={[getCardStyle(), style]}
      >
        {children}
      </TouchableOpacity>
    );
  }

  return <View style={[getCardStyle(), style]}>{children}</View>;
};