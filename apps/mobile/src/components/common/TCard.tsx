import React from 'react';
import { View, StyleSheet, TouchableOpacity, ViewStyle } from 'react-native';
import { useAppColors } from '../../hooks/useColorScheme';
import { spacing, borderRadius, shadows } from '../../theme/spacing';

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
  const colors = useAppColors();

  const getCardStyle = (): ViewStyle => {
    const base: ViewStyle = {
      backgroundColor: colors.neutral[50],
      borderRadius: borderRadius.lg,
      padding: spacing[padding],
    };

    switch (variant) {
      case 'elevated':
        return { ...base, ...shadows.md };
      case 'outlined':
        return { ...base, borderWidth: 1, borderColor: colors.neutral[200] };
      default:
        return { ...base, ...shadows.sm };
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

const styles = StyleSheet.create({});