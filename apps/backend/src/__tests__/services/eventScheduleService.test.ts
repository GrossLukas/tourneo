jest.mock('../../config/database', () => ({ db: jest.fn(), t: (name: string) => `tourneo_${name}` }));

import { compareScheduleMatches, planSlots } from '../../services/eventScheduleService';

describe('planSlots', () => {
  const start = new Date('2026-11-14T10:00:00.000Z');

  it('fills all courts of a slot before starting the next slot', () => {
    const plan = planSlots(5, [11, 12], start, 30);
    expect(plan.map((p) => p.court_id)).toEqual([11, 12, 11, 12, 11]);
    expect(plan.map((p) => p.scheduled_at.toISOString())).toEqual([
      '2026-11-14T10:00:00.000Z',
      '2026-11-14T10:00:00.000Z',
      '2026-11-14T10:30:00.000Z',
      '2026-11-14T10:30:00.000Z',
      '2026-11-14T11:00:00.000Z',
    ]);
  });

  it('handles a single court', () => {
    const plan = planSlots(3, [7], start, 45);
    expect(plan.map((p) => p.scheduled_at.toISOString())).toEqual([
      '2026-11-14T10:00:00.000Z',
      '2026-11-14T10:45:00.000Z',
      '2026-11-14T11:30:00.000Z',
    ]);
  });
});

describe('compareScheduleMatches', () => {
  it('orders by time, puts unscheduled matches last, then by round and number', () => {
    const rows = [
      { id: 'tbd', scheduled_at: null, round_number: 1, match_number: 1 },
      { id: 'late', scheduled_at: '2026-11-14T11:00:00Z', round_number: 1, match_number: 2 },
      { id: 'early', scheduled_at: '2026-11-14T10:00:00Z', round_number: 1, match_number: 3 },
      { id: 'r2', scheduled_at: null, round_number: 2, match_number: 1 },
    ];
    expect(rows.slice().sort(compareScheduleMatches).map((r) => r.id)).toEqual(['early', 'late', 'tbd', 'r2']);
  });
});
