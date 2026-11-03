jest.mock('../../config/database', () => ({ db: jest.fn(), t: (name: string) => `tourneo_${name}` }));
jest.mock('../../utils/cache', () => ({ withCache: (_k: string, _t: number, load: () => unknown) => load() }));

import { buildOverpassQuery, buildTileQuery, COUNTRY_BBOX, courtsNeeded, tilesFor, venuesFromOsm } from '../../services/hallFinderService';

describe('courtsNeeded', () => {
  it('needs one court per four players, at least one', () => {
    expect(courtsNeeded(1)).toBe(1);
    expect(courtsNeeded(4)).toBe(1);
    expect(courtsNeeded(5)).toBe(2);
    expect(courtsNeeded(12)).toBe(3);
  });
});

describe('buildOverpassQuery', () => {
  it('matches padel inside sport lists and caps the radius at 200 km', () => {
    const q = buildOverpassQuery(48.14, 11.58, 500);
    expect(q).toContain('(^|;)padel(;|$)');
    expect(q).toContain('around:200000,48.14,11.58');
    expect(q).toContain('out center tags');
  });
});

describe('venuesFromOsm', () => {
  const centre = { lat: 48.14, lng: 11.58 };

  it('groups the separately mapped courts of one hall into a single venue', () => {
    const venues = venuesFromOsm([
      { type: 'way', id: 1, center: { lat: 48.15, lon: 11.6 }, tags: { leisure: 'sports_centre', sport: 'padel;tennis', name: 'Padel Arena', website: 'padel-arena.de', 'addr:city': 'München', 'addr:postcode': '80331' } },
      { type: 'way', id: 2, center: { lat: 48.1501, lon: 11.6001 }, tags: { leisure: 'pitch', sport: 'padel', covered: 'yes' } },
      { type: 'way', id: 3, center: { lat: 48.1502, lon: 11.6002 }, tags: { leisure: 'pitch', sport: 'padel' } },
      { type: 'node', id: 4, lat: 48.3, lon: 11.9, tags: { leisure: 'pitch', sport: 'padel' } },
    ], centre.lat, centre.lng);

    expect(venues).toHaveLength(2);
    const arena = venues.find((v) => v.name === 'Padel Arena')!;
    expect(arena.courts).toBe(2);
    expect(arena.website).toBe('https://padel-arena.de');
    expect(arena.indoor).toBe(true);
    expect(arena.address).toBe('80331 München');
    expect(arena.id).toBe('osm:way/1');
    expect(arena.maps_url).toContain('google.com/maps/search');
    const unnamed = venues.find((v) => v.name !== 'Padel Arena')!;
    expect(unnamed.name).toBe('Padel-Platz');
    expect(unnamed.distance_km).toBeGreaterThan(10);
  });

  it('skips private courts and elements without coordinates', () => {
    const venues = venuesFromOsm([
      { type: 'way', id: 5, center: { lat: 48.2, lon: 11.5 }, tags: { leisure: 'pitch', sport: 'padel', access: 'private' } },
      { type: 'relation', id: 6, tags: { sport: 'padel' } },
    ], centre.lat, centre.lng);
    expect(venues).toEqual([]);
  });

  it('reports an unknown court count when only the centre is mapped', () => {
    const [v] = venuesFromOsm([
      { type: 'node', id: 7, lat: 48.14, lon: 11.58, tags: { leisure: 'sports_centre', sport: 'padel', name: 'Club' } },
    ], centre.lat, centre.lng);
    expect(v.courts).toBeNull();
  });
});

describe('tilesFor', () => {
  it('covers the whole bounding box with tiles of at most 1.5 degrees', () => {
    const tiles = tilesFor([47.2, 5.8, 55.1, 15.1]);
    expect(tiles.length).toBe(Math.ceil(7.9 / 1.5) * Math.ceil(9.3 / 1.5));
    for (const [s, w, n, e] of tiles) {
      expect(n - s).toBeLessThanOrEqual(1.5001);
      expect(e - w).toBeLessThanOrEqual(1.5001);
    }
    expect(Math.max(...tiles.map((x) => x[2]))).toBe(55.1);
    expect(Math.max(...tiles.map((x) => x[3]))).toBe(15.1);
  });

  it('has a bounding box for the default import countries', () => {
    for (const cc of ['DE', 'AT', 'CH']) expect(COUNTRY_BBOX[cc]).toBeDefined();
  });

  it('builds a bbox query for a tile', () => {
    expect(buildTileQuery([52, 12.5, 53, 14])).toContain('(52,12.5,53,14)');
  });
});
