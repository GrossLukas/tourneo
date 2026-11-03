import { addMissingHallUrl, bookingLabel, formatOpeningHours } from '../utils/hallLinks';

describe('bookingLabel', () => {
  it('names known booking platforms', () => {
    expect(bookingLabel('https://playtomic.io/padel-arena/abc')).toBe('Bei Playtomic buchen');
    expect(bookingLabel('https://www.eversports.de/s/club')).toBe('Bei Eversports buchen');
    expect(bookingLabel('https://www.matchi.se/facilities/x')).toBe('Bei MATCHi buchen');
  });

  it('falls back to a neutral label', () => {
    expect(bookingLabel('https://padel-arena.de')).toBe('Website / Buchung');
    expect(bookingLabel(null)).toBe('Website / Buchung');
    expect(bookingLabel('kein-link')).toBe('Website / Buchung');
    // Look-alike domains must not get the label
    expect(bookingLabel('https://playtomic.io.evil.example')).toBe('Website / Buchung');
  });
});

describe('formatOpeningHours', () => {
  it('translates days and uses dashes', () => {
    expect(formatOpeningHours('Mo-Fr 08:00-22:00; Sa,Su 09:00-20:00')).toBe('Mo–Fr 08:00–22:00 · Sa,So 09:00–20:00');
    expect(formatOpeningHours('24/7')).toBe('Rund um die Uhr');
    expect(formatOpeningHours('PH off')).toBe('Feiertag geschlossen');
    expect(formatOpeningHours(null)).toBeNull();
  });
});

describe('addMissingHallUrl', () => {
  it('opens an OpenStreetMap note at the searched place', () => {
    expect(addMissingHallUrl(48.1371, 11.5754)).toBe('https://www.openstreetmap.org/note/new#map=15/48.13710/11.57540');
  });
});
