/**
 * V2 API wrappers — live score, ELO, partners, chat, recap, ical,
 * venue reviews & photos, referrals, achievements, waitlist.
 *
 * Thin, typed thin shells over apiClient. Screens can call these
 * directly; stores can wrap them if they need caching.
 */
import apiClient, { API_BASE_URL } from './client';

// ─── Shared types ─────────────────────────────────────────
export type MatchSet = { p1: number; p2: number };
export type EloTier =
  | 'bronze'
  | 'silver'
  | 'gold'
  | 'platinum'
  | 'diamond'
  | 'elite';

// ─── Live-score referee ───────────────────────────────────
export async function postMatchScore(matchId: number, sets: MatchSet[]) {
  const res = await apiClient.post(`/matches/${matchId}/score`, { sets });
  return res.data.data;
}
export async function getMatchScore(matchId: number) {
  const res = await apiClient.get(`/matches/${matchId}/score`);
  return res.data.data;
}
export async function getMyNextMatch() {
  const res = await apiClient.get(`/matches/me/next`);
  return res.data.data;
}

// ─── Recap + ical ─────────────────────────────────────────
export async function getEventRecap(eventId: number) {
  const res = await apiClient.get(`/events/${eventId}/recap`);
  return res.data.data;
}
export function getEventIcalUrl(eventId: number) {
  return `${API_BASE_URL}/events/${eventId}/ical`;
}

// ─── Partner search ───────────────────────────────────────
export async function listPartners(eventId: number) {
  const res = await apiClient.get(`/events/${eventId}/partners`);
  return res.data.data as Array<{
    id: number;
    user_id: number;
    display_name: string;
    avatar_url: string | null;
    message?: string;
    skill_level?: string;
    status: string;
    created_at: string;
  }>;
}
export async function createPartnerRequest(
  eventId: number,
  body: { message?: string; skill_level?: 'beginner' | 'intermediate' | 'advanced' | 'open' }
) {
  const res = await apiClient.post(`/events/${eventId}/partners`, body);
  return res.data.data;
}
export async function deletePartnerRequest(id: number) {
  const res = await apiClient.delete(`/partners/${id}`);
  return res.data.data;
}
export async function contactPartner(id: number) {
  const res = await apiClient.post(`/partners/${id}/contact`, {});
  return res.data.data;
}

// ─── Chat ────────────────────────────────────────────────
export async function listChat(eventId: number) {
  const res = await apiClient.get(`/events/${eventId}/chat`);
  return res.data.data as Array<{
    id: number;
    user_id: number;
    display_name: string;
    avatar_url: string | null;
    message: string;
    created_at: string;
  }>;
}
export async function postChat(eventId: number, message: string) {
  const res = await apiClient.post(`/events/${eventId}/chat`, { message });
  return res.data.data;
}

// ─── Waitlist position ────────────────────────────────────
export async function getWaitlistStatus(registrationId: number) {
  const res = await apiClient.get(
    `/registrations/${registrationId}/waitlist-status`
  );
  return res.data.data as {
    registration_id: number;
    position: number | null;
    total_waitlisted: number;
    ahead_of_you: number;
    estimated_chance: 'high' | 'medium' | 'low' | 'unknown';
  };
}

// ─── ELO / achievements / referrals ───────────────────────
export async function getMyElo() {
  const res = await apiClient.get('/me/elo');
  return res.data.data as {
    padel: { elo: number; peak: number; tier: EloTier };
    fifa: { elo: number; peak: number; tier: EloTier };
    matches_played: number;
  };
}
export async function getMyAchievements() {
  const res = await apiClient.get('/me/achievements');
  return res.data.data as Array<{
    id: number;
    achievement_type: string;
    earned_at: string;
  }>;
}
export async function getMyReferral() {
  const res = await apiClient.get('/me/referral');
  return res.data.data as { total: number; rewarded: number; code: string };
}
export async function createMyReferralCode() {
  const res = await apiClient.post('/me/referral/code', {});
  return res.data.data as { code: string };
}

// ─── Venue reviews & photos ───────────────────────────────
export async function listVenueReviews(venueId: number) {
  const res = await apiClient.get(`/venues/${venueId}/reviews`);
  return {
    reviews: res.data.data as Array<{
      id: number;
      user_id: number;
      display_name: string;
      avatar_url: string | null;
      rating: number;
      comment: string | null;
      created_at: string;
    }>,
    summary: res.data.meta as { average: number; count: number },
  };
}
export async function postVenueReview(
  venueId: number,
  rating: number,
  comment?: string
) {
  const res = await apiClient.post(`/venues/${venueId}/reviews`, {
    rating,
    comment,
  });
  return res.data.data;
}
export async function listVenuePhotos(venueId: number) {
  const res = await apiClient.get(`/venues/${venueId}/photos`);
  return res.data.data as Array<{
    id: number;
    image_url: string;
    created_at: string;
  }>;
}
export async function uploadVenuePhoto(venueId: number, uri: string) {
  const form = new FormData();
  // @ts-ignore — RN FormData accepts this shape
  form.append('image', {
    uri,
    name: 'photo.jpg',
    type: 'image/jpeg',
  });
  const res = await apiClient.post(`/venues/${venueId}/photos`, form, {
    headers: { 'Content-Type': 'multipart/form-data' },
  });
  return res.data.data;
}
