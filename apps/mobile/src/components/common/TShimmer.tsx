import React, { useEffect, useRef } from 'react';
import { Animated, ViewStyle } from 'react-native';
import { useTheme } from '../../providers/ThemeProvider';

// ============================================
// TURNEO – TShimmer
// Universal skeleton shimmer block.
// Uses React Native Animated API (opacity pulse).
// ============================================

interface TShimmerProps {
  width: number | string;
  height: number;
  borderRadius?: number;
  style?: ViewStyle;
}

export function TShimmer({ width, height, borderRadius = 8, style }: TShimmerProps) {
  const { colors } = useTheme();
  const opacity = useRef(new Animated.Value(0.3)).current;

  useEffect(() => {
    const pulse = Animated.loop(
      Animated.sequence([
        Animated.timing(opacity, {
          toValue: 0.7,
          duration: 600,
          useNativeDriver: true,
        }),
        Animated.timing(opacity, {
          toValue: 0.3,
          duration: 600,
          useNativeDriver: true,
        }),
      ])
    );
    pulse.start();
    return () => pulse.stop();
  }, [opacity]);

  // Prefer `colors.shimmer` when available, fall back to `colors.surfaceSecondary`
  const bgColor = (colors as any).shimmer ?? colors.surfaceSecondary;

  return (
    <Animated.View
      style={[
        {
          width: width as any,
          height,
          borderRadius,
          backgroundColor: bgColor,
          opacity,
        },
        style,
      ]}
    />
  );
}
