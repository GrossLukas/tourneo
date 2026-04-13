import React, { useEffect } from 'react';
import { Stack } from 'expo-router';
import { useAuthStore } from '../src/store/authStore';
import { useAppColors } from '../src/hooks/useColorScheme';

export default function RootLayout() {
  const colors = useAppColors();
  const initialize = useAuthStore((s) => s.initialize);

  useEffect(() => {
    initialize();
  }, []);

  return (
    <Stack
      screenOptions={{
        headerShown: false,
        contentStyle: { backgroundColor: colors.bg },
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
  );
}