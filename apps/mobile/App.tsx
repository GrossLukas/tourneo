import 'react-native-gesture-handler';
import React from 'react';
import { StatusBar } from 'expo-status-bar';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { GestureHandlerRootView } from 'react-native-gesture-handler';
import { StyleSheet, View } from 'react-native';
import { ExpoRoot } from 'expo-router';
import { ThemeProvider, useTheme } from './src/providers/ThemeProvider';
import { useNightCourtFonts } from './src/theme/fonts';

// Initialize i18n
import './src/i18n';

const ctx = (require as any).context('./app');

function AppContent() {
  const { isDark } = useTheme();
  // Load Outfit / Inter / JetBrains Mono. While they load we still render
  // the app so there is no blank flash – the system font is used as fallback.
  useNightCourtFonts();
  return (
    <>
      {/* Night Court is dark-mode-first — always light status bar icons */}
      <StatusBar style="light" backgroundColor="#0A0A14" />
      <ExpoRoot context={ctx} />
    </>
  );
}

export default function App() {
  return (
    <GestureHandlerRootView style={styles.container}>
      <SafeAreaProvider>
        <ThemeProvider>
          <AppContent />
        </ThemeProvider>
      </SafeAreaProvider>
    </GestureHandlerRootView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#0A0A14',
  },
});