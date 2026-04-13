import React, { useEffect } from 'react';
import { Stack } from 'expo-router';
import { useColorScheme } from 'react-native';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { GestureHandlerRootView } from 'react-native-gesture-handler';
import { StatusBar } from 'expo-status-bar';
import { getColors } from '../src/theme/colors';
import { useAuthStore } from '../src/store/authStore';
import '../src/i18n';

export default function RootLayout() {
  const colorScheme = useColorScheme() ?? 'light';
  const colors = getColors(colorScheme);
  const initialize = useAuthStore((s) => s.initialize);

  useEffect(() => {
    initialize();
  }, []);

  return (
    <GestureHandlerRootView style={{ flex: 1 }}>
      <SafeAreaProvider>
        <StatusBar style={colorScheme === 'dark' ? 'light' : 'dark'} />
        <Stack
          screenOptions={{
            headerShown: false,
            contentStyle: { backgroundColor: colors.neutral[50] },
            animation: 'slide_from_right',
          }}
        >
          <Stack.Screen name="(tabs)" options={{ headerShown: false }} />
          <Stack.Screen name="(auth)" options={{ headerShown: false, presentation: 'modal' }} />
          <Stack.Screen name="event/[id]" options={{ headerShown: false }} />
          <Stack.Screen name="event/register/[id]" options={{ headerShown: false, presentation: 'modal' }} />
          <Stack.Screen name="event/bracket/[id]" options={{ headerShown: false }} />
          <Stack.Screen name="venue/[id]" options={{ headerShown: false }} />
          <Stack.Screen name="membership" options={{ headerShown: false, presentation: 'modal' }} />
          <Stack.Screen name="support" options={{ headerShown: false }} />
          <Stack.Screen name="legal/[type]" options={{ headerShown: false }} />
          <Stack.Screen name="settings" options={{ headerShown: false }} />
        </Stack>
      </SafeAreaProvider>
    </GestureHandlerRootView>
  );
}