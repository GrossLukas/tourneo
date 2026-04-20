import { db, t } from '../config/database';
import { EloService, type EloSport } from './eloService';

export interface PlayerProfile {
  user_id: number;
  display_name: string;
  avatar_url: string | null;
  city: string | null;
  bio: string | null;
  member_since: string;
  discoverable: boolean;
  last_active_at: string | null;
  padel: { elo: number; peak: number; tier: string };
  fifa: { elo: number; peak: number; tier: string };
  stats: {
    matches_played: number;
    matches_won: number;
    matches_lost: number;
    win_rate: number;
    current_streak: number;
    streak_type: 'win' | 'loss' | 'none';
    last_5: Array<'W' | 'L'>;
  };
  achievements_count: number;
  tournaments_played: number;
}

export interface HeadToHead {
  opponent_user_id: number;
  opponent_name: string;
  opponent_avatar: string | null;
  total_matches: number;
  my_wins: number;
  opponent_wins: number;
  recent_matches: Array<{
    match_id: number;
    event_title: string;
    completed_at: string;
    won: boolean;
  }>;
}

/**
 * PlayerProfileService — aggregates public player data.
 *
 * Returns denormalized ELO + streak + form stats for the /profile/:id screen.
 * Respects the `discoverable` flag: non-discoverable players return a stub.
 */
export class PlayerProfileService {
  static async getPublicProfile(viewerId: number, targetUserId: number): Promise<PlayerProfile | null> {
    const profile = await db(t('profiles')).where('user_id', targetUserId).first();
    if (!profile) return null;

    const user = await db(t('users')).where('id', targetUserId).whereNull('deleted_at').first();
    if (!user) return null;

    // If not discoverable AND not viewing self, return minimal profile
    const isSelf = viewerId === targetUserId;
    if (!profile.discoverable && !isSelf) {
      return {
        user_id: targetUserId,
        display_name: profile.display_name ?? `${profile.first_name ?? 'Spieler'}`,
        avatar_url: profile.avatar_url ?? null,
        city: null,
        bio: null,
        member_since: user.created_at,
        discoverable: false,
        last_active_at: null,
        padel: { elo: 0, peak: 0, tier: 'bronze' },
        fifa: { elo: 0, peak: 0, tier: 'bronze' },
        stats: {
          matches_played: 0,
          matches_won: 0,
          matches_lost: 0,
          win_rate: 0,
          current_streak: 0,
          streak_type: 'none',
          last_5: [],
        },
        achievements_count: 0,
        tournaments_played: 0,
      };
    }

    const matchStats = await this.computeMatchStats(targetUserId);
    const achievementsCount = await db(t('achievements'))
      .where('user_id', targetUserId)
      .count<{ count: string }>({ count: '*' })
      .first();
    const tournamentsPlayed = await db(t('registrations'))
      .where('user_id', targetUserId)
      .whereIn('status', ['confirmed', 'completed'])
      .countDistinct<{ count: string }>({ count: 'event_id' })
      .first();

    const padel = Number(profile.elo_padel ?? 1000);
    const fifa = Number(profile.elo_fifa ?? 1000);

    return {
      user_id: targetUserId,
      display_name: profile.display_name ?? `${profile.first_name ?? 'Spieler'}`,
      avatar_url: profile.avatar_url ?? null,
      city: profile.city ?? null,
      bio: profile.bio ?? null,
      member_since: user.created_at,
      discoverable: Boolean(profile.discoverable),
      last_active_at: profile.last_active_at ? new Date(profile.last_active_at).toISOString() : null,
      padel: {
        elo: padel,
        peak: Number(profile.elo_padel_peak ?? padel),
        tier: EloService.getTier(padel),
      },
      fifa: {
        elo: fifa,
        peak: Number(profile.elo_fifa_peak ?? fifa),
        tier: EloService.getTier(fifa),
      },
      stats: matchStats,
      achievements_count: Number(achievementsCount?.count ?? 0),
      tournaments_played: Number(tournamentsPlayed?.count ?? 0),
    };
  }

  private static async computeMatchStats(userId: number): Promise<PlayerProfile['stats']> {
    // Find completed matches where this user participated (solo or duo)
    const regs = await db(t('registrations'))
      .where('user_id', userId)
      .orWhere('partner_user_id', userId)
      .pluck('id');

    if (!regs.length) {
      return {
        matches_played: 0,
        matches_won: 0,
        matches_lost: 0,
        win_rate: 0,
        current_streak: 0,
        streak_type: 'none',
        last_5: [],
      };
    }

    const matches = await db(t('matches'))
      .where('status', 'completed')
      .whereNotNull('winner_registration_id')
      .where((q) => {
        q.whereIn('participant_1_registration_id', regs).orWhereIn('participant_2_registration_id', regs);
      })
      .orderBy('completed_at', 'desc')
      .select('id', 'participant_1_registration_id', 'participant_2_registration_id', 'winner_registration_id', 'completed_at');

    let won = 0;
    const form: Array<'W' | 'L'> = [];
    for (const m of matches) {
      const myReg = regs.includes(m.participant_1_registration_id) ? m.participant_1_registration_id : m.participant_2_registration_id;
      const wonMatch = m.winner_registration_id === myReg;
      if (wonMatch) won += 1;
      form.push(wonMatch ? 'W' : 'L');
    }

    const last5 = form.slice(0, 5);

    // Streak: count from most recent how many consecutive same result
    let streak = 0;
    let streakType: 'win' | 'loss' | 'none' = 'none';
    if (form.length > 0) {
      streakType = form[0] === 'W' ? 'win' : 'loss';
      for (const r of form) {
        if ((streakType === 'win' && r === 'W') || (streakType === 'loss' && r === 'L')) {
          streak += 1;
        } else {
          break;
        }
      }
    }

    const total = matches.length;
    return {
      matches_played: total,
      matches_won: won,
      matches_lost: total - won,
      win_rate: total > 0 ? Math.round((won / total) * 1000) / 10 : 0,
      current_streak: streak,
      streak_type: streakType,
      last_5: last5,
    };
  }

  /**
   * Head-to-head stats between viewer and target.
   */
  static async getHeadToHead(viewerId: number, targetUserId: number): Promise<HeadToHead | null> {
    if (viewerId === targetUserId) return null;

    const target = await db(t('profiles')).where('user_id', targetUserId).first();
    if (!target) return null;

    const viewerRegs: number[] = await db(t('registrations'))
      .where('user_id', viewerId)
      .orWhere('partner_user_id', viewerId)
      .pluck('id');
    const targetRegs: number[] = await db(t('registrations'))
      .where('user_id', targetUserId)
      .orWhere('partner_user_id', targetUserId)
      .pluck('id');

    if (!viewerRegs.length || !targetRegs.length) {
      return {
        opponent_user_id: targetUserId,
        opponent_name: target.display_name ?? `${target.first_name ?? 'Spieler'}`,
        opponent_avatar: target.avatar_url ?? null,
        total_matches: 0,
        my_wins: 0,
        opponent_wins: 0,
        recent_matches: [],
      };
    }

    const matches = await db(`${t('matches')} as m`)
      .join(`${t('events')} as e`, 'e.id', 'm.event_id')
      .where('m.status', 'completed')
      .whereNotNull('m.winner_registration_id')
      .where((q) => {
        q.where((sub) => {
          sub.whereIn('m.participant_1_registration_id', viewerRegs).whereIn('m.participant_2_registration_id', targetRegs);
        }).orWhere((sub) => {
          sub.whereIn('m.participant_1_registration_id', targetRegs).whereIn('m.participant_2_registration_id', viewerRegs);
        });
      })
      .orderBy('m.completed_at', 'desc')
      .limit(10)
      .select(
        'm.id as match_id',
        'm.winner_registration_id',
        'm.participant_1_registration_id',
        'm.participant_2_registration_id',
        'm.completed_at',
        'e.title as event_title',
      );

    let myWins = 0;
    let oppWins = 0;
    const recent = matches.map((m: any) => {
      const myReg = viewerRegs.includes(m.participant_1_registration_id)
        ? m.participant_1_registration_id
        : m.participant_2_registration_id;
      const won = m.winner_registration_id === myReg;
      if (won) myWins += 1;
      else oppWins += 1;
      return {
        match_id: m.match_id,
        event_title: m.event_title,
        completed_at: m.completed_at ? new Date(m.completed_at).toISOString() : '',
        won,
      };
    });

    return {
      opponent_user_id: targetUserId,
      opponent_name: target.display_name ?? `${target.first_name ?? 'Spieler'}`,
      opponent_avatar: target.avatar_url ?? null,
      total_matches: matches.length,
      my_wins: myWins,
      opponent_wins: oppWins,
      recent_matches: recent,
    };
  }
}
