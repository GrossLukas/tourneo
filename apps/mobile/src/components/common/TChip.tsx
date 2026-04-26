import React from 'react';
import { Pressable, Text, StyleSheet, ViewStyle } from 'react-native';
import * as Haptics from 'expo-haptics';
import { fontFamily } from '../../theme/typography';

interface TChipProps {
  label: string;
  selected?: boolean;
  onPress?: () => void;
  style?: ViewStyle;
}

/**
 * Night Court level/filter chip.  Active = indigo fill, inactive = card
 * surface with thin border.  Always rounded-full.
 */
export const TChip: React.FC<TChipProps> = ({ label, selected = false, onPress, style }) => {
  const handlePress = () => {
    if (!onPress) return;
    Haptics.selectionAsync().catch(() => {});
    onPress();
  };

  return (
    <Pressable
      onPress={handlePress}
      disabled={!onPress}
      style={[
        styles.chip,
        {
          backgroundColor: selected ? '#6366F1' : '#111127',
          borderColor: selected ? '#6366F1' : 'rgba(255,255,255,0.08)',
        },
        style,
      ]}
    >
      <Text
        style={[
          styles.label,
          { color: selected ? '#FFFFFF' : 'rgba(255,255,255,0.6)' },
        ]}
      >
        {label}
      </Text>
    </Pressable>
  );
};

const styles = StyleSheet.create({
  chip: {
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: 999,
    borderWidth: 1,
    marginRight: 8,
    marginBottom: 8,
  },
  label: {
    fontFamily: fontFamily.uiSemibold,
    fontSize: 12.5,
    fontWeight: '600' as const,
    letterSpacing: -0.1,
  },
});
