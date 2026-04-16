/**
 * favoritesStore – Bookmark/Favorites management for events.
 * Persists favorite event IDs to AsyncStorage.
 */
import { create } from 'zustand';
import AsyncStorage from '@react-native-async-storage/async-storage';

const FAVORITES_KEY = '@tourneo_favorites';

interface FavoritesStoreState {
  favorites: number[];
  toggleFavorite: (eventId: number) => Promise<void>;
  isFavorite: (eventId: number) => boolean;
  hydrate: () => Promise<void>;
}

export const useFavoritesStore = create<FavoritesStoreState>((set, get) => ({
  favorites: [],

  hydrate: async () => {
    try {
      const stored = await AsyncStorage.getItem(FAVORITES_KEY);
      if (stored) {
        const parsed: number[] = JSON.parse(stored);
        set({ favorites: Array.isArray(parsed) ? parsed : [] });
      }
    } catch {
      // Silently fail – favorites are a non-critical feature
    }
  },

  toggleFavorite: async (eventId: number) => {
    const current = get().favorites;
    const next = current.includes(eventId)
      ? current.filter((id) => id !== eventId)
      : [...current, eventId];
    set({ favorites: next });
    try {
      await AsyncStorage.setItem(FAVORITES_KEY, JSON.stringify(next));
    } catch {
      // Revert optimistic update on storage failure
      set({ favorites: current });
    }
  },

  isFavorite: (eventId: number) => {
    return get().favorites.includes(eventId);
  },
}));
