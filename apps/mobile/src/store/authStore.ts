import { create } from 'zustand';
import * as SecureStore from 'expo-secure-store';
import apiClient from '../api/client';

interface User {
  id: number;
  uuid: string;
  email: string;
  first_name: string;
  last_name: string;
  display_name?: string;
  avatar_url?: string;
  role: 'user' | 'admin' | 'superadmin';
  membership_tier: 'free' | 'plus' | 'club';
}

interface AuthState {
  user: User | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  isInitialized: boolean;

  initialize: () => Promise<void>;
  login: (email: string, password: string) => Promise<void>;
  register: (data: any) => Promise<void>;
  logout: () => Promise<void>;
  updateUser: (data: Partial<User>) => void;
  refreshProfile: () => Promise<void>;
}

export const useAuthStore = create<AuthState>((set, get) => ({
  user: null,
  isAuthenticated: false,
  isLoading: false,
  isInitialized: false,

  initialize: async () => {
    try {
      const token = await SecureStore.getItemAsync('access_token');
      if (token) {
        const response = await apiClient.get('/auth/me');
        set({
          user: response.data.data,
          isAuthenticated: true,
          isInitialized: true,
        });
      } else {
        set({ isInitialized: true });
      }
    } catch {
      await SecureStore.deleteItemAsync('access_token');
      await SecureStore.deleteItemAsync('refresh_token');
      set({ isInitialized: true });
    }
  },

  login: async (email: string, password: string) => {
    set({ isLoading: true });
    try {
      const response = await apiClient.post('/auth/login', { email, password });
      const { user, access_token, refresh_token } = response.data.data;
      await SecureStore.setItemAsync('access_token', access_token);
      await SecureStore.setItemAsync('refresh_token', refresh_token);
      set({ user, isAuthenticated: true, isLoading: false });
    } catch (error: any) {
      set({ isLoading: false });
      throw new Error(error.response?.data?.error?.message || 'Login failed');
    }
  },

  register: async (data: any) => {
    set({ isLoading: true });
    try {
      const response = await apiClient.post('/auth/register', data);
      const { user, access_token, refresh_token } = response.data.data;
      await SecureStore.setItemAsync('access_token', access_token);
      await SecureStore.setItemAsync('refresh_token', refresh_token);
      set({ user, isAuthenticated: true, isLoading: false });
    } catch (error: any) {
      set({ isLoading: false });
      throw new Error(error.response?.data?.error?.message || 'Registration failed');
    }
  },

  logout: async () => {
    try {
      await apiClient.post('/auth/logout');
    } catch {}
    await SecureStore.deleteItemAsync('access_token');
    await SecureStore.deleteItemAsync('refresh_token');
    set({ user: null, isAuthenticated: false });
  },

  updateUser: (data: Partial<User>) => {
    const current = get().user;
    if (current) {
      set({ user: { ...current, ...data } });
    }
  },

  refreshProfile: async () => {
    try {
      const response = await apiClient.get('/auth/me');
      set({ user: response.data.data });
    } catch {}
  },
}));