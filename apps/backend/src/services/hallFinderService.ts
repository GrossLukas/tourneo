import { db, t } from '../config/database';
import { withCache } from '../utils/cache';
import { distanceKm } from '../utils/geo';
import { AppError } from '../middleware/errorHandler';

/**
 * Hall finder — every padel venue, not only Tourneo partners.
 *
 * Free data only: OpenStreetMap via the public Overpass API (padel pitches
 * and sports centres tagged sport=padel) and Nominatim for place names.
 * Tourneo does not book these venues; it links to their website or booking
 * page, a phone number and a map route. Partner venues managed in Tourneo
 * come first and stay bookable in the app.
 *
 * Live Overpass queries are slow (up to ~30 s) and fail under load, so a
 * nightly job copies the configured countries into `osm_padel_venues`
 * (HALLFINDER_COUNTRIES, default DACH). Searches read that table and only
 * query Overpass live outside those countries (cached for 24 h, with
 * failover between public instances). Every request identifies the app, as
 * the usage policies of these shared community services ask.
 */

const OVERPASS_URLS = (process.env.OVERPASS_URLS
  || 'https://overpass-api.de/api/interpreter,https://overpass.kumi.systems/api/interpreter,https://overpass.private.coffee/api/interpreter')
  .split(',').map((u) => u.trim()).filter(Boolean);
const IMPORT_COUNTRIES = (process.env.HALLFINDER_COUNTRIES || 'DE,AT,CH')
  .split(',').map((c) => c.trim().toUpperCase()).filter((c) => /^[A-Z]{2}$/.test(c));
const NOMINATIM_URL = process.env.NOMINATIM_URL || 'https://nominatim.openstreetmap.org/search';
const USER_AGENT = 'Tourneo/1.0 (open padel hall finder; contact via app store listing)';
/** Pitches closer than this belong to the same venue (OSM maps each court separately). */
const CLUSTER_METERS = 250;
export const MAX_RADIUS_KM = 200;
const PLAYERS_PER_COURT = 4;

export interface FoundVenue {
  id: string;
  source: 'tourneo' | 'osm';
  name: string;
  latitude: number;
  longitude: number;
  distance_km: number;
  /** Number of mapped padel courts; null when unknown (centre mapped without its courts). */
  courts: number | null;
  indoor: boolean | null;
  address: string | null;
  website: string | null;
  phone: string | null;
  opening_hours: string | null;
  /** Tourneo venue id when the venue can be booked inside the app. */
  tourneo_venue_id: number | null;
  maps_url: string;
}

interface OsmElement {
  type: string;
  id: number;
  lat?: number;
  lon?: number;
  center?: { lat: number; lon: number };
  tags?: Record<string, string>;
}

export function courtsNeeded(players: number): number {
  return Math.max(1, Math.ceil(Math.max(1, players) / PLAYERS_PER_COURT));
}

export function buildOverpassQuery(lat: number, lng: number, radiusKm: number): string {
  const r = Math.round(Math.min(radiusKm, MAX_RADIUS_KM) * 1000);
  // sport can be a list ("tennis;padel"), so match padel as one list entry
  return `[out:json][timeout:25];nwr["sport"~"(^|;)padel(;|$)"](around:${r},${lat},${lng});out center tags;`;
}

function mapsUrl(name: string, lat: number, lng: number): string {
  return `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(`${name} ${lat},${lng}`)}`;
}

function cleanUrl(value?: string): string | null {
  if (!value) return null;
  const url = value.trim().split(';')[0];
  if (/^https?:\/\//i.test(url)) return url;
  if (/^[\w-]+(\.[\w-]+)+/.test(url)) return `https://${url}`;
  return null;
}

/** Groups OSM pitches and centres into venues and picks the best name and contact data. */
export function venuesFromOsm(elements: OsmElement[], lat: number, lng: number): FoundVenue[] {
  const points = elements
    .map((el) => ({
      el,
      lat: el.lat ?? el.center?.lat,
      lon: el.lon ?? el.center?.lon,
      tags: el.tags || {},
    }))
    .filter((p): p is { el: OsmElement; lat: number; lon: number; tags: Record<string, string> } =>
      typeof p.lat === 'number' && typeof p.lon === 'number')
    .filter((p) => p.tags.access !== 'private' && p.tags.access !== 'no');

  const clusters: Array<typeof points> = [];
  for (const p of points) {
    const home = clusters.find((c) =>
      c.some((q) => distanceKm(p.lat, p.lon, q.lat, q.lon) * 1000 <= CLUSTER_METERS));
    if (home) home.push(p);
    else clusters.push([p]);
  }

  return clusters.map((c) => {
    // Prefer the sports centre / club entry for name and contact details
    const ranked = c.slice().sort((a, b) => score(b.tags) - score(a.tags));
    const main = ranked[0];
    const tag = (key: string) => ranked.map((p) => p.tags[key]).find(Boolean);
    const pitches = c.filter((p) => p.tags.leisure === 'pitch').length;
    const centre = c.find((p) => p.tags.leisure !== 'pitch') || main;
    const name = tag('name') || tag('operator') || 'Padel-Platz';
    const street = [tag('addr:street'), tag('addr:housenumber')].filter(Boolean).join(' ');
    const city = [tag('addr:postcode'), tag('addr:city')].filter(Boolean).join(' ');
    const indoorTags = c.map((p) => p.tags.indoor || p.tags.covered).filter(Boolean);
    return {
      id: `osm:${centre.el.type}/${centre.el.id}`,
      source: 'osm' as const,
      name,
      latitude: centre.lat,
      longitude: centre.lon,
      distance_km: Math.round(distanceKm(lat, lng, centre.lat, centre.lon) * 10) / 10,
      courts: pitches > 0 ? pitches : null,
      indoor: indoorTags.length ? indoorTags.some((v) => v === 'yes') : null,
      address: [street, city].filter(Boolean).join(', ') || null,
      website: cleanUrl(tag('contact:website') || tag('website') || tag('url')),
      phone: (tag('contact:phone') || tag('phone') || '').split(';')[0].trim() || null,
      opening_hours: tag('opening_hours') || null,
      tourneo_venue_id: null,
      maps_url: mapsUrl(name, centre.lat, centre.lon),
    };
  });
}

function score(tags: Record<string, string>): number {
  return (tags.leisure === 'sports_centre' || tags.club ? 4 : 0)
    + (tags.name ? 2 : 0)
    + (tags.website || tags['contact:website'] ? 1 : 0);
}

async function fetchJson(url: string, init: RequestInit = {}, timeoutMs = 30_000): Promise<any> {
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), timeoutMs);
  try {
    const res = await fetch(url, {
      ...init,
      signal: controller.signal,
      headers: { 'User-Agent': USER_AGENT, Accept: 'application/json', ...(init.headers || {}) },
    });
    if (!res.ok) throw AppError.badRequest(`Kartendienst nicht erreichbar (${res.status})`);
    return await res.json();
  } catch (err) {
    if (err instanceof AppError) throw err;
    throw AppError.badRequest('Kartendienst gerade nicht erreichbar – bitte später erneut versuchen');
  } finally {
    clearTimeout(timer);
  }
}

/** POSTs an Overpass query, trying the next public instance when one is overloaded. */
async function overpass(query: string, timeoutMs: number): Promise<OsmElement[]> {
  let lastError: unknown;
  for (const url of OVERPASS_URLS) {
    try {
      const json = await fetchJson(url, {
        method: 'POST',
        body: new URLSearchParams({ data: query }).toString(),
        headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
      }, timeoutMs);
      return json?.elements || [];
    } catch (err) {
      lastError = err;
    }
  }
  throw lastError;
}

/** Rough bounding boxes [south, west, north, east] of the countries the import supports. */
export const COUNTRY_BBOX: Record<string, [number, number, number, number]> = {
  DE: [47.2, 5.8, 55.1, 15.1],
  AT: [46.3, 9.5, 49.1, 17.2],
  CH: [45.8, 5.9, 47.9, 10.5],
  NL: [50.7, 3.3, 53.6, 7.3],
  BE: [49.5, 2.5, 51.6, 6.5],
  DK: [54.5, 8.0, 57.8, 12.7],
  FR: [41.3, -5.2, 51.1, 9.6],
  IT: [36.6, 6.6, 47.1, 18.6],
  ES: [35.9, -9.4, 43.8, 4.4],
  PT: [36.9, -9.6, 42.2, -6.2],
  GB: [49.9, -8.2, 58.7, 1.8],
  SE: [55.3, 11.0, 69.1, 24.2],
};
const TILE_DEG = 1.5;

/** Splits a bounding box into tiles small enough for a quick Overpass query. */
export function tilesFor(bbox: [number, number, number, number], size = TILE_DEG): Array<[number, number, number, number]> {
  const [s, w, n, e] = bbox;
  const tiles: Array<[number, number, number, number]> = [];
  for (let lat = s; lat < n; lat += size) {
    for (let lng = w; lng < e; lng += size) {
      tiles.push([lat, lng, Math.min(lat + size, n), Math.min(lng + size, e)].map((v) => Math.round(v * 1000) / 1000) as [number, number, number, number]);
    }
  }
  return tiles;
}

export function buildTileQuery(tile: [number, number, number, number]): string {
  return `[out:json][timeout:90];nwr["sport"~"(^|;)padel(;|$)"](${tile.join(',')});out center tags;`;
}

export class HallFinderService {
  /**
   * Imports one country tile by tile. A tile that fails keeps its previous
   * data; a tile that succeeds replaces exactly the venues inside it.
   */
  static async importCountry(country: string): Promise<number> {
    const cc = country.toUpperCase();
    const bbox = COUNTRY_BBOX[cc];
    if (!bbox) throw AppError.badRequest(`No bounding box for country ${cc}`);
    let imported = 0;
    let failed = 0;
    for (const tile of tilesFor(bbox)) {
      let venues: FoundVenue[];
      try {
        venues = venuesFromOsm(await overpass(buildTileQuery(tile), 120_000), 0, 0);
      } catch {
        failed += 1;
        continue;
      }
      const [south, west, north, east] = tile;
      const now = new Date();
      await db.transaction(async (trx) => {
        await trx(t('osm_padel_venues'))
          .whereBetween('latitude', [south, north])
          .whereBetween('longitude', [west, east])
          .del();
        const rows = venues
          // Clusters are placed at their centre – keep each venue in exactly one tile
          .filter((v) => v.latitude >= south && v.latitude < north && v.longitude >= west && v.longitude < east)
          .map((v) => ({
            osm_id: v.id,
            country: cc,
            name: v.name.slice(0, 255),
            latitude: v.latitude,
            longitude: v.longitude,
            courts: v.courts,
            indoor: v.indoor,
            address: v.address?.slice(0, 255) ?? null,
            website: v.website?.slice(0, 500) ?? null,
            phone: v.phone?.slice(0, 50) ?? null,
            opening_hours: v.opening_hours?.slice(0, 255) ?? null,
            imported_at: now,
          }));
        for (let i = 0; i < rows.length; i += 500) {
          await trx(t('osm_padel_venues')).insert(rows.slice(i, i + 500)).onConflict('osm_id').merge();
        }
        imported += rows.length;
      });
    }
    if (failed) console.warn(`[hallfinder] ${cc}: ${failed} tile(s) failed, previous data kept`);
    return imported;
  }

  /** Nightly: refresh every configured country; one failing country does not stop the others. */
  static async importAll(): Promise<Record<string, number | string>> {
    const result: Record<string, number | string> = {};
    for (const cc of IMPORT_COUNTRIES) {
      try {
        result[cc] = await this.importCountry(cc);
      } catch (err: any) {
        result[cc] = `failed: ${err?.message || err}`;
      }
    }
    return result;
  }

  private static async localVenues(lat: number, lng: number, radiusKm: number): Promise<FoundVenue[] | null> {
    // Bounding box first (index), exact distance afterwards
    const dLat = radiusKm / 111;
    const dLng = radiusKm / (111 * Math.max(Math.cos((lat * Math.PI) / 180), 0.01));
    const rows = await db(t('osm_padel_venues'))
      .whereBetween('latitude', [lat - dLat, lat + dLat])
      .whereBetween('longitude', [lng - dLng, lng + dLng]);
    if (!rows.length) {
      // Empty can mean "no padel here" or "country not imported" – only the latter needs a live query
      const covered = await db(t('osm_padel_venues'))
        .whereBetween('latitude', [lat - 1.5, lat + 1.5])
        .whereBetween('longitude', [lng - 2.5, lng + 2.5])
        .first('osm_id');
      return covered ? [] : null;
    }
    return rows.map((r: any) => {
      const vLat = Number(r.latitude);
      const vLng = Number(r.longitude);
      return {
        id: r.osm_id,
        source: 'osm' as const,
        name: r.name,
        latitude: vLat,
        longitude: vLng,
        distance_km: Math.round(distanceKm(lat, lng, vLat, vLng) * 10) / 10,
        courts: r.courts == null ? null : Number(r.courts),
        indoor: r.indoor == null ? null : Boolean(r.indoor),
        address: r.address,
        website: r.website,
        phone: r.phone,
        opening_hours: r.opening_hours,
        tourneo_venue_id: null,
        maps_url: mapsUrl(r.name, vLat, vLng),
      };
    });
  }

  /** Place name → coordinates (Nominatim), e.g. "Köln" or "80331". */
  static async geocode(place: string): Promise<{ lat: number; lng: number; label: string } | null> {
    const q = place.trim().slice(0, 120);
    if (!q) return null;
    return withCache(`hallfinder:geo:${q.toLowerCase()}`, 7 * 24 * 3600, async () => {
      const url = `${NOMINATIM_URL}?format=json&limit=1&accept-language=de&q=${encodeURIComponent(q)}`;
      const rows = await fetchJson(url);
      if (!Array.isArray(rows) || !rows.length) return null;
      return { lat: Number(rows[0].lat), lng: Number(rows[0].lon), label: String(rows[0].display_name || q) };
    });
  }

  static async search(lat: number, lng: number, radiusKm: number, players = 4) {
    const radius = Math.min(Math.max(radiusKm, 1), MAX_RADIUS_KM);
    // Round the centre so nearby searches share one cache entry (≈1 km grid)
    const key = `hallfinder:osm:${lat.toFixed(2)}:${lng.toFixed(2)}:${radius}`;
    const osm = (await this.localVenues(lat, lng, radius))
      ?? await withCache(key, 24 * 3600, async () =>
        venuesFromOsm(await overpass(buildOverpassQuery(lat, lng, radius), 45_000), lat, lng));

    // Courts of one hall split across two import tiles end up as two entries – keep the richer one
    const deduped: FoundVenue[] = [];
    for (const v of osm.slice().sort((x, y) => (y.courts ?? 0) - (x.courts ?? 0))) {
      if (!deduped.some((d) => distanceKm(d.latitude, d.longitude, v.latitude, v.longitude) * 1000 <= CLUSTER_METERS)) {
        deduped.push(v);
      }
    }

    const partners = await this.partnerVenues(lat, lng, radius);
    // An OSM venue that is a Tourneo partner shows up once – as the bookable partner
    const merged = [
      ...partners,
      ...deduped.filter((v) => !partners.some((p) =>
        distanceKm(p.latitude, p.longitude, v.latitude, v.longitude) * 1000 <= CLUSTER_METERS)),
    ].filter((v) => v.distance_km <= radius);

    const needed = courtsNeeded(players);
    return {
      center: { lat, lng },
      radius_km: radius,
      players,
      courts_needed: needed,
      venues: merged
        .map((v) => ({ ...v, enough_courts: v.courts === null ? null : v.courts >= needed }))
        .sort((a, b) => Number(b.source === 'tourneo') - Number(a.source === 'tourneo') || a.distance_km - b.distance_km),
      attribution: '© OpenStreetMap-Mitwirkende (ODbL)',
    };
  }

  private static async partnerVenues(lat: number, lng: number, radiusKm: number): Promise<FoundVenue[]> {
    const rows = await db(t('venues'))
      .where('status', 'active')
      .whereNotNull('latitude')
      .whereNotNull('longitude')
      .select('id', 'name', 'latitude', 'longitude', 'address_street', 'address_zip', 'address_city', 'is_indoor', 'partner_website_url', 'phone', 'partner_booking_url');
    const courtCounts = await db(t('courts'))
      .where('status', 'active')
      .groupBy('venue_id')
      .select('venue_id')
      .count('* as n');
    const courtsByVenue = new Map(courtCounts.map((r: any) => [Number(r.venue_id), Number(r.n)]));
    return rows
      .map((v: any) => {
        const vLat = Number(v.latitude);
        const vLng = Number(v.longitude);
        return {
          id: `tourneo:${v.id}`,
          source: 'tourneo' as const,
          name: v.name,
          latitude: vLat,
          longitude: vLng,
          distance_km: Math.round(distanceKm(lat, lng, vLat, vLng) * 10) / 10,
          courts: courtsByVenue.get(Number(v.id)) ?? null,
          indoor: v.is_indoor == null ? null : Boolean(v.is_indoor),
          address: [v.address_street, [v.address_zip, v.address_city].filter(Boolean).join(' ')].filter(Boolean).join(', ') || null,
          website: cleanUrl(v.partner_booking_url || v.partner_website_url),
          phone: v.phone || null,
          opening_hours: null,
          tourneo_venue_id: Number(v.id),
          maps_url: mapsUrl(v.name, vLat, vLng),
        };
      })
      .filter((v) => v.distance_km <= radiusKm);
  }
}
