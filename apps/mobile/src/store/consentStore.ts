/**
 * consentStore – DSGVO consent management.
 * Stores consent decisions in SecureStore and syncs with backend API.
 */
import { create } from 'zustand';
import * as SecureStore from 'expo-secure-store';
import apiClient from '../api/client';

const CONSENT_KEY = '@tourneo_consent_data';

export interface ConsentData {
  mandatory: boolean;
  pushNotifications: boolean;
  personalization: boolean;
  newsletter: boolean;
  consentDate: string;
  consentVersion: string;
}

interface ConsentStoreState {
  hasConsented: boolean;
  consentData: ConsentData | null;
  isLoading: boolean;
  isInitialized: boolean;

  initialize: () => Promise<void>;
  saveConsent: (data: ConsentData) => Promise<void>;
  updateOptionalConsent: (key: 'pushNotifications' | 'personalization' | 'newsletter', value: boolean) => Promise<void>;
  withdrawAllConsent: () => Promise<void>;
  requestDataDeletion: () => Promise<void>;
  requestDataExport: () => Promise<void>;
}

export const useConsentStore = create<ConsentStoreState>((set, get) => ({
  hasConsented: false,
  consentData: null,
  isLoading: false,
  isInitialized: false,

  initialize: async () => {
    try {
      const stored = await SecureStore.getItemAsync(CONSENT_KEY);
      if (stored) {
        const data: ConsentData = JSON.parse(stored);
        set({ hasConsented: data.mandatory === true, consentData: data, isInitialized: true });
      } else {
        set({ hasConsented: false, consentData: null, isInitialized: true });
      }
    } catch {
      set({ hasConsented: false, consentData: null, isInitialized: true });
    }
  },

  saveConsent: async (data: ConsentData) => {
    set({ isLoading: true });
    try {
      // Store locally
      await SecureStore.setItemAsync(CONSENT_KEY, JSON.stringify(data));
      // Sync with backend (best effort)
      try {
        await apiClient.post('/users/consent', data);
      } catch { /* API may not be reachable pre-login */ }
      set({ hasConsented: true, consentData: data, isLoading: false });
    } catch {
      set({ isLoading: false });
      throw new Error('Could not save consent');
    }
  },

  updateOptionalConsent: async (key, value) => {
    const current = get().consentData;
    if (!current) return;
    const updated: ConsentData = { ...current, [key]: value, consentDate: new Date().toISOString() };
    await SecureStore.setItemAsync(CONSENT_KEY, JSON.stringify(updated));
    try {
      await apiClient.post('/users/consent', updated);
    } catch { /* best effort */ }
    set({ consentData: updated });
  },

  withdrawAllConsent: async () => {
    await SecureStore.deleteItemAsync(CONSENT_KEY);
    set({ hasConsented: false, consentData: null });
  },

  requestDataDeletion: async () => {
    set({ isLoading: true });
    try {
      await apiClient.post('/users/me/delete-request');
      set({ isLoading: false });
    } catch {
      set({ isLoading: false });
      throw new Error('Could not send deletion request');
    }
  },

  requestDataExport: async () => {
    set({ isLoading: true });
    try {
      await apiClient.get('/users/me/data-export');
      set({ isLoading: false });
    } catch {
      set({ isLoading: false });
      throw new Error('Could not request data export');
    }
  },
}));