/**
 * checkoutStore - Stripe Checkout flow for tournament registrations.
 * Backend creates the Checkout Session and remains the source of truth.
 */
import { create } from 'zustand';
import * as WebBrowser from 'expo-web-browser';
import apiClient from '../api/client';

export type CheckoutStatus = 'idle' | 'loading' | 'redirecting' | 'success' | 'error' | 'cancelled';

interface CheckoutSession {
  registrationId: number;
  paymentIntentId: string;
  clientSecret: string;
  checkoutUrl?: string;
  checkoutSessionId?: string;
  amount: number;
  currency: string;
  free?: boolean;
}

interface CheckoutStoreState {
  status: CheckoutStatus;
  session: CheckoutSession | null;
  error: string | null;
  createCheckoutSession: (eventId: number, registrationId?: number) => Promise<void>;
  openCheckout: () => Promise<CheckoutStatus>;
  handleDeepLinkReturn: (url: string) => void;
  reset: () => void;
}

export const useCheckoutStore = create<CheckoutStoreState>((set, get) => ({
  status: 'idle',
  session: null,
  error: null,

  createCheckoutSession: async (eventId: number, registrationId?: number) => {
    set({ status: 'loading', error: null });
    try {
      let regId = registrationId;
      if (!regId) {
        const regResponse = await apiClient.post('/registrations', {
          event_id: eventId,
          registration_type: 'solo',
          consent_tournament_terms: true,
          consent_age_verified: true,
          consent_media: false,
        });
        regId = regResponse.data?.data?.id;
        if (!regId) throw new Error('Konnte Anmeldung nicht erstellen.');
      }

      const response = await apiClient.post('/payments/create-checkout-session', {
        registration_id: regId,
      });
      const data = response.data.data;

      if (data.free) {
        set({
          status: 'success',
          session: {
            registrationId: regId!,
            paymentIntentId: '',
            clientSecret: '',
            checkoutUrl: '',
            checkoutSessionId: '',
            amount: 0,
            currency: 'eur',
            free: true,
          },
        });
        return;
      }

      set({
        status: 'idle',
        session: {
          registrationId: regId!,
          paymentIntentId: data.payment_intent_id || '',
          clientSecret: data.client_secret || '',
          checkoutUrl: data.checkout_url,
          checkoutSessionId: data.checkout_session_id,
          amount: data.amount_cents,
          currency: (data.currency || 'EUR').toLowerCase(),
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
    if (session?.free) {
      set({ status: 'success' });
      return 'success';
    }

    if (!session?.checkoutUrl) {
      set({ status: 'error', error: 'Keine Zahlungsdaten vorhanden.' });
      return 'error';
    }

    set({ status: 'redirecting' });
    try {
      const result = await WebBrowser.openAuthSessionAsync(session.checkoutUrl, 'tourneo://checkout/callback');
      if (result.type === 'success' && result.url) {
        get().handleDeepLinkReturn(result.url);
        return get().status;
      }
      if (result.type === 'cancel' || result.type === 'dismiss') {
        set({ status: 'cancelled' });
        return 'cancelled';
      }
      set({ status: 'cancelled' });
      return 'cancelled';
    } catch {
      set({ status: 'error', error: 'Browser konnte nicht geöffnet werden.' });
      return 'error';
    }
  },

  handleDeepLinkReturn: (url: string) => {
    if (url.includes('success') || url.includes('status=paid') || url.includes('succeeded')) {
      set({ status: 'success' });
    } else if (url.includes('cancel')) {
      set({ status: 'cancelled' });
    } else {
      set({ status: 'success' });
    }
  },

  reset: () => set({ status: 'idle', session: null, error: null }),
}));
