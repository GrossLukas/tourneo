/**
 * ratingStore – ELO/Skill rating system.
 * Fetches player ratings, leaderboards, and tier information.
 */
import { create } from 'zustand';
import apiClient from '../api/client';

export type RatingTier = 'bronze' | 'silver' | 'gold' | 'platinum' | 'diamond';
export type SportCategory = 'padel' | 'fifa' | 'overall';

export interface PlayerRating {
  user_id: number;
  display_name: string;
  avatar_url?: string;
  elo: number;
  rank: number;
  tier: RatingTier;
  wins: number;
  losses: number;
  streak: number; // positive = win streak, negative = loss streak
  sport: SportCategory;
  games_played: number;
  last_updated: string;
}

export interface LeaderboardEntry {
  user_id: number;
  display_name: string;
  avatar_url?: string;
  elo: number;
  rank: number;
  tier: RatingTier;
  wins: number;
  losses: number;
  streak: number;
}

interface RatingStoreState {
  myRating: PlayerRating | null;
  leaderboard: LeaderboardEntry[];
  playerRating: PlayerRating | null;
  activeSport: SportCategory;
  loading: boolean;
  error: string | null;

  fetchMyRating: (sport?: SportCategory) => Promise<void>;
  fetchLeaderboard: (sport?: SportCategory) => Promise<void>;
  fetchPlayerRating: (userId: number, sport?: SportCategory) => Promise<void>;
  setActiveSport: (sport: SportCategory) => void;
  clearError: () => void;
}

export function getTierColor(tier: RatingTier): string {
  switch (tier) {
    case 'bronze': return '#CD7F32';
    case 'silver': return '#C0C0C0';
    case 'gold': return '#FFD700';
    case 'platinum': return '#E5E4E2';
    case 'diamond': return '#B9F2FF';
  }
}

export function getTierBgColor(tier: RatingTier): string {
  switch (tier) {
    case 'bronze': return 'rgba(205,127,50,0.12)';
    case 'silver': return 'rgba(192,192,192,0.12)';
    case 'gold': return 'rgba(255,215,0,0.12)';
    case 'platinum': return 'rgba(229,228,226,0.15)';
    case 'diamond': return 'rgba(185,242,255,0.15)';
  }
}

export function getEloTier(elo: number): RatingTier {
  if (elo >= 2200) return 'diamond';
  if (elo >= 1800) return 'platinum';
  if (elo >= 1400) return 'gold';
  if (elo >= 1000) return 'silver';
  return 'bronze';
}

export const useRatingStore = create<RatingStoreState>((set, get) => ({
  myRating: null,
  leaderboard: [],
  playerRating: null,
  activeSport: 'padel',
  loading: false,
  error: null,

  fetchMyRating: async (sport) => {
    const s = sport || get().activeSport;
    set({ loading: true, error: null });
    try {
      const response = await apiClient.get('/users/me/rating', { params: { sport: s } });
      set({ myRating: response.data.data, loading: false });
    } catch (error: unknown) {
      const msg = (error as { response?: { data?: { message?: string } } })
        ?.response?.data?.message || 'Could not fetch rating';
      set({ error: msg, loading: false });
    }
  },

  fetchLeaderboard: async (sport) => {
    const s = sport || get().activeSport;
    set({ loading: true, error: null });
    try {
      const response = await apiClient.get('/leaderboard', { params: { sport: s } });
      set({ leaderboard: response.data.data || [], loading: false });
    } catch (error: unknown) {
      const msg = (error as { response?: { data?: { message?: string } } })
        ?.response?.data?.message || 'Could not fetch leaderboard';
      set({ error: msg, loading: false });
    }
  },

  fetchPlayerRating: async (userId, sport) => {
    const s = sport || get().activeSport;
    set({ loading: true, error: null });
    try {
      const response = await apiClient.get(`/users/${userId}/rating`, { params: { sport: s } });
      set({ playerRating: response.data.data, loading: false });
    } catch (error: unknown) {
      const msg = (error as { response?: { data?: { message?: string } } })
        ?.response?.data?.message || 'Could not fetch player rating';
      set({ error: msg, loading: false });
    }
  },

  setActiveSport: (sport) => set({ activeSport: sport }),
  clearError: () => set({ error: null }),
}));