import { z } from 'zod';

const YEAR_MS = 365 * 24 * 60 * 60 * 1000;

/** OpenStreetMap ids exactly as the hall finder reports them, e.g. "osm:way/123456". */
export const OSM_ID_PATTERN = /^osm:(node|way|relation)\/\d{1,15}$/;

const isHttpUrl = (value: string) => {
  try {
    const url = new URL(value);
    return url.protocol === 'http:' || url.protocol === 'https:';
  } catch {
    return false;
  }
};

const startDate = z
  .string()
  .datetime('Gültiger Startzeitpunkt erforderlich')
  .refine((value) => new Date(value).getTime() > Date.now(), 'Der Start muss in der Zukunft liegen')
  .refine((value) => new Date(value).getTime() <= Date.now() + YEAR_MS, 'Der Start darf höchstens ein Jahr entfernt sein');

const title = z.string().trim().min(3, 'Der Titel braucht mindestens 3 Zeichen').max(100);
const description = z.string().trim().max(2000).optional();
const durationMinutes = z.number().int().min(30).max(720);
const maxParticipants = z.number().int().min(2).max(32);
const placeName = z.string().trim().min(2, 'Bitte gib einen Namen für den Ort an').max(120);
const address = z.string().trim().max(255).optional();

export const communityVenueSchema = z.discriminatedUnion('kind', [
  z.object({ kind: z.literal('partner'), venue_id: z.number().int().positive() }),
  z.object({
    kind: z.literal('osm'),
    osm_id: z.string().regex(OSM_ID_PATTERN, 'Unbekannte Halle'),
    name: placeName,
    latitude: z.number().min(-90).max(90),
    longitude: z.number().min(-180).max(180),
    address,
    website: z.string().trim().max(500).url().refine(isHttpUrl, 'Nur http- und https-Adressen').nullable().optional(),
  }),
  z.object({ kind: z.literal('place'), name: placeName, address }),
]);

export const createCommunityEventSchema = z.object({
  title,
  description,
  start_date: startDate,
  duration_minutes: durationMinutes.default(120),
  format: z.enum(['singles', 'doubles']).default('doubles'),
  // Double elimination is not implemented by the bracket generator, so it is not offered here
  elimination_type: z.enum(['single_elimination', 'round_robin']).default('single_elimination'),
  max_participants: maxParticipants,
  venue: communityVenueSchema,
});

export const updateCommunityEventSchema = z
  .object({
    title: title.optional(),
    description: description.nullable(),
    start_date: startDate.optional(),
    duration_minutes: durationMinutes.optional(),
    max_participants: maxParticipants.optional(),
  })
  .refine((data) => Object.values(data).some((value) => value !== undefined), 'Nichts zu ändern');

export type CommunityVenueInput = z.infer<typeof communityVenueSchema>;
export type CreateCommunityEventInput = z.infer<typeof createCommunityEventSchema>;
export type UpdateCommunityEventInput = z.infer<typeof updateCommunityEventSchema>;
