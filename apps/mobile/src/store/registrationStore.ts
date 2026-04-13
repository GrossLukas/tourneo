import { create } from 'zustand';
import api from '../api/client';

export interface Registration {
  id: string;
  event_id: string;
  user_id: string;
  registration_type: 'solo' | 'duo' | 'team';
  partner_user_id?: string;
  team_id?: string;
  status: 'confirmed' | 'waitlisted' | 'cancelled' | 'checked_in' | 'no_show';
  fee_amount: number;
  fee_discount_percent: number;
  fee_final: number;
  payment_status: 'pending' | 'completed' | 'refunded' | 'failed';
  seed_number?: number;
  waitlist_position?: number;
  checked_in_at?: string;
  cancellation_reason?: string;
  refund_amount?: number;
  created_at: string;
  // Joined fields
  event_title?: string;
  event_date?: string;
  event_location?: string;
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
    event_id: string;
    registration_type: 'solo' | 'duo' | 'team';
    partner_user_id?: string;
    team_id?: string;
  }) => Promise<Registration>;
  cancelRegistration: (id: string, reason?: string) => Promise<void>;
  getRegistrationById: (id: string) => Promise<void>;
  clearError: () => void;
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
      set({ myRegistrations: response.data.data, loading: false });
    } catch (error: any) {
      set({ error: error.response?.data?.message || 'Failed to fetch registrations', loading: false });
    }
  },

  registerForEvent: async (data) => {
    set({ loading: true, error: null });
    try {
      const response = await api.post('/registrations', data);
      const registration = response.data.data;
      set((state) => ({
        myRegistrations: [registration, ...state.myRegistrations],
        currentRegistration: registration,
        loading: false,
      }));
      return registration;
    } catch (error: any) {
      const message = error.response?.data?.message || 'Registration failed';
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
          r.id === id ? { ...r, status: 'cancelled' as const } : r
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
      set({ currentRegistration: response.data.data, loading: false });
    } catch (error: any) {
      set({ error: error.response?.data?.message || 'Failed to fetch registration', loading: false });
    }
  },

  clearError: () => set({ error: null }),
}));