/**
 * Root Layout – Tourneo
 * - Consent gate: redirects unauthenticated-but-logged-in users to consent screen
 * - Registers all stack screens (notifications, leaderboard, checkout)
 * - Initialises push-notification token on app start
 */
import React, { useEffect, useRef } from 'react';
import { Platform } from 'react-native';
import { Stack, useRouter, useSegments } from 'expo-router';
import Constants, { ExecutionEnvironment } from 'expo-constants';
import { useAuthStore } from '../src/store/authStore';
import { useConsentStore } from '../src/store/consentStore';
import { useNotificationStore } from '../src/store/notificationStore';
import { useFavoritesStore } from '../src/store/favoritesStore';
import { useTheme } from '../src/providers/ThemeProvider';
import { ErrorBoundary } from '../src/components/ErrorBoundary';
import { OfflineBanner } from '../src/components/OfflineBanner';
import { initCrashReporting, setCrashUser } from '../src/utils/crashReport';

/* ── Push-notification handler (foreground) ─────────────────────── */
let notificationHandlerConfigured = false;

function isExpoGoRuntime(): boolean {
  return (
    Constants.appOwnership === 'expo' ||
    Constants.executionEnvironment === ExecutionEnvironment.StoreClient
  );
}

async function loadNotifications() {
  if (Platform.OS === 'web' || isExpoGoRuntime()) return null;
  const Notifications = await import('expo-notifications');

  if (!notificationHandlerConfigured) {
    Notifications.setNotificationHandler({
      handleNotification: async () => ({
        shouldShowAlert: true,
        shouldPlaySound: true,
        shouldSetBadge: true,
        shouldShowBanner: true,
        shouldShowList: true,
      }),
    });
    notificationHandlerConfigured = true;
  }

  return Notifications;
}

/* ── Helper: register for push notifications ─────────────────── */
async function registerForPushNotifications(): Promise<string | null> {
  const Notifications = await loadNotifications();
  if (!Notifications) return null;

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
    initCrashReporting();
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

  /* ── Identify user for crash reporting ────────────────────── */
  useEffect(() => {
    if (user?.id) {
      setCrashUser({ id: user.id, email: user.email });
    } else {
      setCrashUser(null);
    }
  }, [user?.id, user?.email]);

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

  useEffect(() => {
    if (!isAuthenticated) return;
    let subscription: { remove: () => void } | null = null;

    loadNotifications().then((Notifications) => {
      if (!Notifications) return;
      subscription = Notifications.addNotificationResponseReceivedListener((response) => {
        const data = response.notification.request.content.data || {};
        const eventId = data.event_id || data.eventId;
        const registrationId = data.registration_id || data.registrationId;
        const paymentRequired = data.payment_required === true || data.paymentRequired === true;
        if (eventId && registrationId && paymentRequired) {
          router.push(`/event/checkout/${eventId}?registrationId=${registrationId}`);
        } else if (eventId) {
          router.push(`/event/${eventId}`);
        } else if (registrationId) {
          router.push('/notifications');
        }
      });
    });

    return () => {
      subscription?.remove();
    };
  }, [isAuthenticated, router]);

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
        navigationBarColor: colors.bg,
      }}
    >
      <Stack.Screen name="(tabs)" options={{ headerShown: false }} />
      <Stack.Screen name="(auth)" options={{ headerShown: false, presentation: 'modal' }} />
      <Stack.Screen name="event/[id]" options={{ headerShown: false }} />
      <Stack.Screen name="event/register/[id]" options={{ headerShown: false, presentation: 'modal' }} />
      <Stack.Screen name="event/bracket/[id]" options={{ headerShown: false }} />
      <Stack.Screen name="event/schedule/[id]" options={{ headerShown: false }} />
      <Stack.Screen name="event/checkin/[id]" options={{ headerShown: false }} />
      <Stack.Screen name="event/checkout/[id]" options={{ headerShown: false, presentation: 'modal' }} />
      <Stack.Screen name="event/referee/[matchId]" options={{ headerShown: false }} />
      <Stack.Screen name="event/live/[matchId]" options={{ headerShown: false }} />
      <Stack.Screen name="event/partners/[id]" options={{ headerShown: false }} />
      <Stack.Screen name="event/chat/[id]" options={{ headerShown: false }} />
      <Stack.Screen name="event/recap/[id]" options={{ headerShown: false }} />
      <Stack.Screen name="event/waitlist/[id]" options={{ headerShown: false }} />
      <Stack.Screen name="venue/[id]" options={{ headerShown: false }} />
      <Stack.Screen name="venue/search" options={{ headerShown: false }} />
      <Stack.Screen name="venue/availability/[id]" options={{ headerShown: false }} />
      <Stack.Screen name="onboarding/playtomic" options={{ headerShown: false }} />
      <Stack.Screen name="onboarding/playtomic-verify" options={{ headerShown: false }} />
      <Stack.Screen name="admin/verifications" options={{ headerShown: false }} />
      <Stack.Screen name="admin/quick-create" options={{ headerShown: false, presentation: 'modal' }} />
      <Stack.Screen name="membership" options={{ headerShown: false, presentation: 'modal' }} />
      <Stack.Screen name="notifications" options={{ headerShown: false }} />
      <Stack.Screen name="leaderboard" options={{ headerShown: false }} />
      <Stack.Screen name="support" options={{ headerShown: false }} />
      <Stack.Screen name="legal/[type]" options={{ headerShown: false }} />
      <Stack.Screen name="settings" options={{ headerShown: false }} />
      <Stack.Screen name="matchmaking/index" options={{ headerShown: false }} />
      <Stack.Screen name="profile/[id]" options={{ headerShown: false }} />
    </Stack>
    </ErrorBoundary>
  );
}
