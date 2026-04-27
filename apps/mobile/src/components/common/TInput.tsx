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
import { useTheme } from '../../providers/ThemeProvider';
import { spacing } from '../../theme/spacing';
import { fontFamily } from '../../theme/typography';

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

/**
 * Night Court text input.  48 px tall, 14 px radius, dark `bgInput`
 * surface, indigo focus ring.
 */
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
  const { colors } = useTheme();
  const [focused, setFocused] = useState(false);

  const borderColor = error
    ? colors.error
    : focused
    ? '#6366F1'
    : 'rgba(255,255,255,0.08)';

  return (
    <View style={[styles.container, containerStyle]}>
      {label ? (
        <Text style={[styles.label, { color: colors.textSecondary }]}>
          {label}
          {required ? <Text style={{ color: colors.error }}> *</Text> : null}
        </Text>
      ) : null}
      <View
        style={[
          styles.inputContainer,
          {
            borderColor,
            backgroundColor: '#16162A',
            borderWidth: focused || error ? 1 : 1,
          },
        ]}
      >
        {leftIcon ? <View style={styles.leftIcon}>{leftIcon}</View> : null}
        <TextInput
          {...inputProps}
          style={[
            styles.input,
            { color: colors.textPrimary },
            leftIcon ? { paddingLeft: 0 } : null,
          ]}
          placeholderTextColor={colors.textTertiary}
          onFocus={(e) => {
            setFocused(true);
            inputProps.onFocus?.(e);
          }}
          onBlur={(e) => {
            setFocused(false);
            inputProps.onBlur?.(e);
          }}
        />
        {rightIcon ? (
          <TouchableOpacity
            onPress={onRightIconPress}
            disabled={!onRightIconPress}
            style={styles.rightIcon}
          >
            {rightIcon}
          </TouchableOpacity>
        ) : null}
      </View>
      {error ? <Text style={[styles.errorText, { color: colors.error }]}>{error}</Text> : null}
      {hint && !error ? (
        <Text style={[styles.hintText, { color: colors.textTertiary }]}>{hint}</Text>
      ) : null}
    </View>
  );
};

const styles = StyleSheet.create({
  container: { marginBottom: spacing.md },
  label: {
    fontFamily: fontFamily.uiSemibold,
    fontSize: 13,
    fontWeight: '600' as const,
    marginBottom: spacing.xs,
  },
  inputContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    borderRadius: 14,
    paddingHorizontal: 14,
    height: 48,
  },
  input: {
    flex: 1,
    fontFamily: fontFamily.uiMedium,
    fontSize: 14,
    paddingVertical: 0,
    height: '100%',
  },
  leftIcon: { marginRight: 10 },
  rightIcon: { marginLeft: 10 },
  errorText: {
    fontFamily: fontFamily.uiMedium,
    fontSize: 12,
    marginTop: 4,
  },
  hintText: {
    fontFamily: fontFamily.uiMedium,
    fontSize: 12,
    marginTop: 4,
  },
});
