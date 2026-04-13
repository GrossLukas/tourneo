import React, { useState } from 'react';
import { View, TextInput, StyleSheet, TouchableOpacity, Text } from 'react-native';
import { useAppColors } from '../../hooks/useColorScheme';
import { spacing, fontSize, borderRadius } from '../../theme/spacing';

interface TSearchBarProps {
  placeholder?: string;
  value: string;
  onChangeText: (text: string) => void;
  onSubmit?: () => void;
  onClear?: () => void;
}

export const TSearchBar: React.FC<TSearchBarProps> = ({
  placeholder = 'Suchen...',
  value,
  onChangeText,
  onSubmit,
  onClear,
}) => {
  const colors = useAppColors();

  return (
    <View style={[styles.container, { backgroundColor: colors.neutral[100], borderColor: colors.neutral[300] }]}>
      <Text style={[styles.icon, { color: colors.neutral[400] }]}>🔍</Text>
      <TextInput
        style={[styles.input, { color: colors.neutral[900] }]}
        placeholder={placeholder}
        placeholderTextColor={colors.neutral[400]}
        value={value}
        onChangeText={onChangeText}
        onSubmitEditing={onSubmit}
        returnKeyType="search"
        autoCapitalize="none"
        autoCorrect={false}
      />
      {value.length > 0 && (
        <TouchableOpacity
          onPress={() => {
            onChangeText('');
            onClear?.();
          }}
          hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
        >
          <Text style={[styles.clearIcon, { color: colors.neutral[400] }]}>✕</Text>
        </TouchableOpacity>
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    alignItems: 'center',
    borderRadius: borderRadius.lg,
    borderWidth: 1,
    paddingHorizontal: spacing.md,
    height: 44,
    marginHorizontal: spacing.md,
    marginVertical: spacing.sm,
  },
  icon: {
    marginRight: spacing.sm,
    fontSize: 16,
  },
  input: {
    flex: 1,
    fontSize: fontSize.md,
    paddingVertical: 0,
  },
  clearIcon: {
    fontSize: 14,
    padding: spacing.xxs,
  },
});