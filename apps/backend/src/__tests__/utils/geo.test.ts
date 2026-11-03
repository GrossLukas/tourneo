import { distanceKm, roundCoordinate, wantsEventAt } from '../../utils/geo';

const munich = { latitude: 48.14, longitude: 11.58 };
const augsburg = { latitude: 48.37, longitude: 10.9 }; // ~55 km
const berlin = { latitude: 52.52, longitude: 13.4 }; // ~500 km

describe('distanceKm', () => {
  it('measures Munich – Augsburg at roughly 55 km', () => {
    const d = distanceKm(munich.latitude, munich.longitude, augsburg.latitude, augsburg.longitude);
    expect(d).toBeGreaterThan(50);
    expect(d).toBeLessThan(60);
  });

  it('is zero for the same point', () => {
    expect(distanceKm(48.14, 11.58, 48.14, 11.58)).toBe(0);
  });
});

describe('roundCoordinate', () => {
  it('keeps about one kilometre of precision', () => {
    expect(roundCoordinate(48.137154)).toBe(48.14);
    expect(roundCoordinate(-0.004)).toBe(-0);
  });
});

describe('wantsEventAt', () => {
  const nearbyUser = { notify_nearby_events: true, ...munich, notify_radius_km: 60 };

  it('notifies users without nearby opt-in about every event', () => {
    expect(wantsEventAt({ notify_nearby_events: false }, berlin)).toBe(true);
    expect(wantsEventAt(undefined, berlin)).toBe(true);
  });

  it('filters by radius for opted-in users', () => {
    expect(wantsEventAt(nearbyUser, augsburg)).toBe(true);
    expect(wantsEventAt(nearbyUser, berlin)).toBe(false);
    expect(wantsEventAt({ ...nearbyUser, notify_radius_km: 25 }, augsburg)).toBe(false);
  });

  it('never hides events when coordinates are missing (also from decimal strings)', () => {
    expect(wantsEventAt({ ...nearbyUser, latitude: null }, berlin)).toBe(true);
    expect(wantsEventAt(nearbyUser, { latitude: null, longitude: null })).toBe(true);
    expect(wantsEventAt({ ...nearbyUser, latitude: '48.14', longitude: '11.58' }, { latitude: '48.37', longitude: '10.90' })).toBe(true);
  });
});
