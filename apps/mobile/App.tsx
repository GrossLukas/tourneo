import 'react-native-gesture-handler';
import React from 'react';
import { StatusBar } from 'expo-status-bar';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { GestureHandlerRootView } from 'react-native-gesture-handler';
import { useColorScheme, StyleSheet } from 'react-native';
import { ExpoRoot } from 'expo-router';

// Initialize i18n
import './src/i18n';

// Expo Router context for app directory
const ctx = (require as any).context('./app');

export default function App() {
  const colorScheme = useColorScheme();

  return (
    <GestureHandlerRootView style={styles.container}>
      <SafeAreaProvider>
        <StatusBar style={colorScheme === 'dark' ? 'light' : 'dark'} />
        <ExpoRoot context={ctx} />
      </SafeAreaProvider>
    </GestureHandlerRootView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
});