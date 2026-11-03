import type { FoundHall } from '../api/v2';

export type HallKind = 'all' | 'indoor' | 'outdoor';
export type HallSort = 'distance' | 'courts';

export interface HallFilter {
  kind: HallKind;
  bookableOnly: boolean;
  enoughCourtsOnly: boolean;
  sort: HallSort;
  text: string;
}

export const DEFAULT_HALL_FILTER: HallFilter = {
  kind: 'all',
  bookableOnly: false,
  enoughCourtsOnly: false,
  sort: 'distance',
  text: '',
};

/**
 * Filters and sorts finder results on the device. Unknown values never hide
 * a hall from "Alle" and the text filter, but "Halle"/"Draußen" and
 * "genug Plätze" only keep halls where the value is known.
 */
export function applyHallFilter(halls: FoundHall[], filter: HallFilter): FoundHall[] {
  const text = filter.text.trim().toLowerCase();
  const list = halls.filter((h) => {
    if (filter.kind === 'indoor' && h.indoor !== true) return false;
    if (filter.kind === 'outdoor' && h.indoor !== false) return false;
    if (filter.bookableOnly && !h.website && !h.tourneo_venue_id) return false;
    if (filter.enoughCourtsOnly && h.enough_courts !== true) return false;
    if (text && !`${h.name} ${h.address ?? ''}`.toLowerCase().includes(text)) return false;
    return true;
  });
  return list.sort((a, b) =>
    filter.sort === 'courts'
      ? (b.courts ?? -1) - (a.courts ?? -1) || a.distance_km - b.distance_km
      : a.distance_km - b.distance_km);
}

export function isFilterActive(filter: HallFilter): boolean {
  return filter.kind !== 'all' || filter.bookableOnly || filter.enoughCourtsOnly || filter.sort !== 'distance' || filter.text.trim() !== '';
}
