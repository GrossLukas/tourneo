import { create } from 'zustand';
import apiClient from '../api/client';

export interface Event {
  id: number;
  uuid: string;
  title: string;
  description: string | null;
  sport_category: string;
  start_date: string;
  end_date: string;
  registration_opens_at: string;
  registration_closes_at: string;
  club_early_access_at: string | null;
  plus_early_access_at: string | null;
  is_indoor: boolean;
  is_outdoor: boolean;
  format: string;
  max_participants: number;
  entry_fee_cents: number;
  currency: string;
  total_prize_pool_cents: number;
  level: string;
  access_type: string;
  has_food_drinks: boolean;
  has_streaming: boolean;
  special_notes: string | null;
  rules_summary?: string | null;
  requires_playtomic_verification?: boolean;
  min_playtomic_level?: number | null;
  max_playtomic_level?: number | null;
  eligibility_note?: string | null;
  nearby_radius_km?: number | null;
  maintenance_mode?: boolean;
  maintenance_message?: string | null;
  checkin_opens_minutes_before?: number | null;
  waitlist_payment_window_hours?: number | null;
  banner_image_url: string | null;
  status: string;
  participant_count: number;
  spots_remaining: number;
  distance_km?: number | null;
  venue: {
    name: string | null;
    city: string | null;
    address_street?: string | null;
    address_zip?: string | null;
    latitude?: number | null;
    longitude?: number | null;
  };
  prize_distribution?: Array<{
    place: number;
    amount_cents: number;
    label: string | null;
  }>;
}

interface EventState {
  events: Event[];
  currentEvent: Event | null;
  loading: boolean;
  error: string | null;
  filters: Record<string, any>;
  meta: { page: number; total: number; total_pages: number };

  fetchEvents: (filters?: Record<string, any>) => Promise<void>;
  fetchEventById: (id: number) => Promise<void>;
  setFilters: (filters: Record<string, any>) => void;
  clearFilters: () => void;
  reset: () => void;
}

export const useEventStore = create<EventState>((set, get) => ({
  events: [],
  currentEvent: null,
  loading: false,
  error: null,
  filters: {},
  meta: { page: 1, total: 0, total_pages: 0 },

  fetchEvents: async (filters?: Record<string, any>) => {
    set({ loading: true, error: null });
    try {
      const params = { ...get().filters, ...filters };
      const response = await apiClient.get('/events', { params });
      // The backend always returns { data: Event[], meta: {...} } for the
      // listing endpoint, but be defensive: if data is missing/null we
      // fall back to an empty list so consumers can safely .map() it.
      const data = Array.isArray(response.data?.data) ? response.data.data : [];
      const meta = response.data?.meta ?? { page: 1, total: 0, total_pages: 0 };
      set({
        events: data,
        meta,
        loading: false,
      });
    } catch (error) {
      set({ loading: false, error: 'Turniere konnten nicht geladen werden.' });
      logDevFetchError('[events] fetch failed:', error);
    }
  },

  fetchEventById: async (id: number) => {
    set({ loading: true, error: null });
    try {
      const response = await apiClient.get(`/events/${id}`);
      set({ currentEvent: response.data.data, loading: false });
    } catch (error) {
      set({ loading: false, error: 'Event konnte nicht geladen werden.' });
      logDevFetchError('[events] fetch detail failed:', error);
    }
  },

  setFilters: (filters: Record<string, any>) => {
    set({ filters: { ...get().filters, ...filters } });
  },

  clearFilters: () => {
    set({ filters: {} });
  },

  reset: () => {
    set({
      events: [],
      currentEvent: null,
      loading: false,
      error: null,
      filters: {},
      meta: { page: 1, total: 0, total_pages: 0 },
    });
  },
}));

function readableError(error: unknown): string {
  if (error && typeof error === 'object' && 'message' in error) {
    return String((error as { message?: unknown }).message);
  }
  return String(error);
}

function logDevFetchError(prefix: string, error: unknown) {
  if (__DEV__ && process.env.NODE_ENV !== 'test') {
    console.log(prefix, readableError(error));
  }
}
