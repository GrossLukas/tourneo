import React from 'react';
import { View, TextInput, StyleSheet, Pressable, Text } from 'react-native';
import { useTheme } from '../../providers/ThemeProvider';
import { fontFamily } from '../../theme/typography';

interface TSearchBarProps {
  placeholder?: string;
  value: string;
  onChangeText: (text: string) => void;
  onSubmit?: () => void;
  onClear?: () => void;
}

/**
 * Night Court search input.  48 px tall, 14 px radius, magnifier icon.
 */
export const TSearchBar: React.FC<TSearchBarProps> = ({
  placeholder = 'Suchen…',
  value,
  onChangeText,
  onSubmit,
  onClear,
}) => {
  const { colors } = useTheme();
  return (
    <View
      style={[
        styles.container,
        { backgroundColor: '#16162A', borderColor: 'rgba(255,255,255,0.08)' },
      ]}
    >
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
      {value.length > 0 ? (
        <Pressable
          onPress={() => {
            onChangeText('');
            onClear?.();
          }}
          hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
        >
          <Text style={[styles.clearIcon, { color: colors.textTertiary }]}>✕</Text>
        </Pressable>
      ) : null}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    alignItems: 'center',
    borderRadius: 14,
    borderWidth: 1,
    paddingHorizontal: 14,
    height: 48,
    marginHorizontal: 20,
    marginVertical: 8,
    gap: 10,
  },
  icon: { fontSize: 16 },
  input: {
    flex: 1,
    fontFamily: fontFamily.uiMedium,
    fontSize: 14,
    paddingVertical: 0,
  },
  clearIcon: { fontSize: 14, padding: 2 },
});
