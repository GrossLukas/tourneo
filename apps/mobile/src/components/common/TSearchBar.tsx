import React from 'react';
import { View, TextInput, StyleSheet, TouchableOpacity, Text } from 'react-native';
import { useTheme } from '../../providers/ThemeProvider';
import { spacing, fontSize, radius } from '../../theme/spacing';

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
  const { colors } = useTheme();

  return (
    <View style={[styles.container, { backgroundColor: colors.surfaceSecondary, borderColor: colors.border }]}>
      <Text style={[styles.icon, { color: colors.textTertiary }]}>🔍</Text>
      <TextInput
        style={[styles.input, { color: colors.textPrimary }]}
        placeholder={placeholder}
        placeholderTextColor={colors.textTertiary}
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
          <Text style={[styles.clearIcon, { color: colors.textTertiary }]}>✕</Text>
        </TouchableOpacity>
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    alignItems: 'center',
    borderRadius: radius.lg,
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