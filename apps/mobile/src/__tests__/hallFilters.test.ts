import { applyHallFilter, DEFAULT_HALL_FILTER, isFilterActive } from '../utils/hallFilters';
import type { FoundHall } from '../api/v2';

const hall = (over: Partial<FoundHall>): FoundHall => ({
  id: over.id ?? 'osm:way/1',
  source: 'osm',
  name: 'Halle',
  latitude: 0,
  longitude: 0,
  distance_km: 5,
  courts: null,
  indoor: null,
  address: null,
  website: null,
  phone: null,
  opening_hours: null,
  tourneo_venue_id: null,
  maps_url: '',
  enough_courts: null,
  ...over,
});

const halls = [
  hall({ id: 'a', name: 'Padel Nord', distance_km: 12, courts: 4, indoor: true, website: 'https://a.de', enough_courts: true }),
  hall({ id: 'b', name: 'Beach Padel', distance_km: 3, courts: 1, indoor: false, enough_courts: false, address: 'Seestraße 1, Köln' }),
  hall({ id: 'c', name: 'Club Süd', distance_km: 8 }),
];

describe('applyHallFilter', () => {
  it('sorts by distance by default and keeps all halls', () => {
    expect(applyHallFilter(halls, DEFAULT_HALL_FILTER).map((h) => h.id)).toEqual(['b', 'c', 'a']);
  });

  it('filters indoor/outdoor only on known values', () => {
    expect(applyHallFilter(halls, { ...DEFAULT_HALL_FILTER, kind: 'indoor' }).map((h) => h.id)).toEqual(['a']);
    expect(applyHallFilter(halls, { ...DEFAULT_HALL_FILTER, kind: 'outdoor' }).map((h) => h.id)).toEqual(['b']);
  });

  it('keeps only halls with a booking link or enough courts when asked', () => {
    expect(applyHallFilter(halls, { ...DEFAULT_HALL_FILTER, bookableOnly: true }).map((h) => h.id)).toEqual(['a']);
    expect(applyHallFilter(halls, { ...DEFAULT_HALL_FILTER, enoughCourtsOnly: true }).map((h) => h.id)).toEqual(['a']);
  });

  it('sorts by courts with unknown counts last and matches text in name or address', () => {
    expect(applyHallFilter(halls, { ...DEFAULT_HALL_FILTER, sort: 'courts' }).map((h) => h.id)).toEqual(['a', 'b', 'c']);
    expect(applyHallFilter(halls, { ...DEFAULT_HALL_FILTER, text: 'köln' }).map((h) => h.id)).toEqual(['b']);
  });

  it('reports whether any filter is active', () => {
    expect(isFilterActive(DEFAULT_HALL_FILTER)).toBe(false);
    expect(isFilterActive({ ...DEFAULT_HALL_FILTER, text: ' x ' })).toBe(true);
  });
});
