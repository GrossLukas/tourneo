/**
 * Night Court button.  Variants:
 *   primary    – indigo gradient + glow
 *   secondary  – bgCard + strong border
 *   ghost      – transparent
 *   gold       – gold gradient (used for Club CTAs)
 *
 * Sizes: sm 36 / md 44 / lg 54.  Press-in scales the button to 0.97.
 */
import React, { useRef } from 'react';
import {
  Animated,
  Pressable,
  StyleSheet,
  Text,
  View,
  ViewStyle,
  StyleProp,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import * as Haptics from 'expo-haptics';
import { NC } from './tokens';
import { NCIcon, type IconName } from './NCIcon';
import { fontFamily } from '../../theme/typography';

type Variant = 'primary' | 'secondary' | 'ghost' | 'gold';
type Size = 'sm' | 'md' | 'lg';

interface NCButtonProps {
  children: string;
  onPress?: () => void;
  variant?: Variant;
  size?: Size;
  icon?: IconName;
  iconRight?: IconName;
  full?: boolean;
  disabled?: boolean;
  haptic?: boolean;
  style?: StyleProp<ViewStyle>;
}

const SIZES: Record<Size, { h: number; fs: number; px: number; iconSize: number }> = {
  sm: { h: 36, fs: 13, px: 14, iconSize: 16 },
  md: { h: 44, fs: 14.5, px: 18, iconSize: 18 },
  lg: { h: 54, fs: 16, px: 22, iconSize: 20 },
};

export const NCButton: React.FC<NCButtonProps> = ({
  children,
  onPress,
  variant = 'primary',
  size = 'md',
  icon,
  iconRight,
  full,
  disabled,
  haptic = true,
  style,
}) => {
  const scale = useRef(new Animated.Value(1)).current;
  const sz = SIZES[size];

  const press = () => {
    if (disabled || !onPress) return;
    if (haptic) {
      Haptics.impactAsync(
        variant === 'primary'
          ? Haptics.ImpactFeedbackStyle.Medium
          : Haptics.ImpactFeedbackStyle.Light
      ).catch(() => {});
    }
    onPress();
  };

  const handlePressIn = () =>
    Animated.spring(scale, {
      toValue: 0.97,
      useNativeDriver: true,
      friction: 6,
      tension: 200,
    }).start();
  const handlePressOut = () =>
    Animated.spring(scale, {
      toValue: 1,
      useNativeDriver: true,
      friction: 5,
      tension: 200,
    }).start();

  const colors = useColors(variant);

  return (
    <Animated.View style={[full && { width: '100%' }, { transform: [{ scale }] }, style]}>
      <Pressable
        onPress={press}
        onPressIn={handlePressIn}
        onPressOut={handlePressOut}
        disabled={disabled}
        style={[
          styles.btn,
          {
            height: sz.h,
            paddingHorizontal: sz.px,
            backgroundColor: variant === 'primary' || variant === 'gold' ? 'transparent' : colors.bg,
            borderColor: colors.border,
            borderWidth: variant === 'ghost' || variant === 'secondary' ? 1 : 0,
            opacity: disabled ? 0.5 : 1,
            ...(variant === 'primary'
              ? {
                  shadowColor: NC.primary,
                  shadowOpacity: 0.35,
                  shadowRadius: 24,
                  shadowOffset: { width: 0, height: 10 },
                  elevation: 12,
                }
              : null),
            ...(variant === 'gold'
              ? {
                  shadowColor: NC.gold,
                  shadowOpacity: 0.4,
                  shadowRadius: 24,
                  shadowOffset: { width: 0, height: 10 },
                  elevation: 12,
                }
              : null),
          },
        ]}
      >
        {(variant === 'primary' || variant === 'gold') && (
          <LinearGradient
            colors={
              variant === 'primary'
                ? [NC.primary, NC.primaryDark]
                : [NC.goldLight, NC.gold]
            }
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 1 }}
            style={StyleSheet.absoluteFillObject}
          />
        )}
        <View style={styles.row}>
          {icon && <NCIcon name={icon} size={sz.iconSize} color={colors.fg} strokeWidth={2.2} />}
          <Text
            style={{
              color: colors.fg,
              fontFamily: fontFamily.uiSemibold,
              fontWeight: '600',
              fontSize: sz.fs,
              letterSpacing: -0.1,
            }}
          >
            {children}
          </Text>
          {iconRight && <NCIcon name={iconRight} size={sz.iconSize} color={colors.fg} strokeWidth={2.2} />}
        </View>
      </Pressable>
    </Animated.View>
  );
};

function useColors(v: Variant) {
  switch (v) {
    case 'primary':
      return { bg: NC.primary, fg: '#FFFFFF', border: 'transparent' };
    case 'secondary':
      return { bg: NC.bgCard, fg: NC.textP, border: NC.borderStr };
    case 'ghost':
      return { bg: 'transparent', fg: NC.textP, border: NC.border };
    case 'gold':
      return { bg: NC.gold, fg: '#1A120B', border: 'transparent' };
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
