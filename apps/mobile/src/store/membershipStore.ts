import { create } from 'zustand';
import api from '../api/client';

export type MembershipTier = 'free' | 'plus' | 'club';

export interface MembershipInfo {
  id: string;
  user_id: string;
  tier: MembershipTier;
  status: 'active' | 'cancelled' | 'expired' | 'grace_period';
  started_at: string;
  expires_at?: string;
  auto_renew: boolean;
  apple_product_id?: string;
  apple_transaction_id?: string;
}

export interface MembershipTierInfo {
  tier: MembershipTier;
  name: string;
  price_monthly: number;
  apple_product_id: string;
  features: string[];
  early_access_hours: number;
  discount_percent: number;
  highlighted: boolean;
}

interface MembershipState {
  currentMembership: MembershipInfo | null;
  tiers: MembershipTierInfo[];
  loading: boolean;
  error: string | null;

  fetchCurrentMembership: () => Promise<void>;
  fetchTiers: () => Promise<void>;
  subscribe: (tier: MembershipTier, appleReceipt: string) => Promise<void>;
  cancelSubscription: () => Promise<void>;
  restorePurchases: (appleReceipt: string) => Promise<void>;
  clearError: () => void;
  reset: () => void;
}

const DEFAULT_TIERS: MembershipTierInfo[] = [
  {
    tier: 'free',
    name: 'Free',
    price_monthly: 0,
    apple_product_id: '',
    early_access_hours: 0,
    discount_percent: 0,
    highlighted: false,
    features: [
      'Turniere entdecken & teilnehmen',
      'Court-Finder nutzen',
      'Community beitreten',
      'Grundlegendes Profil',
    ],
  },
  {
    tier: 'plus',
    name: 'Plus',
    price_monthly: 7.99,
    apple_product_id: 'de.tourneo.plus.monthly',
    early_access_hours: 24,
    discount_percent: 10,
    highlighted: true,
    features: [
      'Alles aus Free',
      '24h Early Access für Turniere',
      '10% Rabatt auf Turniergebühren',
      'Priorität auf der Warteliste',
      'Erweiterte Statistiken',
      'Plus Badge im Profil',
    ],
  },
  {
    tier: 'club',
    name: 'Club',
    price_monthly: 14.99,
    apple_product_id: 'de.tourneo.club.monthly',
    early_access_hours: 48,
    discount_percent: 20,
    highlighted: false,
    features: [
      'Alles aus Plus',
      '48h Early Access für Turniere',
      '20% Rabatt auf Turniergebühren',
      'Höchste Wartelisten-Priorität',
      'Exklusive Club-Events',
      'Persönlicher Support',
      'Gold Badge im Profil',
    ],
  },
];

export const useMembershipStore = create<MembershipState>((set) => ({
  currentMembership: null,
  tiers: DEFAULT_TIERS,
  loading: false,
  error: null,

  fetchCurrentMembership: async () => {
    set({ loading: true, error: null });
    try {
      const response = await api.get('/membership/current');
      set({ currentMembership: response.data.data, loading: false });
    } catch (error: any) {
      set({ error: error.response?.data?.message || 'Failed to fetch membership', loading: false });
    }
  },

  fetchTiers: async () => {
    set({ loading: true, error: null });
    try {
      const response = await api.get('/membership/tiers');
      set({ tiers: response.data.data || DEFAULT_TIERS, loading: false });
    } catch (error: any) {
      // Fallback to defaults if API fails
      set({ tiers: DEFAULT_TIERS, loading: false });
    }
  },

  subscribe: async (tier, appleReceipt) => {
    set({ loading: true, error: null });
    try {
      const response = await api.post('/membership/subscribe', {
        tier,
        apple_receipt: appleReceipt,
      });
      set({ currentMembership: response.data.data, loading: false });
    } catch (error: any) {
      const msg = error.response?.data?.message || 'Subscription failed';
      set({ error: msg, loading: false });
      throw new Error(msg);
    }
  },

  cancelSubscription: async () => {
    set({ loading: true, error: null });
    try {
      await api.post('/membership/cancel');
      set((state) => ({
        currentMembership: state.currentMembership
          ? { ...state.currentMembership, auto_renew: false, status: 'cancelled' as const }
          : null,
        loading: false,
      }));
    } catch (error: any) {
      set({ error: error.response?.data?.message || 'Cancellation failed', loading: false });
    }
  },

  restorePurchases: async (appleReceipt) => {
    set({ loading: true, error: null });
    try {
      const response = await api.post('/membership/restore', { apple_receipt: appleReceipt });
      set({ currentMembership: response.data.data, loading: false });
    } catch (error: any) {
      set({ error: error.response?.data?.message || 'Restore failed', loading: false });
    }
  },

  clearError: () => set({ error: null }),

  reset: () =>
    set({
      currentMembership: null,
      tiers: DEFAULT_TIERS,
      loading: false,
      error: null,
    }),
}));