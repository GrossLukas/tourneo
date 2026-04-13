import React from 'react';
import { View, ActivityIndicator, Text, StyleSheet } from 'react-native';
import { useAppColors } from '../../hooks/useColorScheme';
import { fontSize } from '../../theme/spacing';

interface TLoadingScreenProps {
  message?: string;
}

export const TLoadingScreen: React.FC<TLoadingScreenProps> = ({ message }) => {
  const colors = useAppColors();

  return (
    <View style={[styles.container, { backgroundColor: colors.neutral[50] }]}>
      <ActivityIndicator size="large" color={colors.primary[500]} />
      {message && (
        <Text style={[styles.message, { color: colors.neutral[600] }]}>{message}</Text>
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  message: {
    marginTop: 16,
    fontSize: fontSize.md,
  },
});