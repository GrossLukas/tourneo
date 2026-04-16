import React, { useRef, useCallback } from 'react';
import { View, StyleSheet, Pressable, Animated, ViewStyle } from 'react-native';
import * as Haptics from 'expo-haptics';
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
  const scale = useRef(new Animated.Value(1)).current;

  const getCardStyle = (): ViewStyle => {
    const base: ViewStyle = {
      backgroundColor: '#111127',
      borderRadius: radius.lg,
      padding: spacing[padding],
      borderWidth: StyleSheet.hairlineWidth,
      borderColor: 'rgba(255,255,255,0.08)',
    };

    switch (variant) {
      case 'elevated':
        return { ...base, borderColor: 'rgba(99,102,241,0.2)' };
      case 'outlined':
        return { ...base, borderColor: 'rgba(255,255,255,0.12)' };
      default:
        return base;
    }
  };

  const handlePressIn = useCallback(() => {
    Animated.spring(scale, {
      toValue: 0.97,
      useNativeDriver: true,
      tension: 150,
      friction: 8,
    }).start();
  }, [scale]);

  const handlePressOut = useCallback(() => {
    Animated.spring(scale, {
      toValue: 1,
      useNativeDriver: true,
      tension: 150,
      friction: 8,
    }).start();
  }, [scale]);

  const handlePress = useCallback(() => {
    Haptics.selectionAsync();
    onPress?.();
  }, [onPress]);

  if (onPress) {
    return (
      <Pressable
        onPress={handlePress}
        onPressIn={handlePressIn}
        onPressOut={handlePressOut}
      >
        <Animated.View style={[getCardStyle(), style, { transform: [{ scale }] }]}>
          {children}
        </Animated.View>
      </Pressable>
    );
  }

  return <View style={[getCardStyle(), style]}>{children}</View>;
};
