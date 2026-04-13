import React, { useEffect } from 'react';
import { useRouter } from 'expo-router';
import { useAuthStore } from '../src/store/authStore';
import { TLoadingScreen } from '../src/components/common';

export default function Index() {
  const router = useRouter();
  const { user, isLoading, isInitialized } = useAuthStore();

  useEffect(() => {
    if (!isInitialized) return;

    if (user) {
      router.replace('/(tabs)/home');
    } else {
      router.replace('/(auth)/onboarding');
    }
  }, [isInitialized, user]);

  return <TLoadingScreen message="Turneo wird geladen..." />;
}