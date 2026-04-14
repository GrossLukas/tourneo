import React from 'react';
import {
  TouchableOpacity,
  Text,
  StyleSheet,
  ActivityIndicator,
  ViewStyle,
  TextStyle,
  View,
} from 'react-native';
import { useTheme } from '../../providers/ThemeProvider';
import { spacing, fontSize, fontWeight, radius } from '../../theme/spacing';

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

  const sizeStyles: Record<ButtonSize, { height: number; paddingHorizontal: number; fontSize: number }> = {
    sm: { height: 36, paddingHorizontal: spacing.md, fontSize: fontSize.sm },
    md: { height: 48, paddingHorizontal: spacing.lg, fontSize: fontSize.md },
    lg: { height: 56, paddingHorizontal: spacing.xl, fontSize: fontSize.lg },
  };

  const getBackgroundColor = (): string => {
    if (disabled) return colors.surfacePressed;
    switch (variant) {
      case 'primary': return '#6366F1';
      case 'secondary': return 'transparent';
      case 'outline': return 'transparent';
      case 'ghost': return 'transparent';
      case 'danger': return 'rgba(255,71,87,0.12)';
      case 'gold': return '#F59E0B';
      default: return '#6366F1';
    }
  };

  const getTextColor = (): string => {
    if (disabled) return colors.textTertiary;
    switch (variant) {
      case 'primary': return '#FFFFFF';
      case 'secondary': return '#818CF8';
      case 'outline': return '#818CF8';
      case 'ghost': return '#818CF8';
      case 'danger': return '#FF4757';
      case 'gold': return '#1A1000';
      default: return '#FFFFFF';
    }
  };

  const getBorderColor = (): string => {
    if (disabled) return colors.surfacePressed;
    if (variant === 'outline') return 'rgba(99,102,241,0.4)';
    if (variant === 'secondary') return 'rgba(99,102,241,0.4)';
    if (variant === 'danger') return 'rgba(255,71,87,0.3)';
    return 'transparent';
  };

  const getBorderWidth = (): number => {
    if (variant === 'outline') return 1.5;
    if (variant === 'secondary') return StyleSheet.hairlineWidth;
    if (variant === 'danger') return StyleSheet.hairlineWidth;
    return 0;
  };

  const s = sizeStyles[size];

  return (
    <TouchableOpacity
      onPress={onPress}
      disabled={disabled || loading}
      activeOpacity={0.7}
      style={[
        styles.button,
        {
          height: s.height,
          paddingHorizontal: s.paddingHorizontal,
          backgroundColor: getBackgroundColor(),
          borderColor: getBorderColor(),
          borderWidth: getBorderWidth(),
          width: fullWidth ? '100%' : undefined,
        },
        style,
      ]}
    >
      {loading ? (
        <ActivityIndicator color={getTextColor()} size="small" />
      ) : (
        <View style={styles.content}>
          {icon && iconPosition === 'left' && <View style={styles.iconLeft}>{icon}</View>}
          <Text
            style={[
              styles.text,
              {
                color: getTextColor(),
                fontSize: s.fontSize,
              },
              textStyle,
            ]}
          >
            {title}
          </Text>
          {icon && iconPosition === 'right' && <View style={styles.iconRight}>{icon}</View>}
        </View>
      )}
    </TouchableOpacity>
  );
};

const styles = StyleSheet.create({
  button: {
    borderRadius: radius.md,
    alignItems: 'center',
    justifyContent: 'center',
    flexDirection: 'row',
  },
  content: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
  },
  text: {
    fontWeight: fontWeight.semibold as any,
    textAlign: 'center',
  },
  iconLeft: {
    marginRight: spacing.xs,
  },
  iconRight: {
    marginLeft: spacing.xs,
  },
});