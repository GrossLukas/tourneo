import type { Knex } from 'knex';
import { v4 as uuidv4 } from 'uuid';
import { db, t } from '../config/database';
import { AppError } from '../middleware/errorHandler';
import { EventService } from './eventService';
import type {
  CommunityVenueInput,
  CreateCommunityEventInput,
  UpdateCommunityEventInput,
} from '../validators/communityEvents';

/** Upcoming tournaments among friends one player may run at the same time. */
export const MAX_UPCOMING_PER_ORGANIZER = 5;

const OPEN_STATUSES = ['published', 'registration_open', 'registration_closed'];

/** A row of the local OpenStreetMap copy (osm_padel_venues). */
export interface KnownOsmVenue {
  osm_id: string;
  country?: string | null;
  name: string;
  latitude: number | string;
  longitude: number | string;
  indoor?: boolean | number | null;
  address?: string | null;
  website?: string | null;
  phone?: string | null;
}

/**
 * Splits the hall finder's address format ("Street 1, 12345 City") into the
 * venue columns. Street, zip and city are required columns, so whatever is
 * missing becomes an empty string.
 */
export function splitAddress(address?: string | null): { street: string; zip: string; city: string } {
  const parts = String(address ?? '').split(',').map((p) => p.trim()).filter(Boolean);
  let street = '';
  let zip = '';
  let city = '';
  if (parts.length) {
    const last = parts[parts.length - 1];
    const zipCity = /^(\d{4,5})(?:\s+(.+))?$/.exec(last);
    if (zipCity) {
      zip = zipCity[1];
      city = zipCity[2] ?? '';
      street = parts.slice(0, -1).join(', ');
    } else if (parts.length > 1) {
      city = last;
      street = parts.slice(0, -1).join(', ');
    } else {
      street = last;
    }
  }
  return { street: street.slice(0, 255), zip: zip.slice(0, 20), city: city.slice(0, 100) };
}

const httpUrl = (value?: string | null): string | null => {
  if (!value) return null;
  try {
    const url = new URL(value);
    return (url.protocol === 'http:' || url.protocol === 'https:') && value.length <= 500 ? value : null;
  } catch {
    return null;
  }
};

/**
 * How a hall or place picked by a player becomes a venue row.
 *
 * - An OSM hall the server knows from its own OpenStreetMap copy is stored
 *   once per OSM id, with the server's data rather than what the client sent.
 * - An OSM hall the server cannot verify (live search outside the imported
 *   countries) gets a row of its own without the OSM id – otherwise the first
 *   caller could pin a made-up name onto a real hall for everybody after them.
 * - A place typed in by hand is reused when name and address match exactly.
 *
 * `match` is null when a new row must always be created.
 */
export function communityVenuePlan(
  input: Exclude<CommunityVenueInput, { kind: 'partner' }>,
  known?: KnownOsmVenue
): { match: Record<string, string | null> | null; row: Record<string, unknown> } {
  const base = { is_community: true, is_partner_venue: false, status: 'active' };

  if (input.kind === 'place') {
    const parts = splitAddress(input.address);
    const keys = {
      name: input.name,
      address_street: parts.street,
      address_zip: parts.zip,
      address_city: parts.city,
    };
    return {
      match: { ...keys, osm_id: null },
      row: { ...base, ...keys, latitude: null, longitude: null, osm_id: null },
    };
  }

  if (known) {
    const parts = splitAddress(known.address);
    const indoor = known.indoor == null ? null : Boolean(Number(known.indoor));
    return {
      match: { osm_id: known.osm_id },
      row: {
        ...base,
        osm_id: known.osm_id,
        name: String(known.name).slice(0, 255),
        address_street: parts.street,
        address_zip: parts.zip,
        address_city: parts.city,
        ...(known.country ? { address_country: String(known.country).slice(0, 2) } : {}),
        latitude: Number(known.latitude),
        longitude: Number(known.longitude),
        is_indoor: indoor === true,
        is_outdoor: indoor === false,
        partner_website_url: httpUrl(known.website),
        phone: known.phone && known.phone.length <= 20 ? known.phone : null,
      },
    };
  }

  const parts = splitAddress(input.address);
  return {
    match: null,
    row: {
      ...base,
      osm_id: null,
      name: input.name,
      address_street: parts.street,
      address_zip: parts.zip,
      address_city: parts.city,
      latitude: input.latitude,
      longitude: input.longitude,
      partner_website_url: httpUrl(input.website),
    },
  };
}

const isDuplicateKey = (err: any) => err?.code === 'ER_DUP_ENTRY' || err?.errno === 1062;

export class CommunityEventService {
  /** Venue id for the hall or place of a new tournament among friends (find-or-create). */
  static async resolveVenue(venue: CommunityVenueInput, trx: Knex.Transaction): Promise<number> {
    if (venue.kind === 'partner') {
      const row = await trx(t('venues'))
        .where({ id: venue.venue_id, status: 'active', is_community: false })
        .first('id');
      if (!row) throw AppError.badRequest('Diese Halle gibt es nicht (mehr).');
      return Number(row.id);
    }

    let known: KnownOsmVenue | undefined;
    if (venue.kind === 'osm') {
      const existing = await trx(t('venues')).where('osm_id', venue.osm_id).first('id');
      if (existing) return Number(existing.id);
      known = await trx(t('osm_padel_venues')).where('osm_id', venue.osm_id).first();
    }

    const plan = communityVenuePlan(venue, known);
    if (plan.match) {
      const query = trx(t('venues')).where('is_community', true);
      for (const [column, value] of Object.entries(plan.match)) {
        if (value === null) query.whereNull(column);
        else query.where(column, value);
      }
      const existing = await query.first('id');
      if (existing) return Number(existing.id);
    }

    const now = new Date();
    try {
      const [id] = await trx(t('venues')).insert({ ...plan.row, uuid: uuidv4(), created_at: now, updated_at: now });
      return Number(id);
    } catch (err) {
      // Two players picked the same OSM hall at the same moment – use the row the other one created
      if (plan.row.osm_id && isDuplicateKey(err)) {
        const row = await trx(t('venues')).where('osm_id', plan.row.osm_id as string).first('id');
        if (row) return Number(row.id);
      }
      throw err;
    }
  }

  static async create(input: CreateCommunityEventInput, userId: number) {
    const now = new Date();
    const start = new Date(input.start_date);
    const end = new Date(start.getTime() + input.duration_minutes * 60_000);

    const eventId = await db.transaction(async (trx) => {
      // Lock the organiser's row so two parallel requests cannot both slip under the limit
      await trx(t('users')).where('id', userId).forUpdate().first('id');
      const [{ count }] = await trx(t('events'))
        .where('created_by', userId)
        .where('is_community', true)
        .whereNotIn('status', ['cancelled', 'completed'])
        .where('start_date', '>', now)
        .count('* as count');
      if (Number(count) >= MAX_UPCOMING_PER_ORGANIZER) {
        throw AppError.badRequest(
          `Du kannst höchstens ${MAX_UPCOMING_PER_ORGANIZER} kommende Turniere mit Freunden gleichzeitig planen.`
        );
      }

      const venueId = await this.resolveVenue(input.venue, trx);
      const [id] = await trx(t('events')).insert({
        uuid: uuidv4(),
        title: input.title,
        description: input.description || null,
        sport_category: 'padel',
        event_type: 'tournament',
        venue_id: venueId,
        start_date: start,
        end_date: end,
        // Free and invite-only: registration is open right away until the start
        registration_opens_at: now,
        registration_closes_at: start,
        club_early_access_at: null,
        plus_early_access_at: null,
        format: input.format,
        elimination_type: input.elimination_type,
        has_third_place_match: input.elimination_type === 'single_elimination',
        max_participants: input.max_participants,
        entry_fee_cents: 0,
        currency: 'EUR',
        total_prize_pool_cents: 0,
        level: 'open',
        access_type: 'private',
        invite_token: uuidv4(),
        is_community: true,
        // Never goes through publishEvent, so nobody else gets a push about it
        status: 'registration_open',
        published_at: now,
        created_by: userId,
        created_at: now,
        updated_at: now,
      });
      return Number(id);
    });

    return EventService.getEventById(eventId);
  }

  /** The organiser's own tournaments among friends, upcoming first. */
  static async listMine(userId: number) {
    const rows = await db(`${t('events')} as e`)
      .leftJoin(`${t('venues')} as v`, 'v.id', 'e.venue_id')
      .where('e.created_by', userId)
      .where('e.is_community', true)
      .whereNot('e.status', 'cancelled')
      .orderByRaw("CASE WHEN e.status = 'completed' THEN 1 ELSE 0 END ASC")
      .orderBy('e.start_date', 'asc')
      .limit(30)
      .select(
        'e.id', 'e.title', 'e.start_date', 'e.end_date', 'e.status', 'e.format',
        'e.elimination_type', 'e.max_participants', 'e.invite_token',
        'v.name as venue_name', 'v.address_city as venue_city'
      );
    const ids = rows.map((r: any) => r.id);
    const counts = ids.length
      ? await db(t('registrations'))
        .whereIn('event_id', ids)
        .whereIn('status', ['confirmed', 'pending_payment'])
        .groupBy('event_id')
        .select('event_id')
        .count('* as count')
      : [];
    const countMap = new Map(counts.map((c: any) => [Number(c.event_id), Number(c.count)]));
    return rows.map((r: any) => ({ ...r, participant_count: countMap.get(Number(r.id)) ?? 0 }));
  }

  static async update(eventId: number, patch: UpdateCommunityEventInput) {
    await db.transaction(async (trx) => {
      const event = await trx(t('events')).where('id', eventId).forUpdate().first();
      if (!event) throw AppError.notFound('Event');
      if (!event.is_community) {
        throw AppError.badRequest('Hier lassen sich nur Turniere mit Freunden bearbeiten.');
      }
      if (!OPEN_STATUSES.includes(event.status)) {
        throw AppError.badRequest('Das Turnier hat schon begonnen oder ist beendet.');
      }

      const changes: Record<string, unknown> = { updated_at: new Date() };
      if (patch.title !== undefined) changes.title = patch.title;
      if (patch.description !== undefined) changes.description = patch.description || null;
      if (patch.max_participants !== undefined) {
        const [{ count }] = await trx(t('registrations'))
          .where('event_id', eventId)
          .whereIn('status', ['confirmed', 'pending_payment'])
          .count('* as count');
        if (patch.max_participants < Number(count)) {
          throw AppError.badRequest(`Es sind schon ${Number(count)} angemeldet – weniger Plätze gehen nicht.`);
        }
        changes.max_participants = patch.max_participants;
      }
      if (patch.start_date !== undefined || patch.duration_minutes !== undefined) {
        const start = patch.start_date ? new Date(patch.start_date) : new Date(event.start_date);
        const duration = patch.duration_minutes
          ?? Math.max(30, Math.round((new Date(event.end_date).getTime() - new Date(event.start_date).getTime()) / 60_000));
        changes.start_date = start;
        changes.end_date = new Date(start.getTime() + duration * 60_000);
        changes.registration_closes_at = start;
      }
      await trx(t('events')).where('id', eventId).update(changes);
    });
    return EventService.getEventById(eventId);
  }
}
