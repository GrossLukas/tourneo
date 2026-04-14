import { db, t } from '../config/database';
import { NotificationService } from './notificationService';

export type AchievementType =
  | 'first_win'
  | 'first_prize'
  | 'three_streak'
  | 'perfect_set'
  | 'veteran';

export interface AchievementRow {
  id: number;
  user_id: number;
  achievement_type: AchievementType;
  earned_at: Date;
}

const ACHIEVEMENT_LABELS: Record<AchievementType, { title: string; emoji: string }> = {
  first_win: { title: 'Erster Sieg', emoji: '🥇' },
  first_prize: { title: 'Erster Geldgewinn', emoji: '💰' },
  three_streak: { title: 'Drei in Folge', emoji: '🔥' },
  perfect_set: { title: 'Perfekter Satz', emoji: '⭐' },
  veteran: { title: 'Veteran', emoji: '🎖️' },
};

/**
 * AchievementService — tracks one-time badges per user.
 *
 * `grant()` is idempotent (insert ignored if already earned) and dispatches
 * a notification on the first earn.
 */
export class AchievementService {
  static async list(userId: number): Promise<AchievementRow[]> {
    return db(t('achievements')).where('user_id', userId).orderBy('earned_at', 'desc');
  }

  static async hasAchievement(userId: number, type: AchievementType): Promise<boolean> {
    const row = await db(t('achievements'))
      .where({ user_id: userId, achievement_type: type })
      .first();
    return !!row;
  }

  static async grant(userId: number, type: AchievementType): Promise<boolean> {
    const exists = await this.hasAchievement(userId, type);
    if (exists) return false;

    await db(t('achievements')).insert({
      user_id: userId,
      achievement_type: type,
      earned_at: new Date(),
    });

    const meta = ACHIEVEMENT_LABELS[type];
    await NotificationService.send(
      userId,
      'general',
      `${meta.emoji} ${meta.title}`,
      `Du hast ein neues Abzeichen freigeschaltet: ${meta.title}`,
      { achievement_type: type }
    );

    return true;
  }

  /**
   * Evaluate achievements for a user after a match win:
   * - first_win: granted on first ever win
   * - three_streak: granted when current streak >= 3
   * - perfect_set: granted when any set was 6:0
   */
  static async evaluateAfterMatchWin(
    userId: number,
    matchId: number
  ): Promise<AchievementType[]> {
    const granted: AchievementType[] = [];

    // first_win
    const winsCount = await db(t('matches'))
      .join(
        t('registrations'),
        'tourneo_matches.winner_registration_id',
        'tourneo_registrations.id'
      )
      .where('tourneo_registrations.user_id', userId)
      .where('tourneo_matches.status', 'completed')
      .count('tourneo_matches.id as c')
      .first();
    if (Number(winsCount?.c ?? 0) === 1) {
      if (await this.grant(userId, 'first_win')) granted.push('first_win');
    }

    // three_streak — current consecutive wins
    const recent = await db(t('matches') + ' as m')
      .join(t('registrations') + ' as r', function () {
        this.on('r.id', '=', 'm.participant_1_registration_id').orOn(
          'r.id',
          '=',
          'm.participant_2_registration_id'
        );
      })
      .where('r.user_id', userId)
      .where('m.status', 'completed')
      .orderBy('m.completed_at', 'desc')
      .limit(3)
      .select('m.winner_registration_id', 'r.id as reg_id');
    if (recent.length >= 3 && recent.every((r: any) => r.winner_registration_id === r.reg_id)) {
      if (await this.grant(userId, 'three_streak')) granted.push('three_streak');
    }

    // perfect_set — any 6:0 set in this match where user won
    const perfectSets = await db(t('match_scores'))
      .where('match_id', matchId)
      .where(function () {
        this.where(function () {
          this.where('participant_1_score', 6).andWhere('participant_2_score', 0);
        }).orWhere(function () {
          this.where('participant_1_score', 0).andWhere('participant_2_score', 6);
        });
      });
    if (perfectSets.length > 0) {
      if (await this.grant(userId, 'perfect_set')) granted.push('perfect_set');
    }

    return granted;
  }

  /**
   * Granted when a user receives prize money for the first time.
   */
  static async evaluateAfterPrize(userId: number): Promise<void> {
    const prizes = await db(t('prize_payouts'))
      .where('user_id', userId)
      .count('id as c')
      .first();
    if (Number(prizes?.c ?? 0) >= 1) {
      await this.grant(userId, 'first_prize');
    }
  }

  /**
   * Granted at 10+ played matches.
   */
  static async evaluateVeteran(userId: number): Promise<void> {
    const profile = await db(t('profiles')).where('user_id', userId).first();
    if (profile && (profile.elo_matches_played ?? 0) >= 10) {
      await this.grant(userId, 'veteran');
    }
  }
}
