import { create } from 'zustand';
import api from '../api/client';

export interface Venue {
  id: string;
  name: string;
  slug: string;
  description?: string;
  address_street: string;
  address_city: string;
  address_zip: string;
  address_country: string;
  latitude?: number;
  longitude?: number;
  phone?: string;
  email?: string;
  website?: string;
  image_url?: string;
  is_active: boolean;
  courts?: Court[];
  booking_links?: ExternalBookingLink[];
  created_at: string;
}

export interface Court {
  id: string;
  venue_id: string;
  name: string;
  court_type: 'indoor' | 'outdoor' | 'covered';
  surface: 'turf' | 'concrete' | 'glass';
  is_active: boolean;
}

export interface ExternalBookingLink {
  id: string;
  venue_id: string;
  provider_name: string;
  booking_url: string;
  description?: string;
}

interface VenueState {
  venues: Venue[];
  currentVenue: Venue | null;
  loading: boolean;
  error: string | null;
  filters: {
    city?: string;
    search?: string;
  };

  fetchVenues: () => Promise<void>;
  fetchVenueById: (id: string) => Promise<void>;
  setFilters: (filters: Partial<VenueState['filters']>) => void;
  clearFilters: () => void;
  clearError: () => void;
}

export const useVenueStore = create<VenueState>((set, get) => ({
  venues: [],
  currentVenue: null,
  loading: false,
  error: null,
  filters: {},

  fetchVenues: async () => {
    set({ loading: true, error: null });
    try {
      const { filters } = get();
      const response = await api.get('/venues', { params: filters });
      set({ venues: response.data.data, loading: false });
    } catch (error: any) {
      set({ error: error.response?.data?.message || 'Failed to fetch venues', loading: false });
    }
  },

  fetchVenueById: async (id) => {
    set({ loading: true, error: null });
    try {
      const response = await api.get(`/venues/${id}`);
      set({ currentVenue: response.data.data, loading: false });
    } catch (error: any) {
      set({ error: error.response?.data?.message || 'Failed to fetch venue', loading: false });
    }
  },

  setFilters: (filters) => {
    set((state) => ({ filters: { ...state.filters, ...filters } }));
  },

  clearFilters: () => set({ filters: {} }),
  clearError: () => set({ error: null }),
}));