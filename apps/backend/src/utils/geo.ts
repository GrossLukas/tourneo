/** Great-circle distance in kilometres (haversine). */
export function distanceKm(lat1: number, lng1: number, lat2: number, lng2: number): number {
  const rad = (deg: number) => (deg * Math.PI) / 180;
  const dLat = rad(lat2 - lat1);
  const dLng = rad(lng2 - lng1);
  const a = Math.sin(dLat / 2) ** 2 + Math.cos(rad(lat1)) * Math.cos(rad(lat2)) * Math.sin(dLng / 2) ** 2;
  return 6371 * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
}

/** Stored user locations are rounded to two decimals (about a kilometre) – enough for a radius filter. */
export function roundCoordinate(value: number): number {
  return Math.round(value * 100) / 100;
}

/**
 * Whether a user should get the "new tournament" push for a venue: users who
 * opted into nearby-only alerts get it inside their radius, everyone else as
 * before. Missing coordinates on either side never hide an event.
 */
export function wantsEventAt(
  profile: { notify_nearby_events?: boolean | number | null; latitude?: unknown; longitude?: unknown; notify_radius_km?: unknown } | undefined,
  venue: { latitude?: unknown; longitude?: unknown } | undefined
): boolean {
  if (!profile || !profile.notify_nearby_events) return true;
  const coords = [profile.latitude, profile.longitude, venue?.latitude, venue?.longitude];
  if (coords.some((c) => c === null || c === undefined || c === '')) return true;
  const [lat1, lng1, lat2, lng2] = coords.map(Number);
  return distanceKm(lat1, lng1, lat2, lng2) <= Number(profile.notify_radius_km || 50);
}
