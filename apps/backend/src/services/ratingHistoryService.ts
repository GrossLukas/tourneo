import { db, t } from '../config/database';
import type { EloSport } from './eloService';

export type RatingReason = 'match' | 'calibration' | 'seed' | 'admin';

export interface RatingHistoryEntry {
  id: number;
  user_id: number;
  sport: EloSport;
  elo: number;
  delta: number;
  match_id: number | null;
  reason: RatingReason;
  recorded_at: string;
}

/**
 * RatingHistoryService — persistent ELO time series.
 *
 * Called by eloService/playtomicService/matchFeedbackService whenever
 * a user's rating changes. Exposes a read API for charting in the
 * mobile app profile screen.
 */
export class RatingHistoryService {
  static async record(
    userId: number,
    sport: EloSport,
    elo: number,
    delta: number,
    reason: RatingReason,
    matchId?: number,
  ): Promise<void> {
    await db(t('rating_history')).insert({
      user_id: userId,
      sport,
      elo,
      delta,
      match_id: matchId ?? null,
      reason,
      recorded_at: db.fn.now(),
    });
  }

  static async listForUser(
    userId: number,
    sport: EloSport,
    limit: number = 30,
  ): Promise<RatingHistoryEntry[]> {
    const rows = await db(t('rating_history'))
      .where({ user_id: userId, sport })
      .orderBy('recorded_at', 'desc')
      .limit(limit);
    return rows.reverse();
  }
}
