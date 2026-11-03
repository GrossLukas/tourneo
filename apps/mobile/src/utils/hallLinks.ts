/**
 * Small helpers for the hall finder: booking provider labels, readable
 * OpenStreetMap opening hours and the "add a missing hall" link.
 */

const PROVIDERS: Array<[RegExp, string]> = [
  [/(^|\.)playtomic\.(io|com)$/i, 'Playtomic'],
  [/(^|\.)eversports\.(de|at|ch|com)$/i, 'Eversports'],
  [/(^|\.)matchi\.(se|com)$/i, 'MATCHi'],
  [/(^|\.)courtreserve\.com$/i, 'CourtReserve'],
  [/(^|\.)padelmates\.(se|com|io)$/i, 'Padel Mates'],
  [/(^|\.)tennis04\.com$/i, 'tennis04'],
  [/(^|\.)bookandplay\.de$/i, 'Book and Play'],
];

/** "Bei Playtomic buchen" for known booking platforms, otherwise a neutral label. */
export function bookingLabel(website: string | null | undefined): string {
  if (!website) return 'Website / Buchung';
  try {
    const host = new URL(website).hostname;
    const hit = PROVIDERS.find(([re]) => re.test(host));
    return hit ? `Bei ${hit[1]} buchen` : 'Website / Buchung';
  } catch {
    return 'Website / Buchung';
  }
}

const DAYS: Record<string, string> = { Mo: 'Mo', Tu: 'Di', We: 'Mi', Th: 'Do', Fr: 'Fr', Sa: 'Sa', Su: 'So', PH: 'Feiertag' };

/**
 * OSM opening_hours ("Mo-Fr 08:00-22:00; Sa,Su 09:00-20:00") in German day
 * names and en dashes. Unknown syntax is returned unchanged rather than guessed.
 */
export function formatOpeningHours(value: string | null | undefined): string | null {
  if (!value) return null;
  const text = value.trim();
  if (text === '24/7') return 'Rund um die Uhr';
  return text
    .split(';')
    .map((part) => part.trim())
    .filter(Boolean)
    .map((part) =>
      part
        .replace(/\b(Mo|Tu|We|Th|Fr|Sa|Su|PH)\b/g, (d) => DAYS[d] ?? d)
        .replace(/(\d{2}:\d{2})-(\d{2}:\d{2})/g, '$1–$2')
        .replace(/([A-Za-zäöü]{2})-([A-Za-zäöü]{2})/g, '$1–$2')
        .replace(/\boff\b/g, 'geschlossen'))
    .join(' · ');
}

/** OpenStreetMap "add a note" at the searched area – missing halls get added for everyone, not just Tourneo. */
export function addMissingHallUrl(lat: number, lng: number): string {
  return `https://www.openstreetmap.org/note/new#map=15/${lat.toFixed(5)}/${lng.toFixed(5)}`;
}
