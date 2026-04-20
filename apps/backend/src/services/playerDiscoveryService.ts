import { db, t } from '../config/database';
import type { EloSport } from './eloService';

export interface DiscoverablePlayer {
  user_id: number;
  display_name: string;
  avatar_url: string | null;
  city: string | null;
  elo: number;
  tier: string;
  matches_played: number;
  last_active_at: string | null;
  distance_km: number | null;
}

export interface PlayerSearchOptions {
  sport: EloSport;
  eloMin?: number;
  eloMax?: number;
  city?: string;
  lat?: number;
  lng?: number;
  radiusKm?: number;
  excludeUserId?: number;
  limit?: number;
}

function tierFromElo(elo: number): string {
  if (elo >= 1350) return 'elite';
  if (elo >= 1200) return 'diamond';
  if (elo >= 1100) return 'platinum';
  if (elo >= 1000) return 'gold';
  if (elo >= 900) return 'silver';
  return 'bronze';
}

/**
 * PlayerDiscoveryService — find opponents and partners by sport, ELO and location.
 *
 * Uses the Haversine-style approximation already used in venueService
 * for geo filtering. Only surfaces users who opted in via
 * profiles.discoverable = true.
 */
export class PlayerDiscoveryService {
  static async search(opts: PlayerSearchOptions): Promise<DiscoverablePlayer[]> {
    const eloCol = opts.sport === 'padel' ? 'p.elo_padel' : 'p.elo_fifa';
    const limit = Math.min(opts.limit ?? 40, 100);

    let query = db(`${t('profiles')} as p`)
      .join(`${t('users')} as u`, 'u.id', 'p.user_id')
      .select(
        'p.user_id as user_id',
        'p.display_name as display_name',
        'p.avatar_url as avatar_url',
        'p.city as city',
        'p.latitude as latitude',
        'p.longitude as longitude',
        'p.last_active_at as last_active_at',
        'p.elo_matches_played as matches_played',
        db.raw(`${eloCol} as elo`),
      )
      .where('p.discoverable', true)
      .whereNull('u.deleted_at');

    if (opts.excludeUserId) {
      query = query.whereNot('p.user_id', opts.excludeUserId);
    }
    if (opts.eloMin !== undefined) {
      query = query.where(db.raw(eloCol), '>=', opts.eloMin);
    }
    if (opts.eloMax !== undefined) {
      query = query.where(db.raw(eloCol), '<=', opts.eloMax);
    }
    if (opts.city) {
      query = query.whereRaw('LOWER(p.city) = ?', [opts.city.toLowerCase()]);
    }

    const rows = await query.orderBy('p.last_active_at', 'desc').limit(limit);

    const usingGeo = typeof opts.lat === 'number' && typeof opts.lng === 'number';
    const radius = opts.radiusKm ?? 50;

    const mapped: DiscoverablePlayer[] = rows
      .map((r: any) => {
        let distance_km: number | null = null;
        if (usingGeo && r.latitude != null && r.longitude != null) {
          distance_km = haversine(opts.lat!, opts.lng!, Number(r.latitude), Number(r.longitude));
        }
        return {
          user_id: r.user_id,
          display_name: r.display_name ?? 'Spieler',
          avatar_url: r.avatar_url,
          city: r.city,
          elo: Number(r.elo ?? 1000),
          tier: tierFromElo(Number(r.elo ?? 1000)),
          matches_played: Number(r.matches_played ?? 0),
          last_active_at: r.last_active_at ? new Date(r.last_active_at).toISOString() : null,
          distance_km,
        };
      })
      .filter((p) => !usingGeo || p.distance_km === null || p.distance_km <= radius)
      .sort((a, b) => {
        if (a.distance_km != null && b.distance_km != null) {
          return a.distance_km - b.distance_km;
        }
        const aTs = a.last_active_at ? Date.parse(a.last_active_at) : 0;
        const bTs = b.last_active_at ? Date.parse(b.last_active_at) : 0;
        return bTs - aTs;
      });

    return mapped.slice(0, limit);
  }

  static async bumpLastActive(userId: number): Promise<void> {
    await db(t('profiles')).where('user_id', userId).update({ last_active_at: db.fn.now() });
  }
}

function haversine(lat1: number, lng1: number, lat2: number, lng2: number): number {
  const R = 6371;
  const toRad = (v: number) => (v * Math.PI) / 180;
  const dLat = toRad(lat2 - lat1);
  const dLng = toRad(lng2 - lng1);
  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos(toRad(lat1)) * Math.cos(toRad(lat2)) * Math.sin(dLng / 2) * Math.sin(dLng / 2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  return R * c;
}
