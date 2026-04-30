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
      const response = await api.get('/membership');
      set({ currentMembership: normalizeMembership(response.data.data), loading: false });
    } catch (error: any) {
      set({ error: error.response?.data?.message || 'Failed to fetch membership', loading: false });
    }
  },

  fetchTiers: async () => {
    set({ loading: true, error: null });
    try {
      const response = await api.get('/membership/tiers');
      const payload = response.data.data;
      const rawTiers = Array.isArray(payload) ? payload : payload?.tiers;
      const tiers = Array.isArray(rawTiers)
        ? rawTiers.map(normalizeTier).filter(Boolean)
        : DEFAULT_TIERS;
      set({ tiers: tiers.length > 0 ? tiers : DEFAULT_TIERS, loading: false });
    } catch (error: any) {
      // Fallback to defaults if API fails
      set({ tiers: DEFAULT_TIERS, loading: false });
    }
  },

  subscribe: async (tier, appleReceipt) => {
    set({ loading: true, error: null });
    try {
      const productId = DEFAULT_TIERS.find((entry) => entry.tier === tier)?.apple_product_id;
      const response = await api.post('/membership/subscribe', {
        receipt_data: appleReceipt,
        product_id: productId,
      });
      set({ currentMembership: normalizeMembership(response.data.data), loading: false });
    } catch (error: any) {
      const msg = error.response?.data?.message || 'Subscription failed';
      set({ error: msg, loading: false });
      throw new Error(msg);
    }
  },

  cancelSubscription: async () => {
    set({ loading: true, error: null });
    try {
      await api.put('/membership/cancel');
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
      const response = await api.put('/membership/restore', { apple_receipt: appleReceipt });
      set({ currentMembership: normalizeMembership(response.data.data), loading: false });
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

function normalizeTier(raw: any): MembershipTierInfo {
  const tier = (raw?.tier ?? raw?.id ?? 'free') as MembershipTier;
  const labels = raw?.feature_labels ?? {};
  const featureKeys = Array.isArray(raw?.features) ? raw.features : [];
  const defaultTier = DEFAULT_TIERS.find((entry) => entry.tier === tier) ?? DEFAULT_TIERS[0];

  return {
    tier,
    name: String(raw?.name ?? defaultTier.name).replace(/^Tourneo\s+/i, ''),
    price_monthly: typeof raw?.price_monthly === 'number'
      ? raw.price_monthly
      : Number(raw?.price_cents ?? defaultTier.price_monthly * 100) / 100,
    apple_product_id: raw?.apple_product_id ?? defaultTier.apple_product_id,
    features: featureKeys.length > 0
      ? featureKeys.map((feature: string) => labels[feature] ?? feature)
      : defaultTier.features,
    early_access_hours: Number(raw?.early_access_hours ?? defaultTier.early_access_hours),
    discount_percent: Number(raw?.discount_percent ?? defaultTier.discount_percent),
    highlighted: Boolean(raw?.highlighted ?? tier === 'plus'),
  };
}

function normalizeMembership(raw: any): MembershipInfo | null {
  if (!raw) return null;

  const tier = (raw.tier ?? raw.current_tier ?? 'free') as MembershipTier;
  const renewal = raw.renewal ?? {};

  return {
    id: String(raw.id ?? raw.membership_id ?? tier),
    user_id: String(raw.user_id ?? ''),
    tier,
    status: raw.status ?? 'active',
    started_at: raw.started_at ?? '',
    expires_at: raw.expires_at ?? renewal.expires_at ?? undefined,
    auto_renew: Boolean(raw.auto_renew ?? renewal.auto_renew ?? false),
    apple_product_id: raw.apple_product_id,
    apple_transaction_id: raw.apple_transaction_id ?? renewal.apple_subscription_id,
  };
}
