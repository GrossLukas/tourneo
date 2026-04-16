/**
 * Root Layout – Tourneo
 * - Consent gate: redirects unauthenticated-but-logged-in users to consent screen
 * - Registers all stack screens (notifications, leaderboard, checkout)
 * - Initialises push-notification token on app start
 */
import React, { useEffect, useRef } from 'react';
import { Platform } from 'react-native';
import { Stack, useRouter, useSegments } from 'expo-router';
import * as Notifications from 'expo-notifications';
import { useAuthStore } from '../src/store/authStore';
import { useConsentStore } from '../src/store/consentStore';
import { useNotificationStore } from '../src/store/notificationStore';
import { useFavoritesStore } from '../src/store/favoritesStore';
import { useTheme } from '../src/providers/ThemeProvider';
import { ErrorBoundary } from '../src/components/ErrorBoundary';
import { OfflineBanner } from '../src/components/OfflineBanner';

/* ── Push-notification handler (foreground) ─────────────────────── */
Notifications.setNotificationHandler({
  handleNotification: async () => ({
    shouldShowAlert: true,
    shouldPlaySound: true,
    shouldSetBadge: true,
    shouldShowBanner: true,
    shouldShowList: true,
  }),
});

/* ── Helper: register for push notifications ─────────────────── */
async function registerForPushNotifications(): Promise<string | null> {
  if (Platform.OS === 'web') return null;

  const { status: existing } = await Notifications.getPermissionsAsync();
  let finalStatus = existing;

  if (existing !== 'granted') {
    const { status } = await Notifications.requestPermissionsAsync();
    finalStatus = status;
  }

  if (finalStatus !== 'granted') return null;

  try {
    const tokenData = await Notifications.getExpoPushTokenAsync({
      projectId: process.env.EXPO_PUBLIC_EXPO_PROJECT_ID,
    });
    return tokenData.data;
  } catch {
    return null;
  }
}

/* ── Root Layout ─────────────────────────────────────────────── */
export default function RootLayout() {
  const { colors } = useTheme();
  const router = useRouter();
  const segments = useSegments();

  const initialize = useAuthStore((s) => s.initialize);
  const isAuthenticated = useAuthStore((s) => s.isAuthenticated);
  const user = useAuthStore((s) => s.user);

  const initializeConsent = useConsentStore((s) => s.initialize);
  const hasConsented = useConsentStore((s) => s.hasConsented);

  const registerPushToken = useNotificationStore((s) => s.registerPushToken);
  const fetchNotifications = useNotificationStore((s) => s.fetchNotifications);

  const initialised = useRef(false);

  /* ── App boot ─────────────────────────────────────────────── */
  useEffect(() => {
    const boot = async () => {
      try {
        await initialize();
        await initializeConsent();
        useFavoritesStore.getState().hydrate();
      } catch (err) {
        console.error('[boot] Initialization failed:', err);
      } finally {
        initialised.current = true;
      }
    };
    boot();
  }, []);

  /* ── Push token registration (after auth) ─────────────────── */
  useEffect(() => {
    if (!isAuthenticated || !user) return;

    const setup = async () => {
      const token = await registerForPushNotifications();
      if (token) {
        await registerPushToken(token);
      }
      fetchNotifications();
    };
    setup();
  }, [isAuthenticated, user]);

  /* ── Consent gate: redirect to consent if logged in but not consented ── */
  useEffect(() => {
    if (!initialised.current) return;
    if (!isAuthenticated) return;

    const inConsentScreen = segments.join('/').includes('consent');
    if (!hasConsented && !inConsentScreen) {
      router.replace('/(auth)/consent');
    }
  }, [isAuthenticated, hasConsented, segments]);

  return (
    <ErrorBoundary>
      <OfflineBanner />
    <Stack
      screenOptions={{
        headerShown: false,
        contentStyle: { backgroundColor: colors.bg },
        animation: 'slide_from_right',
        navigationBarColor: '#0A0A14',
      }}
    >
      <Stack.Screen name="(tabs)" options={{ headerShown: false }} />
      <Stack.Screen name="(auth)" options={{ headerShown: false, presentation: 'modal' }} />
      <Stack.Screen name="event/[id]" options={{ headerShown: false }} />
      <Stack.Screen name="event/register/[id]" options={{ headerShown: false, presentation: 'modal' }} />
      <Stack.Screen name="event/bracket/[id]" options={{ headerShown: false }} />
      <Stack.Screen name="event/checkout/[id]" options={{ headerShown: false, presentation: 'modal' }} />
      <Stack.Screen name="event/referee/[matchId]" options={{ headerShown: false }} />
      <Stack.Screen name="event/partners/[id]" options={{ headerShown: false }} />
      <Stack.Screen name="event/chat/[id]" options={{ headerShown: false }} />
      <Stack.Screen name="event/recap/[id]" options={{ headerShown: false }} />
      <Stack.Screen name="event/waitlist/[id]" options={{ headerShown: false }} />
      <Stack.Screen name="venue/[id]" options={{ headerShown: false }} />
      <Stack.Screen name="membership" options={{ headerShown: false, presentation: 'modal' }} />
      <Stack.Screen name="notifications" options={{ headerShown: false }} />
      <Stack.Screen name="leaderboard" options={{ headerShown: false }} />
      <Stack.Screen name="support" options={{ headerShown: false }} />
      <Stack.Screen name="legal/[type]" options={{ headerShown: false }} />
      <Stack.Screen name="settings" options={{ headerShown: false }} />
    </Stack>
    </ErrorBoundary>
  );
}