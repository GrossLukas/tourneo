import { z } from 'zod';

export const createRegistrationSchema = z.object({
  event_id: z.number().int().positive('Valid event is required'),
  registration_type: z.enum(['solo', 'duo', 'team']),
  team_id: z.number().int().positive().optional(),
  partner_user_id: z.number().int().positive().optional(),
  partner_email: z.string().email().max(255).transform((v) => v.trim().toLowerCase()).optional(),
  consent_tournament_terms: z.literal(true, {
    errorMap: () => ({ message: 'You must accept the tournament terms' }),
  }),
  consent_age_verified: z.literal(true, {
    errorMap: () => ({ message: 'You must confirm you are at least 18 years old' }),
  }),
  consent_media: z.boolean().default(false),
  playtomic_level: z.number().min(0).max(7).optional(),
  playtomic_screenshot_url: z.string().url().max(500).optional(),
}).refine(
  (data) => {
    if (data.registration_type === 'team' && !data.team_id) {
      return false;
    }
    return true;
  },
  { message: 'Team is required for team registration', path: ['team_id'] }
);

export const cancelRegistrationSchema = z.object({
  reason: z.string().max(500).optional(),
});

export const checkinSchema = z.object({
  latitude: z.number().optional(),
  longitude: z.number().optional(),
});

export const updateRegistrationStatusSchema = z.object({
  status: z.enum([
    'pending_verification',
    'pending_payment',
    'confirmed',
    'waitlisted',
    'cancelled',
    'refunded',
    'rejected',
    'no_show',
  ]),
});

export const setSeedSchema = z.object({
  seed_number: z.number().int().positive(),
});

export type CreateRegistrationInput = z.infer<typeof createRegistrationSchema>;
