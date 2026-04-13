import { create } from 'zustand';
import api from '../api/client';

export interface Team {
  id: string;
  name: string;
  description?: string;
  avatar_url?: string;
  created_by: string;
  member_count: number;
  members?: TeamMember[];
  created_at: string;
}

export interface TeamMember {
  id: string;
  user_id: string;
  team_id: string;
  role: 'captain' | 'member';
  display_name: string;
  avatar_url?: string;
  joined_at: string;
}

export interface Friend {
  id: string;
  user_id: string;
  friend_user_id: string;
  status: 'pending' | 'accepted' | 'blocked';
  display_name: string;
  avatar_url?: string;
  skill_level?: string;
  created_at: string;
}

export interface UserSearchResult {
  id: string;
  display_name: string;
  avatar_url?: string;
  skill_level?: string;
  is_friend: boolean;
  friendship_status?: string;
}

interface CommunityState {
  teams: Team[];
  currentTeam: Team | null;
  friends: Friend[];
  pendingRequests: Friend[];
  searchResults: UserSearchResult[];
  loading: boolean;
  error: string | null;

  // Teams
  fetchMyTeams: () => Promise<void>;
  fetchTeamById: (id: string) => Promise<void>;
  createTeam: (data: { name: string; description?: string }) => Promise<Team>;
  inviteToTeam: (teamId: string, userId: string) => Promise<void>;
  leaveTeam: (teamId: string) => Promise<void>;

  // Friends
  fetchFriends: () => Promise<void>;
  fetchPendingRequests: () => Promise<void>;
  sendFriendRequest: (userId: string) => Promise<void>;
  acceptFriendRequest: (friendshipId: string) => Promise<void>;
  declineFriendRequest: (friendshipId: string) => Promise<void>;
  removeFriend: (friendshipId: string) => Promise<void>;

  // Search
  searchUsers: (query: string) => Promise<void>;
  clearSearch: () => void;
  clearError: () => void;
}

export const useCommunityStore = create<CommunityState>((set) => ({
  teams: [],
  currentTeam: null,
  friends: [],
  pendingRequests: [],
  searchResults: [],
  loading: false,
  error: null,

  // Teams
  fetchMyTeams: async () => {
    set({ loading: true, error: null });
    try {
      const response = await api.get('/community/teams');
      set({ teams: response.data.data, loading: false });
    } catch (error: any) {
      set({ error: error.response?.data?.message || 'Failed to fetch teams', loading: false });
    }
  },

  fetchTeamById: async (id) => {
    set({ loading: true, error: null });
    try {
      const response = await api.get(`/community/teams/${id}`);
      set({ currentTeam: response.data.data, loading: false });
    } catch (error: any) {
      set({ error: error.response?.data?.message || 'Failed to fetch team', loading: false });
    }
  },

  createTeam: async (data) => {
    set({ loading: true, error: null });
    try {
      const response = await api.post('/community/teams', data);
      const team = response.data.data;
      set((state) => ({ teams: [team, ...state.teams], loading: false }));
      return team;
    } catch (error: any) {
      const msg = error.response?.data?.message || 'Failed to create team';
      set({ error: msg, loading: false });
      throw new Error(msg);
    }
  },

  inviteToTeam: async (teamId, userId) => {
    set({ loading: true, error: null });
    try {
      await api.post(`/community/teams/${teamId}/invite`, { user_id: userId });
      set({ loading: false });
    } catch (error: any) {
      set({ error: error.response?.data?.message || 'Failed to invite', loading: false });
    }
  },

  leaveTeam: async (teamId) => {
    set({ loading: true, error: null });
    try {
      await api.post(`/community/teams/${teamId}/leave`);
      set((state) => ({
        teams: state.teams.filter((t) => t.id !== teamId),
        loading: false,
      }));
    } catch (error: any) {
      set({ error: error.response?.data?.message || 'Failed to leave team', loading: false });
    }
  },

  // Friends
  fetchFriends: async () => {
    set({ loading: true, error: null });
    try {
      const response = await api.get('/community/friends');
      set({ friends: response.data.data, loading: false });
    } catch (error: any) {
      set({ error: error.response?.data?.message || 'Failed to fetch friends', loading: false });
    }
  },

  fetchPendingRequests: async () => {
    set({ loading: true, error: null });
    try {
      const response = await api.get('/community/friends/pending');
      set({ pendingRequests: response.data.data, loading: false });
    } catch (error: any) {
      set({ error: error.response?.data?.message || 'Failed to fetch requests', loading: false });
    }
  },

  sendFriendRequest: async (userId) => {
    set({ loading: true, error: null });
    try {
      await api.post('/community/friends/request', { friend_user_id: userId });
      set({ loading: false });
    } catch (error: any) {
      set({ error: error.response?.data?.message || 'Failed to send request', loading: false });
    }
  },

  acceptFriendRequest: async (friendshipId) => {
    set({ loading: true, error: null });
    try {
      await api.post(`/community/friends/${friendshipId}/accept`);
      set((state) => ({
        pendingRequests: state.pendingRequests.filter((r) => r.id !== friendshipId),
        loading: false,
      }));
    } catch (error: any) {
      set({ error: error.response?.data?.message || 'Failed to accept', loading: false });
    }
  },

  declineFriendRequest: async (friendshipId) => {
    set({ loading: true, error: null });
    try {
      await api.post(`/community/friends/${friendshipId}/decline`);
      set((state) => ({
        pendingRequests: state.pendingRequests.filter((r) => r.id !== friendshipId),
        loading: false,
      }));
    } catch (error: any) {
      set({ error: error.response?.data?.message || 'Failed to decline', loading: false });
    }
  },

  removeFriend: async (friendshipId) => {
    set({ loading: true, error: null });
    try {
      await api.delete(`/community/friends/${friendshipId}`);
      set((state) => ({
        friends: state.friends.filter((f) => f.id !== friendshipId),
        loading: false,
      }));
    } catch (error: any) {
      set({ error: error.response?.data?.message || 'Failed to remove friend', loading: false });
    }
  },

  searchUsers: async (query) => {
    set({ loading: true, error: null });
    try {
      const response = await api.get('/community/search', { params: { q: query } });
      set({ searchResults: response.data.data, loading: false });
    } catch (error: any) {
      set({ error: error.response?.data?.message || 'Search failed', loading: false });
    }
  },

  clearSearch: () => set({ searchResults: [] }),
  clearError: () => set({ error: null }),
}));