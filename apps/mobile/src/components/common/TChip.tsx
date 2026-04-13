import React from 'react';
import { TouchableOpacity, Text, StyleSheet, ViewStyle } from 'react-native';
import { useTheme } from '../../providers/ThemeProvider';
import { spacing, fontSize, fontWeight, radius } from '../../theme/spacing';

interface TChipProps {
  label: string;
  selected?: boolean;
  onPress?: () => void;
  style?: ViewStyle;
}

export const TChip: React.FC<TChipProps> = ({
  label,
  selected = false,
  onPress,
  style,
}) => {
  const { colors } = useTheme();

  return (
    <TouchableOpacity
      onPress={onPress}
      disabled={!onPress}
      activeOpacity={0.7}
      style={[
        styles.chip,
        {
          backgroundColor: selected ? (colors.primary as string) : colors.surfaceSecondary,
          borderColor: selected ? (colors.primary as string) : colors.border,
        },
        style,
      ]}
    >
      <Text
        style={[
          styles.label,
          {
            color: selected ? '#FFFFFF' : colors.textSecondary,
          },
        ]}
      >
        {label}
      </Text>
    </TouchableOpacity>
  );
};

const styles = StyleSheet.create({
  chip: {
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.xs,
    borderRadius: radius.full,
    borderWidth: 1,
    marginRight: spacing.xs,
    marginBottom: spacing.xs,
  },
  label: {
    fontSize: fontSize.sm,
    fontWeight: fontWeight.medium as any,
  },
});