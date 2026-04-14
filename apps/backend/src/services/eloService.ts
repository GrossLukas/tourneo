import { db, t } from '../config/database';

export type EloSport = 'padel' | 'fifa';

export interface EloUpdate {
  userId: number;
  oldElo: number;
  newElo: number;
  delta: number;
}

export interface EloMatchResult {
  winner: EloUpdate;
  loser: EloUpdate;
}

/**
 * EloService — classic ELO rating with K=32.
 *
 * Pure math is exposed via `calculate()` so it is easy to unit test.
 * `updateAfterMatch()` reads the match, looks up both players' current ELO
 * for the relevant sport, computes the new rating, and persists it.
 */
export class EloService {
  static readonly K_FACTOR = 32;
  static readonly DEFAULT_ELO = 1000;

  /**
   * Pure ELO calculation. Returns the new ratings for both players.
   */
  static calculate(winnerElo: number, loserElo: number): {
    newWinner: number;
    newLoser: number;
    delta: number;
  } {
    const expected = 1 / (1 + Math.pow(10, (loserElo - winnerElo) / 400));
    const delta = Math.round(this.K_FACTOR * (1 - expected));
    return {
      newWinner: winnerElo + delta,
      newLoser: loserElo - delta,
      delta,
    };
  }

  /**
   * Returns the tier label for a given ELO rating.
   */
  static getTier(elo: number): 'bronze' | 'silver' | 'gold' | 'platinum' | 'diamond' | 'elite' {
    if (elo >= 1350) return 'elite';
    if (elo >= 1200) return 'diamond';
    if (elo >= 1100) return 'platinum';
    if (elo >= 1000) return 'gold';
    if (elo >= 900) return 'silver';
    return 'bronze';
  }

  /**
   * Updates ELO for both participants of a completed match.
   *
   * Looks up the match's winner_registration_id, finds both users (handles
   * solo and duo), reads current ELO, applies new ratings, and writes back.
   * Also bumps elo_matches_played and updates peak when applicable.
   *
   * Returns the EloMatchResult for the first player on each side so callers
   * can show "ELO +/- X" in notifications.
   */
  static async updateAfterMatch(matchId: number, sport: EloSport): Promise<EloMatchResult | null> {
    const match = await db(t('matches')).where('id', matchId).first();
    if (!match) return null;
    if (!match.winner_registration_id) return null;
    if (!match.participant_1_registration_id || !match.participant_2_registration_id) return null;

    const winnerRegId = match.winner_registration_id;
    const loserRegId = winnerRegId === match.participant_1_registration_id
      ? match.participant_2_registration_id
      : match.participant_1_registration_id;

    const winnerUserIds = await this.getRegistrationUserIds(winnerRegId);
    const loserUserIds = await this.getRegistrationUserIds(loserRegId);

    if (!winnerUserIds.length || !loserUserIds.length) return null;

    const eloColumn = sport === 'padel' ? 'elo_padel' : 'elo_fifa';
    const peakColumn = sport === 'padel' ? 'elo_padel_peak' : 'elo_fifa_peak';

    // Average ELO when computing duos
    const winnerProfiles = await db(t('profiles'))
      .whereIn('user_id', winnerUserIds)
      .select('user_id', eloColumn, peakColumn);
    const loserProfiles = await db(t('profiles'))
      .whereIn('user_id', loserUserIds)
      .select('user_id', eloColumn, peakColumn);

    const winnerEloAvg = this.average(winnerProfiles.map((p: any) => p[eloColumn] ?? this.DEFAULT_ELO));
    const loserEloAvg = this.average(loserProfiles.map((p: any) => p[eloColumn] ?? this.DEFAULT_ELO));

    const { delta } = this.calculate(winnerEloAvg, loserEloAvg);
    const now = new Date();

    // Apply delta to each individual player
    for (const profile of winnerProfiles) {
      const current = profile[eloColumn] ?? this.DEFAULT_ELO;
      const peak = profile[peakColumn] ?? current;
      const next = current + delta;
      await db(t('profiles'))
        .where('user_id', profile.user_id)
        .update({
          [eloColumn]: next,
          [peakColumn]: Math.max(peak, next),
          elo_matches_played: db.raw('?? + 1', ['elo_matches_played']),
          updated_at: now,
        });
    }
    for (const profile of loserProfiles) {
      const current = profile[eloColumn] ?? this.DEFAULT_ELO;
      const next = Math.max(0, current - delta);
      await db(t('profiles'))
        .where('user_id', profile.user_id)
        .update({
          [eloColumn]: next,
          elo_matches_played: db.raw('?? + 1', ['elo_matches_played']),
          updated_at: now,
        });
    }

    return {
      winner: {
        userId: winnerUserIds[0],
        oldElo: winnerEloAvg,
        newElo: winnerEloAvg + delta,
        delta,
      },
      loser: {
        userId: loserUserIds[0],
        oldElo: loserEloAvg,
        newElo: Math.max(0, loserEloAvg - delta),
        delta: -delta,
      },
    };
  }

  /**
   * Returns the user IDs participating in a registration.
   * For solo: 1 user. For duo: 2 users (user + partner). For team: members.
   */
  private static async getRegistrationUserIds(registrationId: number): Promise<number[]> {
    const reg = await db(t('registrations')).where('id', registrationId).first();
    if (!reg) return [];
    const ids: number[] = [reg.user_id];
    if (reg.partner_user_id) ids.push(reg.partner_user_id);
    if (reg.team_id) {
      const members = await db(t('team_members'))
        .where('team_id', reg.team_id)
        .where('status', 'active')
        .pluck('user_id');
      for (const id of members) {
        if (!ids.includes(id)) ids.push(id);
      }
    }
    return ids;
  }

  private static average(values: number[]): number {
    if (!values.length) return this.DEFAULT_ELO;
    return Math.round(values.reduce((a, b) => a + b, 0) / values.length);
  }
}
