/**
 * favoriteHallsStore — halls the user marked in the hall finder ("Meine Hallen").
 *
 * Stored on the device only (AsyncStorage); nothing is sent to the server.
 */
import { create } from 'zustand';
import AsyncStorage from '@react-native-async-storage/async-storage';
import type { FoundHall } from '../api/v2';

const STORAGE_KEY = '@tourneo_favorite_halls';
const MAX_FAVORITES = 50;

interface FavoriteHallsState {
  favorites: FoundHall[];
  loaded: boolean;
  load: () => Promise<void>;
  toggle: (hall: FoundHall) => Promise<void>;
  isFavorite: (id: string) => boolean;
}

export const useFavoriteHallsStore = create<FavoriteHallsState>((set, get) => ({
  favorites: [],
  loaded: false,

  load: async () => {
    if (get().loaded) return;
    try {
      const raw = await AsyncStorage.getItem(STORAGE_KEY);
      const parsed = raw ? JSON.parse(raw) : [];
      set({ favorites: Array.isArray(parsed) ? parsed : [], loaded: true });
    } catch {
      set({ favorites: [], loaded: true });
    }
  },

  toggle: async (hall) => {
    const current = get().favorites;
    const next = current.some((f) => f.id === hall.id)
      ? current.filter((f) => f.id !== hall.id)
      : [hall, ...current].slice(0, MAX_FAVORITES);
    set({ favorites: next });
    try {
      await AsyncStorage.setItem(STORAGE_KEY, JSON.stringify(next));
    } catch {
      // keep the in-memory list; it is saved again with the next change
    }
  },

  isFavorite: (id) => get().favorites.some((f) => f.id === id),
}));
