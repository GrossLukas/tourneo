/**
 * QR check-in: only well-formed Tourneo codes reach the database, and the
 * check-in window follows the event's setting instead of a fixed hour.
 */
jest.mock('../../config/database', () => ({ db: jest.fn(), t: (name: string) => `tourneo_${name}` }));

import { RegistrationService } from '../../services/registrationService';

const token = 'a'.repeat(48);

describe('RegistrationService.parseCheckinPayload', () => {
  it('accepts the payload shown in the app', () => {
    expect(RegistrationService.parseCheckinPayload(`tourneo-checkin:${token}`)).toBe(token);
  });

  it('accepts a bare token and normalises case and whitespace', () => {
    expect(RegistrationService.parseCheckinPayload(`  ${token.toUpperCase()} `)).toBe(token);
  });

  it('rejects foreign QR codes and SQL-ish input', () => {
    expect(RegistrationService.parseCheckinPayload('https://example.com')).toBeNull();
    expect(RegistrationService.parseCheckinPayload(`tourneo-checkin:${token}' OR 1=1`)).toBeNull();
    expect(RegistrationService.parseCheckinPayload('')).toBeNull();
  });
});

describe('RegistrationService.checkInOpensAt', () => {
  const start = '2026-11-14T10:00:00.000Z';

  it('defaults to one hour before start', () => {
    expect(RegistrationService.checkInOpensAt({ start_date: start }).toISOString()).toBe('2026-11-14T09:00:00.000Z');
  });

  it('uses the per-event window', () => {
    expect(
      RegistrationService.checkInOpensAt({ start_date: start, checkin_opens_minutes_before: 30 }).toISOString()
    ).toBe('2026-11-14T09:30:00.000Z');
  });

  it('allows a zero-minute window (check-in from start)', () => {
    expect(
      RegistrationService.checkInOpensAt({ start_date: start, checkin_opens_minutes_before: 0 }).toISOString()
    ).toBe(start);
  });
});
