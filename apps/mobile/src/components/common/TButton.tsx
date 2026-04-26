import React, { useRef } from 'react';
import {
  Animated,
  Pressable,
  Text,
  StyleSheet,
  ActivityIndicator,
  ViewStyle,
  TextStyle,
  View,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import * as Haptics from 'expo-haptics';
import { useTheme } from '../../providers/ThemeProvider';
import { spacing } from '../../theme/spacing';
import { fontFamily } from '../../theme/typography';

type ButtonVariant = 'primary' | 'secondary' | 'outline' | 'ghost' | 'danger' | 'gold';
type ButtonSize = 'sm' | 'md' | 'lg';

interface TButtonProps {
  title: string;
  onPress: () => void;
  variant?: ButtonVariant;
  size?: ButtonSize;
  disabled?: boolean;
  loading?: boolean;
  icon?: React.ReactNode;
  iconPosition?: 'left' | 'right';
  fullWidth?: boolean;
  style?: ViewStyle;
  textStyle?: TextStyle;
}

const SIZES: Record<ButtonSize, { height: number; paddingHorizontal: number; fontSize: number }> = {
  sm: { height: 36, paddingHorizontal: spacing.md, fontSize: 13 },
  md: { height: 48, paddingHorizontal: spacing.lg, fontSize: 14.5 },
  lg: { height: 54, paddingHorizontal: spacing.xl, fontSize: 16 },
};

/**
 * Night Court button — gradient + indigo glow for primary, gold gradient
 * for "gold", surface fill for secondary, transparent border for outline /
 * ghost.  Press-in scales the button to 0.97 with a spring.
 */
export const TButton: React.FC<TButtonProps> = ({
  title,
  onPress,
  variant = 'primary',
  size = 'md',
  disabled = false,
  loading = false,
  icon,
  iconPosition = 'left',
  fullWidth = true,
  style,
  textStyle,
}) => {
  const { colors } = useTheme();
  const scale = useRef(new Animated.Value(1)).current;
  const sz = SIZES[size];

  const handlePress = () => {
    if (disabled || loading) return;
    Haptics.impactAsync(
      variant === 'primary' || variant === 'gold'
        ? Haptics.ImpactFeedbackStyle.Medium
        : Haptics.ImpactFeedbackStyle.Light
    ).catch(() => {});
    onPress();
  };

  const pressIn = () =>
    Animated.spring(scale, { toValue: 0.97, useNativeDriver: true, friction: 6, tension: 200 }).start();
  const pressOut = () =>
    Animated.spring(scale, { toValue: 1, useNativeDriver: true, friction: 5, tension: 200 }).start();

  const palette = paletteFor(variant, colors);
  const useGradient = variant === 'primary' || variant === 'gold';

  return (
    <Animated.View style={[fullWidth && { width: '100%' }, { transform: [{ scale }] }, style]}>
      <Pressable
        onPress={handlePress}
        onPressIn={pressIn}
        onPressOut={pressOut}
        disabled={disabled || loading}
        style={[
          styles.btn,
          {
            height: sz.height,
            paddingHorizontal: sz.paddingHorizontal,
            backgroundColor: useGradient ? 'transparent' : palette.bg,
            borderColor: palette.border,
            borderWidth: variant === 'outline' || variant === 'ghost' || variant === 'secondary' ? 1 : 0,
            opacity: disabled ? 0.5 : 1,
            ...(variant === 'primary'
              ? {
                  shadowColor: '#6366F1',
                  shadowOpacity: 0.35,
                  shadowRadius: 24,
                  shadowOffset: { width: 0, height: 10 },
                  elevation: 12,
                }
              : null),
            ...(variant === 'gold'
              ? {
                  shadowColor: '#F59E0B',
                  shadowOpacity: 0.4,
                  shadowRadius: 24,
                  shadowOffset: { width: 0, height: 10 },
                  elevation: 12,
                }
              : null),
          },
        ]}
      >
        {useGradient ? (
          <LinearGradient
            colors={
              variant === 'primary'
                ? ['#6366F1', '#4F46E5']
                : ['#FCD34D', '#F59E0B']
            }
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 1 }}
            style={StyleSheet.absoluteFill}
          />
        ) : null}

        {loading ? (
          <ActivityIndicator color={palette.fg} size="small" />
        ) : (
          <View style={styles.row}>
            {icon && iconPosition === 'left' ? <View>{icon}</View> : null}
            <Text
              style={[
                {
                  color: palette.fg,
                  fontFamily: fontFamily.uiSemibold,
                  fontWeight: '600' as const,
                  fontSize: sz.fontSize,
                  letterSpacing: -0.1,
                },
                textStyle,
              ]}
            >
              {title}
            </Text>
            {icon && iconPosition === 'right' ? <View>{icon}</View> : null}
          </View>
        )}
      </Pressable>
    </Animated.View>
  );
};

function paletteFor(v: ButtonVariant, colors: any): { bg: string; fg: string; border: string } {
  switch (v) {
    case 'primary':
      return { bg: '#6366F1', fg: '#FFFFFF', border: 'transparent' };
    case 'gold':
      return { bg: '#F59E0B', fg: '#1A120B', border: 'transparent' };
    case 'secondary':
      return { bg: colors.surface, fg: colors.textPrimary, border: 'rgba(255,255,255,0.15)' };
    case 'outline':
      return { bg: 'transparent', fg: colors.textPrimary, border: 'rgba(255,255,255,0.15)' };
    case 'ghost':
      return { bg: 'transparent', fg: colors.textPrimary, border: 'rgba(255,255,255,0.08)' };
    case 'danger':
      return { bg: colors.errorBg, fg: colors.error, border: colors.error + '4D' };
  }
}

const styles = StyleSheet.create({
  btn: {
    borderRadius: 14,
    alignItems: 'center',
    justifyContent: 'center',
    overflow: 'hidden',
  },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
  },
});
