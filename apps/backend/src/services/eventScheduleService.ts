import { db, t } from '../config/database';
import { AppError } from '../middleware/errorHandler';
import { BracketService } from './bracketService';

export type AutoAssignOptions = {
  start_at?: string;
  match_duration_minutes?: number;
};

export class EventScheduleService {
  static async getSchedule(eventId: number) {
    const event = await db(t('events')).where('id', eventId).first();
    if (!event) throw AppError.notFound('Event');

    let matches: any[] = [];
    let bracketStatus: string | null = null;
    try {
      const bracket = await BracketService.getBracket(eventId);
      bracketStatus = bracket.status;
      matches = bracket.matches;
    } catch (err) {
      if ((err as any)?.statusCode !== 404) throw err;
    }

    const courts = await db(t('courts'))
      .where('venue_id', event.venue_id)
      .where('status', 'active')
      .select('id', 'name', 'court_type', 'is_indoor')
      .orderBy('name', 'asc');

    return {
      event_id: event.id,
      event_title: event.title,
      starts_at: event.start_date,
      bracket_status: bracketStatus,
      courts,
      matches: matches
        .slice()
        .sort(compareScheduleMatches)
        .map((match) => ({
          id: match.id,
          round_number: match.round_number,
          match_number: match.match_number,
          round_name: match.round_name,
          court_name: match.court_name,
          scheduled_at: match.scheduled_at,
          status: match.status,
          participant_1: match.participant_1,
          participant_2: match.participant_2,
          is_final: match.is_final,
          is_third_place_match: match.is_third_place_match,
          winner_registration_id: match.winner_registration_id,
        })),
    };
  }

  static async autoAssign(eventId: number, options: AutoAssignOptions = {}) {
    const event = await db(t('events')).where('id', eventId).first();
    if (!event) throw AppError.notFound('Event');

    const courts = await db(t('courts'))
      .where('venue_id', event.venue_id)
      .where('status', 'active')
      .orderBy('name', 'asc');
    if (!courts.length) {
      throw AppError.badRequest('No active courts found for this venue');
    }

    const matches = await db(t('matches'))
      .where('event_id', eventId)
      .whereIn('status', ['upcoming', 'in_progress'])
      .orderBy('round_number', 'asc')
      .orderBy('match_number', 'asc');
    if (!matches.length) {
      throw AppError.badRequest('No schedulable matches found');
    }

    const startAt = options.start_at ? new Date(options.start_at) : new Date(event.start_date);
    const durationMinutes = Math.min(Math.max(Number(options.match_duration_minutes || 30), 15), 180);

    await db.transaction(async (trx) => {
      for (let idx = 0; idx < matches.length; idx += 1) {
        const slot = Math.floor(idx / courts.length);
        const court = courts[idx % courts.length];
        const scheduledAt = new Date(startAt.getTime() + slot * durationMinutes * 60 * 1000);
        await trx(t('matches')).where('id', matches[idx].id).update({
          court_id: court.id,
          scheduled_at: scheduledAt,
          updated_at: new Date(),
        });
      }
    });

    return this.getSchedule(eventId);
  }
}

function compareScheduleMatches(a: any, b: any): number {
  const aTime = a.scheduled_at ? new Date(a.scheduled_at).getTime() : Number.MAX_SAFE_INTEGER;
  const bTime = b.scheduled_at ? new Date(b.scheduled_at).getTime() : Number.MAX_SAFE_INTEGER;
  if (aTime !== bTime) return aTime - bTime;
  if (a.round_number !== b.round_number) return Number(a.round_number) - Number(b.round_number);
  return Number(a.match_number) - Number(b.match_number);
}
