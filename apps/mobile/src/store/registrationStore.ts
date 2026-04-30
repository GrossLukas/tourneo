import { create } from 'zustand';
import api from '../api/client';

export interface Registration {
  id: string;
  event_id: string;
  user_id: string;
  registration_type: 'solo' | 'duo' | 'team';
  partner_user_id?: string | number;
  team_id?: string | number;
  status:
    | 'pending_verification'
    | 'pending_payment'
    | 'confirmed'
    | 'waitlisted'
    | 'cancelled'
    | 'refunded'
    | 'rejected'
    | 'checked_in'
    | 'no_show';
  eligibility_status?: 'not_required' | 'pending' | 'approved' | 'rejected';
  eligibility_note?: string | null;
  requires_verification?: boolean;
  requires_payment?: boolean;
  fee_amount: number;
  fee_discount_percent: number;
  fee_final: number;
  payment_status: 'pending' | 'completed' | 'refunded' | 'failed';
  seed_number?: number;
  waitlist_position?: number;
  checked_in?: boolean;
  checked_in_at?: string;
  cancellation_reason?: string;
  refund_amount?: number;
  created_at: string;
  // Joined fields
  event_title?: string;
  event_date?: string;
  event_location?: string;
  event_entry_fee_cents?: number;
  net_fee_cents?: number;
  event_currency?: string;
  partner_name?: string;
  team_name?: string;
}

interface RegistrationState {
  myRegistrations: Registration[];
  currentRegistration: Registration | null;
  loading: boolean;
  error: string | null;

  fetchMyRegistrations: () => Promise<void>;
  registerForEvent: (data: {
    event_id: string | number;
    registration_type: 'solo' | 'duo' | 'team';
    partner_user_id?: string | number;
    partner_email?: string;
    team_id?: string | number;
    consent_media?: boolean;
    playtomic_level?: number;
    playtomic_screenshot_url?: string;
  }) => Promise<Registration>;
  cancelRegistration: (id: string, reason?: string) => Promise<void>;
  getRegistrationById: (id: string) => Promise<void>;
  clearError: () => void;
  reset: () => void;
}

export const useRegistrationStore = create<RegistrationState>((set, get) => ({
  myRegistrations: [],
  currentRegistration: null,
  loading: false,
  error: null,

  fetchMyRegistrations: async () => {
    set({ loading: true, error: null });
    try {
      const response = await api.get('/registrations/my');
      set({ myRegistrations: (response.data.data || []).map(normalizeRegistration), loading: false });
    } catch (error: any) {
      set({ error: error.response?.data?.message || 'Failed to fetch registrations', loading: false });
    }
  },

  registerForEvent: async (data) => {
    set({ loading: true, error: null });
    try {
      const eventId = Number(data.event_id);
      const partnerId = data.partner_user_id != null ? Number(data.partner_user_id) : undefined;
      const teamId = data.team_id != null ? Number(data.team_id) : undefined;

      if (!Number.isFinite(eventId)) {
        throw new Error('Invalid event ID');
      }
      if (data.registration_type === 'team' && !Number.isFinite(teamId)) {
        throw new Error('Team is required for team registration');
      }

      const response = await api.post('/registrations', {
        event_id: eventId,
        registration_type: data.registration_type,
        partner_user_id: Number.isFinite(partnerId) ? partnerId : undefined,
        partner_email: data.partner_email?.trim() || undefined,
        team_id: Number.isFinite(teamId) ? teamId : undefined,
        consent_tournament_terms: true,
        consent_age_verified: true,
        consent_media: data.consent_media ?? false,
        playtomic_level: data.playtomic_level,
        playtomic_screenshot_url: data.playtomic_screenshot_url,
      });
      const registration = normalizeRegistration(response.data.data);
      set((state) => ({
        myRegistrations: [registration, ...state.myRegistrations],
        currentRegistration: registration,
        loading: false,
      }));
      return registration;
    } catch (error: any) {
      const message =
        error.response?.data?.error?.message ||
        error.response?.data?.message ||
        error.message ||
        'Registration failed';
      set({ error: message, loading: false });
      throw new Error(message);
    }
  },

  cancelRegistration: async (id, reason) => {
    set({ loading: true, error: null });
    try {
      await api.post(`/registrations/${id}/cancel`, { reason });
      set((state) => ({
        myRegistrations: state.myRegistrations.map((r) =>
          String(r.id) === String(id) ? { ...r, status: 'cancelled' as const } : r
        ),
        loading: false,
      }));
    } catch (error: any) {
      set({ error: error.response?.data?.message || 'Cancellation failed', loading: false });
    }
  },

  getRegistrationById: async (id) => {
    set({ loading: true, error: null });
    try {
      const response = await api.get(`/registrations/${id}`);
      set({ currentRegistration: normalizeRegistration(response.data.data), loading: false });
    } catch (error: any) {
      set({ error: error.response?.data?.message || 'Failed to fetch registration', loading: false });
    }
  },

  clearError: () => set({ error: null }),

  reset: () =>
    set({
      myRegistrations: [],
      currentRegistration: null,
      loading: false,
      error: null,
    }),
}));

function normalizeRegistration(raw: any): Registration {
  return {
    ...raw,
    id: String(raw.id),
    event_id: String(raw.event_id),
    user_id: raw.user_id != null ? String(raw.user_id) : raw.user_id,
  } as Registration;
}
