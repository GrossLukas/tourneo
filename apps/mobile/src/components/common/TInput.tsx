import React, { useState } from 'react';
import {
  View,
  TextInput,
  Text,
  StyleSheet,
  TouchableOpacity,
  TextInputProps,
  ViewStyle,
} from 'react-native';
import { useAppColors } from '../../hooks/useColorScheme';
import { spacing, fontSize, fontWeight, borderRadius } from '../../theme/spacing';

interface TInputProps extends Omit<TextInputProps, 'style'> {
  label?: string;
  error?: string;
  hint?: string;
  required?: boolean;
  leftIcon?: React.ReactNode;
  rightIcon?: React.ReactNode;
  onRightIconPress?: () => void;
  containerStyle?: ViewStyle;
}

export const TInput: React.FC<TInputProps> = ({
  label,
  error,
  hint,
  required,
  leftIcon,
  rightIcon,
  onRightIconPress,
  containerStyle,
  ...inputProps
}) => {
  const colors = useAppColors();
  const [focused, setFocused] = useState(false);

  const getBorderColor = (): string => {
    if (error) return colors.status.error;
    if (focused) return colors.primary[500];
    return colors.neutral[300];
  };

  return (
    <View style={[styles.container, containerStyle]}>
      {label && (
        <Text style={[styles.label, { color: colors.neutral[700] }]}>
          {label}
          {required && <Text style={{ color: colors.status.error }}> *</Text>}
        </Text>
      )}
      <View
        style={[
          styles.inputContainer,
          {
            borderColor: getBorderColor(),
            backgroundColor: colors.neutral[50],
          },
          focused && styles.inputFocused,
          error ? styles.inputError : null,
        ]}
      >
        {leftIcon && <View style={styles.leftIcon}>{leftIcon}</View>}
        <TextInput
          {...inputProps}
          style={[
            styles.input,
            {
              color: colors.neutral[900],
            },
            leftIcon ? { paddingLeft: 0 } : null,
          ]}
          placeholderTextColor={colors.neutral[400]}
          onFocus={(e) => {
            setFocused(true);
            inputProps.onFocus?.(e);
          }}
          onBlur={(e) => {
            setFocused(false);
            inputProps.onBlur?.(e);
          }}
        />
        {rightIcon && (
          <TouchableOpacity
            onPress={onRightIconPress}
            disabled={!onRightIconPress}
            style={styles.rightIcon}
          >
            {rightIcon}
          </TouchableOpacity>
        )}
      </View>
      {error && (
        <Text style={[styles.errorText, { color: colors.status.error }]}>{error}</Text>
      )}
      {hint && !error && (
        <Text style={[styles.hintText, { color: colors.neutral[500] }]}>{hint}</Text>
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    marginBottom: spacing.md,
  },
  label: {
    fontSize: fontSize.sm,
    fontWeight: fontWeight.medium as any,
    marginBottom: spacing.xs,
  },
  inputContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    borderWidth: 1.5,
    borderRadius: borderRadius.md,
    paddingHorizontal: spacing.md,
    height: 48,
  },
  inputFocused: {
    borderWidth: 2,
  },
  inputError: {
    borderWidth: 2,
  },
  input: {
    flex: 1,
    fontSize: fontSize.md,
    paddingVertical: 0,
    height: '100%',
  },
  leftIcon: {
    marginRight: spacing.sm,
  },
  rightIcon: {
    marginLeft: spacing.sm,
  },
  errorText: {
    fontSize: fontSize.xs,
    marginTop: spacing.xxs,
  },
  hintText: {
    fontSize: fontSize.xs,
    marginTop: spacing.xxs,
  },
});