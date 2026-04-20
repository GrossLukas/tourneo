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

// ─── Playtomic level & verification ──────────────────────
export type PlaytomicStatus = {
  level: number | null;
  status: 'none' | 'pending' | 'approved' | 'rejected';
  source: 'default' | 'playtomic_self' | 'playtomic_verified';
  screenshotUrl: string | null;
};

export async function getMyPlaytomic(): Promise<PlaytomicStatus> {
  const res = await apiClient.get('/me/playtomic');
  return res.data.data;
}

export async function declarePlaytomicLevel(level: number) {
  const res = await apiClient.post('/me/playtomic/declare', { level });
  return res.data.data as { seedElo: number; status: string };
}

export async function submitPlaytomicScreenshot(screenshotUrl: string) {
  const res = await apiClient.post('/me/playtomic/screenshot', {
    screenshot_url: screenshotUrl,
  });
  return res.data.data;
}

// ─── Match feedback (rating calibration) ─────────────────
export type MatchFeedbackValue = 'lower' | 'correct' | 'higher';

export async function listPendingFeedback() {
  const res = await apiClient.get('/me/feedback/pending');
  return res.data.data as Array<{
    id: number;
    event_id: number;
    participant_1_registration_id: number;
    participant_2_registration_id: number;
    completed_at: string;
  }>;
}

export async function submitMatchFeedback(
  matchId: number,
  opponentUserId: number,
  feedback: MatchFeedbackValue,
  comment?: string
) {
  const res = await apiClient.post('/me/feedback', {
    match_id: matchId,
    opponent_user_id: opponentUserId,
    feedback,
    comment,
  });
  return res.data.data;
}

// ─── Rating history (ELO chart) ──────────────────────────
export type RatingHistoryPoint = {
  id: number;
  user_id: number;
  sport: 'padel' | 'fifa';
  elo: number;
  delta: number;
  match_id: number | null;
  reason: 'match' | 'calibration' | 'seed' | 'admin';
  recorded_at: string;
};

export async function getMyEloHistory(
  sport: 'padel' | 'fifa' = 'padel',
  limit: number = 30,
): Promise<RatingHistoryPoint[]> {
  const res = await apiClient.get('/me/elo/history', {
    params: { sport, limit },
  });
  return res.data.data;
}

// ─── Player discovery / matchmaking ──────────────────────
export type DiscoverablePlayer = {
  user_id: number;
  display_name: string;
  avatar_url: string | null;
  city: string | null;
  elo: number;
  tier: EloTier;
  matches_played: number;
  last_active_at: string | null;
  distance_km: number | null;
};

export async function searchPlayers(opts: {
  sport: 'padel' | 'fifa';
  elo_min?: number;
  elo_max?: number;
  city?: string;
  lat?: number;
  lng?: number;
  radius_km?: number;
  limit?: number;
}): Promise<DiscoverablePlayer[]> {
  const res = await apiClient.get('/players/search', { params: opts });
  return res.data.data;
}

export async function setDiscoverable(discoverable: boolean) {
  const res = await apiClient.put('/me/discoverable', { discoverable });
  return res.data.data as { discoverable: boolean };
}

export async function sendHeartbeat() {
  const res = await apiClient.post('/me/heartbeat', {});
  return res.data.data as { ok: boolean };
}

// ─── Court availability ──────────────────────────────────
export type AvailabilitySlot = {
  id: number;
  venue_id: number;
  court_id: number | null;
  slot_date: string;
  slot_start: string;
  slot_end: string;
  status: 'available' | 'booked' | 'blocked';
  price_cents: number | null;
  booking_url: string | null;
};

export async function getVenueAvailability(
  venueId: number,
  opts: { from?: string; to?: string; courtId?: number } = {}
): Promise<AvailabilitySlot[]> {
  const params: Record<string, string | number> = {};
  if (opts.from) params.from = opts.from;
  if (opts.to) params.to = opts.to;
  if (opts.courtId) params.court_id = opts.courtId;
  const res = await apiClient.get(`/venues/${venueId}/availability`, { params });
  return res.data.data;
}
