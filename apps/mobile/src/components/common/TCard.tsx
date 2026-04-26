import React, { useRef, useCallback } from 'react';
import { View, StyleSheet, Pressable, Animated, ViewStyle } from 'react-native';
import * as Haptics from 'expo-haptics';
import { useTheme } from '../../providers/ThemeProvider';
import { spacing } from '../../theme/spacing';

interface TCardProps {
  children: React.ReactNode;
  onPress?: () => void;
  variant?: 'default' | 'elevated' | 'outlined';
  padding?: keyof typeof spacing;
  style?: ViewStyle;
}

/**
 * Night Court card.  18 px radius, 1 px border, dark surface.  `elevated`
 * adds a subtle indigo halo via shadow / border tint.
 */
export const TCard: React.FC<TCardProps> = ({
  children,
  onPress,
  variant = 'default',
  padding = 'lg',
  style,
}) => {
  const { colors } = useTheme();
  const scale = useRef(new Animated.Value(1)).current;

  const getCardStyle = (): ViewStyle => {
    const base: ViewStyle = {
      backgroundColor: colors.surface,
      borderRadius: 18,
      padding: spacing[padding],
      borderWidth: 1,
      borderColor: colors.border,
      overflow: 'hidden',
    };

    if (variant === 'elevated') {
      return {
        ...base,
        shadowColor: '#6366F1',
        shadowOpacity: 0.35,
        shadowRadius: 24,
        shadowOffset: { width: 0, height: 10 },
        elevation: 12,
      };
    }
    if (variant === 'outlined') {
      return { ...base, borderColor: colors.borderFocus + '4D' };
    }
    return base;
  };

  const handlePressIn = useCallback(() => {
    Animated.spring(scale, {
      toValue: 0.97,
      useNativeDriver: true,
      tension: 200,
      friction: 6,
    }).start();
  }, [scale]);

  const handlePressOut = useCallback(() => {
    Animated.spring(scale, {
      toValue: 1,
      useNativeDriver: true,
      tension: 200,
      friction: 5,
    }).start();
  }, [scale]);

  const handlePress = useCallback(() => {
    Haptics.selectionAsync().catch(() => {});
    onPress?.();
  }, [onPress]);

  if (onPress) {
    return (
      <Pressable onPress={handlePress} onPressIn={handlePressIn} onPressOut={handlePressOut}>
        <Animated.View style={[getCardStyle(), style, { transform: [{ scale }] }]}>
          {children}
        </Animated.View>
      </Pressable>
    );
  }

  return <View style={[getCardStyle(), style]}>{children}</View>;
};
