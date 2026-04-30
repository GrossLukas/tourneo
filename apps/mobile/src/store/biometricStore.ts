/**
 * biometricStore – Manages biometric login state.
 * Stores auth token in SecureStore for biometric re-authentication.
 */
import { create } from 'zustand';
import * as SecureStore from 'expo-secure-store';
import * as LocalAuthentication from 'expo-local-authentication';
import apiClient from '../api/client';

const BIOMETRIC_ENABLED_KEY = 'tourneo_biometric_enabled';
const BIOMETRIC_TOKEN_KEY = 'tourneo_biometric_token';

interface BiometricStoreState {
  enabled: boolean;
  isLoading: boolean;
  isInitialized: boolean;

  initialize: () => Promise<void>;
  enable: (accessToken: string) => Promise<void>;
  disable: () => Promise<void>;
  loginWithBiometrics: () => Promise<{ success: boolean; error?: string }>;
}

export const useBiometricStore = create<BiometricStoreState>((set, get) => ({
  enabled: false,
  isLoading: false,
  isInitialized: false,

  initialize: async () => {
    try {
      const enabled = await SecureStore.getItemAsync(BIOMETRIC_ENABLED_KEY);
      set({ enabled: enabled === 'true', isInitialized: true });
    } catch {
      set({ enabled: false, isInitialized: true });
    }
  },

  enable: async (accessToken: string) => {
    try {
      // Store the current token for biometric login
      await SecureStore.setItemAsync(BIOMETRIC_TOKEN_KEY, accessToken);
      await SecureStore.setItemAsync(BIOMETRIC_ENABLED_KEY, 'true');
      set({ enabled: true });
    } catch {
      throw new Error('Could not enable biometric login');
    }
  },

  disable: async () => {
    try {
      await SecureStore.deleteItemAsync(BIOMETRIC_TOKEN_KEY);
      await SecureStore.setItemAsync(BIOMETRIC_ENABLED_KEY, 'false');
      set({ enabled: false });
    } catch {
      // Best effort
      set({ enabled: false });
    }
  },

  loginWithBiometrics: async () => {
    set({ isLoading: true });
    try {
      // 1. Verify biometric authentication
      const bioResult = await LocalAuthentication.authenticateAsync({
        promptMessage: 'Bei Tourneo anmelden',
        cancelLabel: 'Abbrechen',
        disableDeviceFallback: false,
        fallbackLabel: 'Passwort verwenden',
      });

      if (!bioResult.success) {
        set({ isLoading: false });
        return { success: false, error: 'biometric_failed' };
      }

      // 2. Get stored token
      const storedToken = await SecureStore.getItemAsync(BIOMETRIC_TOKEN_KEY);
      if (!storedToken) {
        set({ isLoading: false });
        return { success: false, error: 'no_stored_token' };
      }

      // 3. Validate token against API
      const response = await apiClient.get('/auth/me', {
        headers: { Authorization: `Bearer ${storedToken}` },
      });

      if (response.data?.data) {
        // Token is still valid – set it as the active token
        await SecureStore.setItemAsync('access_token', storedToken);
        set({ isLoading: false });
        return { success: true };
      }

      set({ isLoading: false });
      return { success: false, error: 'token_invalid' };
    } catch (error: unknown) {
      set({ isLoading: false });
      // Token might be expired – disable biometrics
      const state = get();
      if (state.enabled) {
        await SecureStore.deleteItemAsync(BIOMETRIC_TOKEN_KEY);
        await SecureStore.setItemAsync(BIOMETRIC_ENABLED_KEY, 'false');
        set({ enabled: false });
      }
      return { success: false, error: 'token_expired' };
    }
  },
}));
