import { db, t } from '../config/database';
import { EloService } from './eloService';

export type FeedbackValue = 'lower' | 'correct' | 'higher';

/**
 * MatchFeedbackService — After each match, players can rate their opponents'
 * perceived strength ("lower" | "correct" | "higher" than current ELO).
 *
 * We aggregate feedback across recent matches and apply a small calibration
 * delta to the opponent's ELO (max ±25 per calibration cycle).
 */
export class MatchFeedbackService {
  private static readonly CALIBRATION_THRESHOLD = 3; // min feedbacks to trigger
  private static readonly MAX_DELTA = 25;
  private static readonly FEEDBACK_WINDOW_DAYS = 30;

  /**
   * Submit feedback about an opponent after a match.
   */
  static async submit(
    matchId: number,
    userId: number,
    opponentUserId: number,
    feedback: FeedbackValue,
    comment?: string,
  ): Promise<void> {
    if (userId === opponentUserId) {
      throw new Error('Cannot provide feedback about yourself');
    }

    const match = await db(t('matches')).where('id', matchId).first();
    if (!match) throw new Error('Match not found');
    if (match.status !== 'completed') {
      throw new Error('Feedback only allowed on completed matches');
    }

    const now = new Date();
    // Upsert: replace if already exists
    const existing = await db(t('match_feedback'))
      .where('match_id', matchId)
      .where('user_id', userId)
      .where('opponent_user_id', opponentUserId)
      .first();

    if (existing) {
      await db(t('match_feedback'))
        .where('id', existing.id)
        .update({ feedback, comment: comment ?? null });
    } else {
      await db(t('match_feedback')).insert({
        match_id: matchId,
        user_id: userId,
        opponent_user_id: opponentUserId,
        feedback,
        comment: comment ?? null,
        created_at: now,
      });
    }

    // Check if we should calibrate opponent's ELO
    await this.maybeCalibrate(opponentUserId);
  }

  /**
   * If we have enough recent feedback (>= 3) for a user, adjust their ELO
   * by a small delta based on consensus.
   *
   * Rule: if net score (higher_count - lower_count) >= 2 → +15
   *       if net score <= -2 → -15
   *       otherwise no adjustment
   */
  private static async maybeCalibrate(userId: number): Promise<void> {
    const cutoff = new Date();
    cutoff.setDate(cutoff.getDate() - this.FEEDBACK_WINDOW_DAYS);

    const feedbacks = await db(t('match_feedback'))
      .where('opponent_user_id', userId)
      .where('created_at', '>=', cutoff)
      .select('feedback');

    if (feedbacks.length < this.CALIBRATION_THRESHOLD) return;

    const higher = feedbacks.filter((f: any) => f.feedback === 'higher').length;
    const lower = feedbacks.filter((f: any) => f.feedback === 'lower').length;
    const net = higher - lower;

    let delta = 0;
    if (net >= 2) delta = Math.min(this.MAX_DELTA, 15 + Math.floor(net / 2));
    else if (net <= -2) delta = Math.max(-this.MAX_DELTA, -15 - Math.floor(Math.abs(net) / 2));

    if (delta === 0) return;

    const profile = await db(t('profiles')).where('user_id', userId).first();
    if (!profile) return;

    const newElo = Math.max(400, (profile.elo_padel ?? EloService.DEFAULT_ELO) + delta);
    const newPeak = Math.max(profile.elo_padel_peak ?? newElo, newElo);

    await db(t('profiles')).where('user_id', userId).update({
      elo_padel: newElo,
      elo_padel_peak: newPeak,
      updated_at: new Date(),
    });

    // Log notification for transparency
    await db(t('notifications')).insert({
      user_id: userId,
      type: 'general',
      title: 'Rating angepasst',
      body:
        delta > 0
          ? `Basierend auf Spieler-Feedback wurde dein Rating um +${delta} ELO angehoben.`
          : `Basierend auf Spieler-Feedback wurde dein Rating um ${delta} ELO angepasst.`,
      data: JSON.stringify({ type: 'rating_calibration', delta, new_elo: newElo }),
      created_at: new Date(),
    });
  }

  /**
   * List feedback opportunities for a user — matches they played recently
   * where they haven't yet given feedback about their opponent(s).
   */
  static async listPending(userId: number): Promise<any[]> {
    const cutoff = new Date();
    cutoff.setDate(cutoff.getDate() - this.FEEDBACK_WINDOW_DAYS);

    const matches = await db(t('matches'))
      .where('status', 'completed')
      .where('completed_at', '>=', cutoff)
      .where(function () {
        this.whereExists(function () {
          this.select('*')
            .from(t('registrations'))
            .whereRaw(`${t('registrations')}.id = ${t('matches')}.participant_1_registration_id`)
            .where(`${t('registrations')}.user_id`, userId);
        }).orWhereExists(function () {
          this.select('*')
            .from(t('registrations'))
            .whereRaw(`${t('registrations')}.id = ${t('matches')}.participant_2_registration_id`)
            .where(`${t('registrations')}.user_id`, userId);
        });
      })
      .select('matches.*');

    // Filter out matches where user already gave feedback
    const result: any[] = [];
    for (const match of matches) {
      const given = await db(t('match_feedback'))
        .where('match_id', match.id)
        .where('user_id', userId)
        .first();
      if (!given) result.push(match);
    }
    return result;
  }
}
