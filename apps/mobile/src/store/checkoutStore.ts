/**
 * checkoutStore – Manages Stripe checkout flow for tournament registration.
 * States: idle → loading → redirecting → success | error | cancelled
 *
 * Flow:
 *   1. Caller passes a registrationId (created via registrationStore.registerForEvent)
 *   2. createCheckoutSession() calls POST /payments/create-intent → returns PaymentIntent
 *   3. openCheckout() opens Stripe Checkout via WebBrowser (or shows the PI client_secret
 *      to a native PaymentSheet when @stripe/stripe-react-native is present)
 *   4. Backend confirms via webhook → registration becomes "confirmed"
 */
import { create } from 'zustand';
import * as WebBrowser from 'expo-web-browser';
import apiClient from '../api/client';

export type CheckoutStatus = 'idle' | 'loading' | 'redirecting' | 'success' | 'error' | 'cancelled';

interface CheckoutSession {
  registrationId: number;
  paymentIntentId: string;
  clientSecret: string;
  amount: number;
  currency: string;
  free?: boolean;
}

interface CheckoutStoreState {
  status: CheckoutStatus;
  session: CheckoutSession | null;
  error: string | null;

  /**
   * Loads PaymentIntent from backend.
   * If `registrationId` is provided uses it directly,
   * otherwise creates a registration for the given eventId first.
   */
  createCheckoutSession: (eventId: number, registrationId?: number) => Promise<void>;
  openCheckout: () => Promise<void>;
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
      // Step 1: Ensure we have a registration
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

      // Step 2: Ask backend to create the PaymentIntent for this registration
      const response = await apiClient.post('/payments/create-intent', {
        registration_id: regId,
      });
      const data = response.data.data;

      // Free / fully discounted registration → no payment necessary
      if (data.free) {
        set({
          status: 'success',
          session: {
            registrationId: regId!,
            paymentIntentId: '',
            clientSecret: '',
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
          paymentIntentId: data.payment_intent_id,
          clientSecret: data.client_secret,
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
    if (!session?.clientSecret) {
      set({ status: 'error', error: 'Keine Zahlungsdaten vorhanden.' });
      return;
    }

    // If the session is free we are already done
    if (session.free) {
      set({ status: 'success' });
      return;
    }

    set({ status: 'redirecting' });
    try {
      // We open Stripe's hosted PaymentIntent confirmation page via WebBrowser.
      // The mobile app receives the result via the tourneo:// scheme. The actual
      // payment confirmation happens server-side via the Stripe webhook
      // (payment_intent.succeeded) so we only need to react to user dismissal here.
      const url =
        `https://hooks.stripe.com/redirect/authenticate/src_${session.paymentIntentId}` +
        `?client_secret=${encodeURIComponent(session.clientSecret)}` +
        `&return_url=${encodeURIComponent('tourneo://checkout/callback')}`;

      const result = await WebBrowser.openAuthSessionAsync(url, 'tourneo://checkout/callback');

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
    if (url.includes('success') || url.includes('status=paid') || url.includes('succeeded')) {
      set({ status: 'success' });
    } else if (url.includes('cancel')) {
      set({ status: 'cancelled' });
    } else {
      // Default: assume payment processing - the webhook will confirm
      set({ status: 'success' });
    }
  },

  reset: () => set({ status: 'idle', session: null, error: null }),
}));
