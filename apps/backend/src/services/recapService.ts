import { db, t } from '../config/database';
import { AppError } from '../middleware/errorHandler';

export interface RecapPlayer {
  user_id: number;
  display_name: string | null;
  avatar_url: string | null;
}

export interface RecapPodium {
  winner: RecapPlayer | null;
  runner_up: RecapPlayer | null;
  third_place: RecapPlayer | null;
}

export interface RecapStats {
  total_matches: number;
  total_sets_played: number;
  longest_match_minutes: number | null;
  highest_score: { p1: number; p2: number } | null;
  participant_count: number;
  duration_hours: number;
}

export interface RecapPrize {
  place: number;
  amount_cents: number;
  user_id: number | null;
  display_name: string | null;
}

export interface EventRecap {
  event: {
    id: number;
    title: string;
    start_date: Date;
    end_date: Date;
    sport_category: string;
  };
  podium: RecapPodium;
  stats: RecapStats;
  prize_distribution: RecapPrize[];
}

/**
 * RecapService — produces an end-of-tournament summary.
 */
export class RecapService {
  static async getRecap(eventId: number): Promise<EventRecap> {
    const event = await db(t('events')).where('id', eventId).first();
    if (!event) throw AppError.notFound('Event');

    const matches = await db(t('matches')).where('event_id', eventId);
    const completed = matches.filter((m: any) => m.status === 'completed');

    // Total sets played
    const matchIds = matches.map((m: any) => m.id);
    let totalSets = 0;
    let highestScore: { p1: number; p2: number } | null = null;
    if (matchIds.length) {
      const sets = await db(t('match_scores')).whereIn('match_id', matchIds);
      totalSets = sets.length;
      for (const s of sets) {
        const total = (s.participant_1_score ?? 0) + (s.participant_2_score ?? 0);
        const prevTotal = highestScore
          ? highestScore.p1 + highestScore.p2
          : -1;
        if (total > prevTotal) {
          highestScore = { p1: s.participant_1_score, p2: s.participant_2_score };
        }
      }
    }

    // Longest match (minutes)
    let longestMinutes: number | null = null;
    for (const m of completed) {
      if (m.started_at && m.completed_at) {
        const minutes = Math.round(
          (new Date(m.completed_at).getTime() - new Date(m.started_at).getTime()) / 60000
        );
        if (longestMinutes === null || minutes > longestMinutes) longestMinutes = minutes;
      }
    }

    const participants = await db(t('registrations'))
      .where({ event_id: eventId, status: 'confirmed' })
      .count('id as c')
      .first();

    const durationHours = Math.max(
      1,
      Math.round(
        (new Date(event.end_date).getTime() - new Date(event.start_date).getTime()) / 3600000
      )
    );

    // Podium from final placement on registrations
    const placements = await db(t('registrations') + ' as r')
      .leftJoin(t('profiles') + ' as p', 'r.user_id', 'p.user_id')
      .where('r.event_id', eventId)
      .whereIn('r.final_placement', [1, 2, 3])
      .select(
        'r.user_id',
        'r.final_placement',
        'p.display_name',
        'p.avatar_url',
        'p.first_name',
        'p.last_name',
      );

    const playerFor = (place: number): RecapPlayer | null => {
      const p = placements.find((x: any) => x.final_placement === place);
      if (!p) return null;
      return {
        user_id: p.user_id,
        display_name:
          p.display_name ||
          [p.first_name, p.last_name].filter(Boolean).join(' ') ||
          null,
        avatar_url: p.avatar_url ?? null,
      };
    };

    // Prize distribution
    const payouts = await db(t('prize_payouts') + ' as pp')
      .leftJoin(t('profiles') + ' as p', 'pp.user_id', 'p.user_id')
      .where('pp.event_id', eventId)
      .orderBy('pp.place', 'asc')
      .select(
        'pp.place',
        'pp.amount_cents',
        'pp.user_id',
        'p.display_name',
        'p.first_name',
        'p.last_name',
      );

    return {
      event: {
        id: event.id,
        title: event.title,
        start_date: event.start_date,
        end_date: event.end_date,
        sport_category: event.sport_category,
      },
      podium: {
        winner: playerFor(1),
        runner_up: playerFor(2),
        third_place: playerFor(3),
      },
      stats: {
        total_matches: completed.length,
        total_sets_played: totalSets,
        longest_match_minutes: longestMinutes,
        highest_score: highestScore,
        participant_count: Number(participants?.c ?? 0),
        duration_hours: durationHours,
      },
      prize_distribution: payouts.map((p: any) => ({
        place: p.place,
        amount_cents: p.amount_cents,
        user_id: p.user_id,
        display_name:
          p.display_name ||
          [p.first_name, p.last_name].filter(Boolean).join(' ') ||
          null,
      })),
    };
  }
}
