import { summarizeRecord } from '../../services/matchRecordService';

describe('summarizeRecord', () => {
  it('counts wins and losses from the user registration perspective', () => {
    const rows = [
      { winner_registration_id: 7, reg_id: 7 },
      { winner_registration_id: 9, reg_id: 7 },
      { winner_registration_id: 7, reg_id: 7 },
    ];
    expect(summarizeRecord(rows)).toEqual({ wins: 2, losses: 1, win_rate: 67 });
  });

  it('returns zeros without completed matches', () => {
    expect(summarizeRecord([])).toEqual({ wins: 0, losses: 0, win_rate: 0 });
  });

  it('ignores matches without a winner and compares ids across types', () => {
    const rows = [
      { winner_registration_id: null, reg_id: 3 },
      { winner_registration_id: '3' as unknown as number, reg_id: 3 },
    ];
    expect(summarizeRecord(rows)).toEqual({ wins: 1, losses: 0, win_rate: 100 });
  });
});
