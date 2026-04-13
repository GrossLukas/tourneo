import React from 'react';
import { View, StyleSheet, ViewStyle } from 'react-native';
import { useAppColors } from '../../hooks/useColorScheme';
import { spacing } from '../../theme/spacing';

interface TDividerProps {
  marginVertical?: number;
  style?: ViewStyle;
}

export const TDivider: React.FC<TDividerProps> = ({
  marginVertical = spacing.md,
  style,
}) => {
  const colors = useAppColors();

  return (
    <View
      style={[
        styles.divider,
        { backgroundColor: colors.divider, marginVertical },
        style,
      ]}
    />
  );
};

const styles = StyleSheet.create({
  divider: {
    height: StyleSheet.hairlineWidth,
    width: '100%',
  },
});