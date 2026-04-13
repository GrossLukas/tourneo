import { z } from 'zod';

export const updateProfileSchema = z.object({
  first_name: z.string().min(1).max(100).optional(),
  last_name: z.string().min(1).max(100).optional(),
  display_name: z.string().max(100).nullable().optional(),
  phone: z.string().max(20).nullable().optional(),
  city: z.string().max(100).nullable().optional(),
  region: z.string().max(100).nullable().optional(),
  country: z.string().length(2).optional(),
  bio: z.string().max(1000).nullable().optional(),
});

export const updateLanguageSchema = z.object({
  locale: z.string().max(10),
  manual_override: z.boolean().default(true),
});

export const grantConsentSchema = z.object({
  consent_type: z.enum(['terms', 'privacy', 'age_verification', 'media_consent', 'tournament_terms', 'marketing']),
  legal_document_version_id: z.number().int().positive(),
  granted: z.boolean(),
});

export const createTeamSchema = z.object({
  name: z.string().min(2, 'Team name must be at least 2 characters').max(100),
  sport_category: z.enum(['padel', 'fifa', 'other']).default('padel'),
  max_members: z.number().int().min(2).max(10).default(4),
});

export const updateTeamSchema = z.object({
  name: z.string().min(2).max(100).optional(),
  max_members: z.number().int().min(2).max(10).optional(),
});

export const inviteTeamMemberSchema = z.object({
  user_id: z.number().int().positive('Valid user is required'),
});

export const friendRequestSchema = z.object({
  user_id: z.number().int().positive('Valid user is required'),
});

export const createVenueSchema = z.object({
  name: z.string().min(2).max(255),
  description: z.string().max(5000).optional(),
  address_street: z.string().min(1).max(255),
  address_city: z.string().min(1).max(100),
  address_zip: z.string().min(1).max(20),
  address_country: z.string().length(2).default('DE'),
  latitude: z.number().min(-90).max(90).optional(),
  longitude: z.number().min(-180).max(180).optional(),
  is_indoor: z.boolean().default(false),
  is_outdoor: z.boolean().default(false),
  is_partner_venue: z.boolean().default(false),
  partner_website_url: z.string().url().max(500).optional(),
  partner_booking_url: z.string().url().max(500).optional(),
  phone: z.string().max(20).optional(),
  email: z.string().email().max(255).optional(),
  image_url: z.string().url().max(500).optional(),
  operating_hours: z.record(z.string()).optional(),
});

export const createSupportTicketSchema = z.object({
  event_id: z.number().int().positive().optional(),
  category: z.enum(['general', 'payment', 'refund', 'tournament', 'technical', 'account', 'other']),
  subject: z.string().min(3).max(255),
  message: z.string().min(10).max(5000),
});

export const ticketReplySchema = z.object({
  message: z.string().min(1).max(5000),
});

export const notificationSettingsSchema = z.object({
  push_token: z.string().min(1).max(500),
  platform: z.enum(['ios', 'android']).default('ios'),
});

export type UpdateProfileInput = z.infer<typeof updateProfileSchema>;
export type CreateTeamInput = z.infer<typeof createTeamSchema>;
export type CreateVenueInput = z.infer<typeof createVenueSchema>;
export type CreateSupportTicketInput = z.infer<typeof createSupportTicketSchema>;