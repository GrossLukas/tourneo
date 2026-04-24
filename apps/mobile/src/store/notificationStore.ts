import { create } from 'zustand';
import { Platform } from 'react-native';
import api from '../api/client';

export interface AppNotification {
  id: string;
  user_id: string;
  type: 'event_reminder' | 'registration_confirmed' | 'waitlist_promoted' | 'bracket_published' |
    'match_upcoming' | 'match_result' | 'friend_request' | 'team_invite' | 'payment_confirmed' |
    'payment_refunded' | 'membership_expiring' | 'system_announcement';
  title: string;
  body: string;
  data?: Record<string, any>;
  read: boolean;
  created_at: string;
}

interface NotificationState {
  notifications: AppNotification[];
  unreadCount: number;
  loading: boolean;
  error: string | null;
  pushToken: string | null;

  fetchNotifications: () => Promise<void>;
  markAsRead: (id: string) => Promise<void>;
  markAllAsRead: () => Promise<void>;
  deleteNotification: (id: string) => Promise<void>;
  registerPushToken: (token: string) => Promise<void>;
  setPushToken: (token: string) => void;
  clearError: () => void;
  reset: () => void;
}

export const useNotificationStore = create<NotificationState>((set) => ({
  notifications: [],
  unreadCount: 0,
  loading: false,
  error: null,
  pushToken: null,

  fetchNotifications: async () => {
    set({ loading: true, error: null });
    try {
      const response = await api.get('/notifications');
      const notifications = response.data.data || [];
      const unreadCount = notifications.filter((n: AppNotification) => !n.read).length;
      set({ notifications, unreadCount, loading: false });
    } catch (error: any) {
      set({ error: error.response?.data?.message || 'Failed to fetch notifications', loading: false });
    }
  },

  markAsRead: async (id) => {
    try {
      await api.post(`/notifications/${id}/read`);
      set((state) => {
        const updated = state.notifications.map((n) =>
          n.id === id ? { ...n, read: true } : n
        );
        return {
          notifications: updated,
          unreadCount: updated.filter((n) => !n.read).length,
        };
      });
    } catch (error: any) {
      // Silent fail for mark as read
    }
  },

  markAllAsRead: async () => {
    try {
      await api.post('/notifications/read-all');
      set((state) => ({
        notifications: state.notifications.map((n) => ({ ...n, read: true })),
        unreadCount: 0,
      }));
    } catch (error: any) {
      // Silent fail
    }
  },

  deleteNotification: async (id) => {
    try {
      await api.delete(`/notifications/${id}`);
      set((state) => {
        const filtered = state.notifications.filter((n) => n.id !== id);
        return {
          notifications: filtered,
          unreadCount: filtered.filter((n) => !n.read).length,
        };
      });
    } catch (error: any) {
      set({ error: error.response?.data?.message || 'Failed to delete', loading: false });
    }
  },

  registerPushToken: async (token) => {
    try {
      await api.post('/notifications/push-token', {
        push_token: token,
        platform: Platform.OS === 'android' ? 'android' : 'ios',
      });
      set({ pushToken: token });
    } catch (error: any) {
      if (__DEV__) {
        console.warn('[notifications] registerPushToken failed:', error?.response?.status, error?.response?.data);
      }
    }
  },

  setPushToken: (token) => set({ pushToken: token }),
  clearError: () => set({ error: null }),

  reset: () =>
    set({
      notifications: [],
      unreadCount: 0,
      loading: false,
      error: null,
      pushToken: null,
    }),
}));