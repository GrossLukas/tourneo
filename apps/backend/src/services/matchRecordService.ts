import { db, t } from '../config/database';

export interface MatchRecord {
  wins: number;
  losses: number;
  /** Rounded percentage 0–100; 0 when no completed match exists. */
  win_rate: number;
}

/**
 * Win/loss record from completed matches, one row per match the user played
 * (`reg_id` = the user's registration, `winner_registration_id` = the winner).
 */
export function summarizeRecord(
  rows: Array<{ winner_registration_id: number | null; reg_id: number }>,
): MatchRecord {
  let wins = 0;
  let losses = 0;
  for (const row of rows) {
    if (row.winner_registration_id == null) continue;
    if (Number(row.winner_registration_id) === Number(row.reg_id)) wins++;
    else losses++;
  }
  const played = wins + losses;
  return { wins, losses, win_rate: played ? Math.round((wins / played) * 100) : 0 };
}

export class MatchRecordService {
  static async forUser(userId: number): Promise<MatchRecord> {
    const rows = await db(t('matches') + ' as m')
      .join(t('registrations') + ' as r', function () {
        this.on('r.id', '=', 'm.participant_1_registration_id').orOn(
          'r.id',
          '=',
          'm.participant_2_registration_id'
        );
      })
      .where('r.user_id', userId)
      .where('m.status', 'completed')
      .whereNotNull('m.winner_registration_id')
      .select('m.winner_registration_id', 'r.id as reg_id');
    return summarizeRecord(rows);
  }
}
