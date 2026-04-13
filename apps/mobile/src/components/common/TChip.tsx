import React from 'react';
import { TouchableOpacity, Text, StyleSheet, ViewStyle } from 'react-native';
import { useAppColors } from '../../hooks/useColorScheme';
import { spacing, fontSize, fontWeight, borderRadius } from '../../theme/spacing';

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
  const colors = useAppColors();

  return (
    <TouchableOpacity
      onPress={onPress}
      disabled={!onPress}
      activeOpacity={0.7}
      style={[
        styles.chip,
        {
          backgroundColor: selected ? colors.primary[500] : colors.neutral[100],
          borderColor: selected ? colors.primary[500] : colors.neutral[300],
        },
        style,
      ]}
    >
      <Text
        style={[
          styles.label,
          {
            color: selected ? '#FFFFFF' : colors.neutral[700],
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
    borderRadius: borderRadius.full,
    borderWidth: 1,
    marginRight: spacing.xs,
    marginBottom: spacing.xs,
  },
  label: {
    fontSize: fontSize.sm,
    fontWeight: fontWeight.medium as any,
  },
});