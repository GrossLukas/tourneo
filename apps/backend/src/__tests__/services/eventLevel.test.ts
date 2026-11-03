jest.mock('../../config/database', () => ({ db: jest.fn(), t: (name: string) => `tourneo_${name}` }));

import { EventService } from '../../services/eventService';

describe('EventService.levelIneligibility', () => {
  const approved = { playtomic_level: 3.5, playtomic_verification_status: 'approved' };

  it('lets everyone in when the event has no level rules', () => {
    expect(EventService.levelIneligibility({}, undefined)).toBeNull();
  });

  it('enforces the level range, also with decimal strings from the database', () => {
    const event = { min_playtomic_level: '3.0', max_playtomic_level: '4.5' };
    expect(EventService.levelIneligibility(event, approved)).toBeNull();
    expect(EventService.levelIneligibility(event, { ...approved, playtomic_level: '2.5' })).toMatch(/ab Level 3\.0/);
    expect(EventService.levelIneligibility(event, { ...approved, playtomic_level: 5 })).toMatch(/bis Level 4\.5/);
  });

  it('asks for a level when the event has a range but the profile has none', () => {
    expect(EventService.levelIneligibility({ min_playtomic_level: 2 }, { playtomic_level: null })).toMatch(/hinterlege/);
  });

  it('requires an approved verification when the event demands it', () => {
    const event = { requires_playtomic_verification: true };
    expect(EventService.levelIneligibility(event, { ...approved, playtomic_verification_status: 'pending' })).toMatch(/bestätigtes/);
    expect(EventService.levelIneligibility(event, approved)).toBeNull();
  });
});
