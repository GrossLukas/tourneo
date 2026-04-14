import { db, t } from '../config/database';
import { AppError } from '../middleware/errorHandler';

/**
 * IcalService — produces an RFC 5545 .ics calendar file for an event.
 *
 * Self-contained — no third-party dependency required so the backend
 * stays light. Only escapes the few characters that matter for the
 * single VEVENT we emit.
 */
export class IcalService {
  static async generateForEvent(eventId: number): Promise<string> {
    const event = await db(t('events')).where('id', eventId).first();
    if (!event) throw AppError.notFound('Event');

    const venue = await db(t('venues')).where('id', event.venue_id).first();

    const start = this.formatDate(new Date(event.start_date));
    const end = this.formatDate(new Date(event.end_date));
    const stamp = this.formatDate(new Date());

    const location = venue
      ? this.escape(
          [venue.name, venue.address_street, venue.address_zip, venue.address_city]
            .filter(Boolean)
            .join(', ')
        )
      : '';

    const description = this.escape(
      event.description ||
        `${event.title}${venue ? ` @ ${venue.name}` : ''} — Tourneo`
    );

    const lines = [
      'BEGIN:VCALENDAR',
      'VERSION:2.0',
      'PRODID:-//Tourneo//Events//DE',
      'CALSCALE:GREGORIAN',
      'METHOD:PUBLISH',
      'BEGIN:VEVENT',
      `UID:tourneo-event-${event.id}@tourneo.de`,
      `DTSTAMP:${stamp}`,
      `DTSTART:${start}`,
      `DTEND:${end}`,
      `SUMMARY:${this.escape(event.title)}`,
      `DESCRIPTION:${description}`,
      location ? `LOCATION:${location}` : '',
      'BEGIN:VALARM',
      'ACTION:DISPLAY',
      'DESCRIPTION:Erinnerung an dein Turnier',
      'TRIGGER:-PT1H',
      'END:VALARM',
      'END:VEVENT',
      'END:VCALENDAR',
    ].filter(Boolean);

    return lines.join('\r\n');
  }

  /**
   * Formats a Date as RFC 5545 UTC: YYYYMMDDTHHMMSSZ
   */
  private static formatDate(d: Date): string {
    const pad = (n: number) => String(n).padStart(2, '0');
    return (
      d.getUTCFullYear().toString() +
      pad(d.getUTCMonth() + 1) +
      pad(d.getUTCDate()) +
      'T' +
      pad(d.getUTCHours()) +
      pad(d.getUTCMinutes()) +
      pad(d.getUTCSeconds()) +
      'Z'
    );
  }

  /**
   * Escapes the few characters required by RFC 5545.
   */
  private static escape(text: string): string {
    return (text || '')
      .replace(/\\/g, '\\\\')
      .replace(/;/g, '\\;')
      .replace(/,/g, '\\,')
      .replace(/\n/g, '\\n');
  }
}
