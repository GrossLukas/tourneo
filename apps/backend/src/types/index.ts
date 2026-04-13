// ============================================
// TURNEO - Core Type Definitions
// ============================================

// Enums
export type UserRole = 'user' | 'admin' | 'superadmin';
export type UserStatus = 'active' | 'suspended' | 'deleted';
export type MembershipTier = 'free' | 'plus' | 'club';
export type MembershipStatus = 'active' | 'cancelled' | 'expired' | 'pending';
export type SportCategory = 'padel' | 'fifa' | 'other';
export type EventType = 'tournament' | 'open_play' | 'special';
export type EventFormat = 'singles' | 'doubles';
export type EliminationType = 'single_elimination' | 'double_elimination' | 'round_robin';
export type EventStatus = 'draft' | 'published' | 'registration_open' | 'registration_closed' | 'in_progress' | 'completed' | 'cancelled';
export type EventAccessType = 'public' | 'members_only' | 'club_only';
export type EventLevel = 'beginner' | 'intermediate' | 'advanced' | 'open';
export type RegistrationType = 'solo' | 'duo' | 'team';
export type RegistrationStatus = 'pending_payment' | 'confirmed' | 'waitlisted' | 'cancelled' | 'refunded' | 'no_show';
export type PaymentType = 'tournament_fee' | 'membership' | 'other';
export type PaymentMethod = 'card' | 'apple_pay' | 'other';
export type PaymentStatus = 'pending' | 'succeeded' | 'failed' | 'cancelled' | 'refunded' | 'partially_refunded';
export type RefundReason = 'user_cancellation_14d' | 'organizer_cancellation' | 'admin_decision' | 'duplicate' | 'other';
export type RefundStatus = 'pending' | 'processed' | 'failed';
export type MatchStatus = 'upcoming' | 'in_progress' | 'completed' | 'walkover' | 'cancelled';
export type BracketStatus = 'draft' | 'published' | 'in_progress' | 'completed';
export type PayoutMethod = 'bank_transfer' | 'cash' | 'other';
export type PayoutStatus = 'pending' | 'processing' | 'paid' | 'failed';
export type TicketCategory = 'general' | 'payment' | 'refund' | 'tournament' | 'technical' | 'account' | 'other';
export type TicketStatus = 'open' | 'in_progress' | 'resolved' | 'closed';
export type TicketPriority = 'low' | 'medium' | 'high' | 'urgent';
export type ConsentType = 'terms' | 'privacy' | 'age_verification' | 'media_consent' | 'tournament_terms' | 'marketing';
export type LegalDocumentType = 'terms' | 'privacy' | 'tournament_terms' | 'imprint' | 'media_policy' | 'cancellation_policy';
export type FriendshipStatus = 'pending' | 'accepted' | 'declined' | 'blocked';
export type TeamMemberStatus = 'active' | 'invited' | 'left' | 'removed';
export type TeamMemberRole = 'captain' | 'member';
export type NotificationType =
  | 'registration_confirmed'
  | 'event_published'
  | 'waitlist_promoted'
  | 'event_reminder_1d'
  | 'event_reminder_1h'
  | 'checkin_available'
  | 'match_upcoming'
  | 'result_entered'
  | 'tournament_completed'
  | 'prize_available'
  | 'membership_renewed'
  | 'general';

// Database Row Types
export interface UserRow {
  id: number;
  uuid: string;
  email: string;
  password_hash: string;
  apple_id: string | null;
  email_verified: boolean;
  role: UserRole;
  status: UserStatus;
  created_at: Date;
  updated_at: Date;
  deleted_at: Date | null;
}

export interface ProfileRow {
  id: number;
  user_id: number;
  first_name: string;
  last_name: string;
  display_name: string | null;
  date_of_birth: string;
  phone: string | null;
  city: string | null;
  region: string | null;
  country: string;
  avatar_url: string | null;
  bio: string | null;
  created_at: Date;
  updated_at: Date;
}

export interface MembershipRow {
  id: number;
  user_id: number;
  tier: MembershipTier;
  status: MembershipStatus;
  apple_subscription_id: string | null;
  started_at: Date;
  expires_at: Date | null;
  cancelled_at: Date | null;
  price_cents: number | null;
  currency: string;
  created_at: Date;
  updated_at: Date;
}

export interface EventRow {
  id: number;
  uuid: string;
  title: string;
  description: string | null;
  sport_category: SportCategory;
  event_type: EventType;
  venue_id: number;
  start_date: Date;
  end_date: Date;
  registration_opens_at: Date;
  registration_closes_at: Date;
  club_early_access_at: Date | null;
  plus_early_access_at: Date | null;
  is_indoor: boolean;
  is_outdoor: boolean;
  format: EventFormat;
  elimination_type: EliminationType;
  has_third_place_match: boolean;
  max_participants: number;
  entry_fee_cents: number;
  currency: string;
  total_prize_pool_cents: number;
  level: EventLevel;
  access_type: EventAccessType;
  has_food_drinks: boolean;
  has_streaming: boolean;
  special_notes: string | null;
  rules_summary: string | null;
  banner_image_url: string | null;
  status: EventStatus;
  created_by: number;
  published_at: Date | null;
  created_at: Date;
  updated_at: Date;
}

export interface RegistrationRow {
  id: number;
  uuid: string;
  event_id: number;
  user_id: number;
  team_id: number | null;
  registration_type: RegistrationType;
  partner_user_id: number | null;
  status: RegistrationStatus;
  membership_tier_at_registration: MembershipTier;
  discount_applied_cents: number;
  seed_number: number | null;
  checked_in: boolean;
  checked_in_at: Date | null;
  final_placement: number | null;
  prize_amount_cents: number;
  consent_tournament_terms: boolean;
  consent_age_verified: boolean;
  consent_media: boolean;
  waitlist_position: number | null;
  waitlist_promoted_at: Date | null;
  created_at: Date;
  updated_at: Date;
}

export interface PaymentRow {
  id: number;
  uuid: string;
  user_id: number;
  registration_id: number | null;
  payment_type: PaymentType;
  amount_cents: number;
  discount_cents: number;
  net_amount_cents: number;
  currency: string;
  payment_method: PaymentMethod;
  stripe_payment_intent_id: string | null;
  stripe_charge_id: string | null;
  status: PaymentStatus;
  paid_at: Date | null;
  failed_at: Date | null;
  failure_reason: string | null;
  receipt_url: string | null;
  invoice_number: string | null;
  metadata: object | null;
  created_at: Date;
  updated_at: Date;
}

export interface MatchRow {
  id: number;
  uuid: string;
  event_id: number;
  bracket_id: number;
  round_number: number;
  match_number: number;
  round_name: string | null;
  court_id: number | null;
  scheduled_at: Date | null;
  participant_1_registration_id: number | null;
  participant_2_registration_id: number | null;
  winner_registration_id: number | null;
  is_third_place_match: boolean;
  is_final: boolean;
  next_match_id: number | null;
  status: MatchStatus;
  started_at: Date | null;
  completed_at: Date | null;
  created_at: Date;
  updated_at: Date;
}

// API Request/Response Types
export interface AuthTokenPayload {
  userId: number;
  uuid: string;
  email: string;
  role: UserRole;
}

export interface PaginationParams {
  page: number;
  perPage: number;
}

export interface PaginatedResponse<T> {
  success: true;
  data: T[];
  meta: {
    page: number;
    per_page: number;
    total: number;
    total_pages: number;
  };
}

export interface SuccessResponse<T> {
  success: true;
  data: T;
}

export interface ErrorResponse {
  success: false;
  error: {
    code: string;
    message: string;
    details?: Array<{ field: string; message: string }>;
  };
}

export interface EventFilters {
  sport_category?: SportCategory;
  city?: string;
  date_from?: string;
  date_to?: string;
  is_indoor?: boolean;
  is_outdoor?: boolean;
  min_fee?: number;
  max_fee?: number;
  level?: EventLevel;
  status?: EventStatus;
  access_type?: EventAccessType;
  has_availability?: boolean;
  latitude?: number;
  longitude?: number;
  radius_km?: number;
}