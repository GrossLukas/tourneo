/**
 * Maintenance mode must block registrations on the server, not only hide
 * the button in the app – otherwise an old client keeps registering.
 */
jest.mock('../../config/database', () => ({ db: jest.fn(), t: (name: string) => `tourneo_${name}` }));

import { EventService } from '../../services/eventService';

const openEvent = {
  status: 'registration_open',
  access_type: 'public',
  registration_opens_at: new Date(Date.now() - 86_400_000).toISOString(),
  registration_closes_at: new Date(Date.now() + 86_400_000).toISOString(),
  early_access_club_at: null,
  early_access_plus_at: null,
};

describe('EventService.canUserRegister – maintenance mode', () => {
  it('refuses registrations while the event is paused and passes the admin note on', () => {
    const result = EventService.canUserRegister(
      { ...openEvent, maintenance_mode: true, maintenance_message: 'Neue Zeiten folgen' },
      'free'
    );
    expect(result).toEqual({ canRegister: false, reason: 'Neue Zeiten folgen' });
  });

  it('uses a default reason without a note', () => {
    const result = EventService.canUserRegister({ ...openEvent, maintenance_mode: true }, 'free');
    expect(result.canRegister).toBe(false);
    expect(result.reason).toMatch(/paused/);
  });

  it('does not block when maintenance is off', () => {
    const result = EventService.canUserRegister({ ...openEvent, maintenance_mode: false }, 'free');
    expect(result.reason ?? '').not.toMatch(/paused/);
  });
});
