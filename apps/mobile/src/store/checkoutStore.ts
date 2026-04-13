/**
 * checkoutStore – Manages Stripe checkout flow for tournament registration.
 * States: idle → loading → redirecting → success | error | cancelled
 */
import { create } from 'zustand';
import * as WebBrowser from 'expo-web-browser';
import apiClient from '../api/client';

export type CheckoutStatus = 'idle' | 'loading' | 'redirecting' | 'success' | 'error' | 'cancelled';

interface CheckoutSession {
  sessionId: string;
  checkoutUrl: string;
  eventId: number;
  eventTitle: string;
  amount: number;
  currency: string;
}

interface CheckoutStoreState {
  status: CheckoutStatus;
  session: CheckoutSession | null;
  error: string | null;

  createCheckoutSession: (eventId: number) => Promise<void>;
  openCheckout: () => Promise<void>;
  handleDeepLinkReturn: (url: string) => void;
  reset: () => void;
}

export const useCheckoutStore = create<CheckoutStoreState>((set, get) => ({
  status: 'idle',
  session: null,
  error: null,

  createCheckoutSession: async (eventId: number) => {
    set({ status: 'loading', error: null });
    try {
      const response = await apiClient.post(`/events/${eventId}/checkout`);
      const data = response.data.data;
      set({
        status: 'idle',
        session: {
          sessionId: data.session_id,
          checkoutUrl: data.checkout_url,
          eventId: data.event_id,
          eventTitle: data.event_title,
          amount: data.amount,
          currency: data.currency || 'eur',
        },
      });
    } catch (error: unknown) {
      const msg = (error as { response?: { data?: { error?: { message?: string } } } })
        ?.response?.data?.error?.message || 'Checkout konnte nicht erstellt werden.';
      set({ status: 'error', error: msg });
    }
  },

  openCheckout: async () => {
    const { session } = get();
    if (!session?.checkoutUrl) {
      set({ status: 'error', error: 'Keine Checkout-URL vorhanden.' });
      return;
    }

    set({ status: 'redirecting' });
    try {
      const result = await WebBrowser.openAuthSessionAsync(
        session.checkoutUrl,
        'tourneo://checkout/callback'
      );

      if (result.type === 'success' && result.url) {
        get().handleDeepLinkReturn(result.url);
      } else if (result.type === 'cancel' || result.type === 'dismiss') {
        set({ status: 'cancelled' });
      }
    } catch {
      set({ status: 'error', error: 'Browser konnte nicht geöffnet werden.' });
    }
  },

  handleDeepLinkReturn: (url: string) => {
    if (url.includes('success') || url.includes('status=paid')) {
      set({ status: 'success' });
    } else if (url.includes('cancel')) {
      set({ status: 'cancelled' });
    } else {
      set({ status: 'error', error: 'Unbekannter Zahlungsstatus.' });
    }
  },

  reset: () => set({ status: 'idle', session: null, error: null }),
}));