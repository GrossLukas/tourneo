import { v4 as uuidv4 } from 'uuid';
import { db, t } from '../config/database';
import { AppError } from '../middleware/errorHandler';

interface BracketMatch {
  round: number;
  matchNumber: number;
  roundName: string;
  participant1RegId: number | null;
  participant2RegId: number | null;
  nextMatchNumber: number | null;
  isThirdPlace: boolean;
  isFinal: boolean;
}

export class BracketService {
  static async generateBracket(eventId: number, userId: number) {
    const event = await db(t('events')).where('id', eventId).first();
    if (!event) throw AppError.notFound('Event');

    // Check if bracket already exists
    const existingBracket = await db(t('brackets')).where('event_id', eventId).first();
    if (existingBracket && existingBracket.status !== 'draft') {
      throw AppError.badRequest('Bracket has already been published');
    }

    // Get confirmed registrations with seeding
    const registrations = await db(t('registrations'))
      .where('event_id', eventId)
      .where('status', 'confirmed')
      .where('checked_in', true)
      .orderByRaw('seed_number IS NULL, seed_number ASC, created_at ASC');

    if (registrations.length < 2) {
      throw AppError.badRequest('Need at least 2 confirmed participants to generate bracket');
    }

    // Calculate bracket size (next power of 2)
    const bracketSize = this.nextPowerOf2(registrations.length);
    const totalRounds = Math.log2(bracketSize);
    const totalMatches = bracketSize - 1 + (event.has_third_place_match ? 1 : 0);

    // Seed participants into bracket positions
    const seededPositions = this.seedParticipants(registrations, bracketSize);

    // Generate match structure
    const matches = this.generateMatchStructure(
      bracketSize,
      totalRounds,
      seededPositions,
      event.has_third_place_match
    );

    const now = new Date();

    await db.transaction(async (trx) => {
      // Delete existing draft bracket if any
      if (existingBracket) {
        await trx(t('matches')).where('bracket_id', existingBracket.id).del();
        await trx(t('brackets')).where('id', existingBracket.id).del();
      }

      // Create bracket
      const [bracketId] = await trx(t('brackets')).insert({
        event_id: eventId,
        structure: JSON.stringify({
          size: bracketSize,
          total_rounds: totalRounds,
          has_third_place: event.has_third_place_match,
          participant_count: registrations.length,
          byes: bracketSize - registrations.length,
        }),
        total_rounds: totalRounds,
        status: 'draft',
        generated_at: now,
        created_at: now,
        updated_at: now,
      });

      // Create match records
      const matchInserts = [];
      const matchIdMap = new Map<number, number>();

      for (const match of matches) {
        const [matchId] = await trx(t('matches')).insert({
          uuid: uuidv4(),
          event_id: eventId,
          bracket_id: bracketId,
          round_number: match.round,
          match_number: match.matchNumber,
          round_name: match.roundName,
          participant_1_registration_id: match.participant1RegId,
          participant_2_registration_id: match.participant2RegId,
          is_third_place_match: match.isThirdPlace,
          is_final: match.isFinal,
          status: 'upcoming',
          created_at: now,
          updated_at: now,
        });
        matchIdMap.set(match.matchNumber, matchId);
      }

      // Update next_match_id references
      for (const match of matches) {
        if (match.nextMatchNumber !== null) {
          const currentMatchId = matchIdMap.get(match.matchNumber);
          const nextMatchId = matchIdMap.get(match.nextMatchNumber);
          if (currentMatchId && nextMatchId) {
            await trx(t('matches'))
              .where('id', currentMatchId)
              .update({ next_match_id: nextMatchId });
          }
        }
      }

      // Auto-advance byes (matches where one participant is null)
      for (const match of matches) {
        if (match.participant1RegId && !match.participant2RegId) {
          const matchId = matchIdMap.get(match.matchNumber);
          if (matchId) {
            await trx(t('matches')).where('id', matchId).update({
              winner_registration_id: match.participant1RegId,
              status: 'walkover',
              completed_at: now,
            });
          }
        } else if (!match.participant1RegId && match.participant2RegId) {
          const matchId = matchIdMap.get(match.matchNumber);
          if (matchId) {
            await trx(t('matches')).where('id', matchId).update({
              winner_registration_id: match.participant2RegId,
              status: 'walkover',
              completed_at: now,
            });
          }
        }
      }

      // Audit log
      await trx(t('audit_log')).insert({
        user_id: userId,
        action: 'bracket.generated',
        entity_type: 'bracket',
        entity_id: bracketId,
        new_values: JSON.stringify({
          size: bracketSize,
          rounds: totalRounds,
          matches: matches.length,
          participants: registrations.length,
        }),
        created_at: now,
      });
    });

    return this.getBracket(eventId);
  }

  static async getBracket(eventId: number) {
    const bracket = await db(t('brackets')).where('event_id', eventId).first();
    if (!bracket) throw AppError.notFound('Bracket');

    const matches = await db(t('matches'))
      .where('bracket_id', bracket.id)
      .leftJoin(
        `${t('registrations')} as r1`,
        `${t('matches')}.participant_1_registration_id`,
        'r1.id'
      )
      .leftJoin(
        `${t('registrations')} as r2`,
        `${t('matches')}.participant_2_registration_id`,
        'r2.id'
      )
      .leftJoin(`${t('profiles')} as p1`, 'r1.user_id', 'p1.user_id')
      .leftJoin(`${t('profiles')} as p2`, 'r2.user_id', 'p2.user_id')
      .leftJoin(t('courts'), `${t('matches')}.court_id`, `${t('courts')}.id`)
      .leftJoin(t('match_scores'), `${t('matches')}.id`, `${t('match_scores')}.match_id`)
      .select(
        `${t('matches')}.*`,
        'p1.first_name as p1_first_name',
        'p1.last_name as p1_last_name',
        'p1.display_name as p1_display_name',
        'p2.first_name as p2_first_name',
        'p2.last_name as p2_last_name',
        'p2.display_name as p2_display_name',
        `${t('courts')}.name as court_name`
      )
      .orderBy('round_number', 'asc')
      .orderBy('match_number', 'asc');

    // Get scores for all matches
    const matchIds = matches.map((m: any) => m.id);
    const scores = await db(t('match_scores'))
      .whereIn('match_id', matchIds)
      .orderBy('set_number', 'asc');

    const scoreMap = new Map<number, any[]>();
    scores.forEach((s: any) => {
      if (!scoreMap.has(s.match_id)) scoreMap.set(s.match_id, []);
      scoreMap.get(s.match_id)!.push(s);
    });

    const enrichedMatches = matches.map((match: any) => ({
      id: match.id,
      uuid: match.uuid,
      round_number: match.round_number,
      match_number: match.match_number,
      round_name: match.round_name,
      court_name: match.court_name,
      scheduled_at: match.scheduled_at,
      is_third_place_match: match.is_third_place_match,
      is_final: match.is_final,
      status: match.status,
      participant_1: match.participant_1_registration_id ? {
        registration_id: match.participant_1_registration_id,
        name: match.p1_display_name || `${match.p1_first_name} ${match.p1_last_name}`,
      } : null,
      participant_2: match.participant_2_registration_id ? {
        registration_id: match.participant_2_registration_id,
        name: match.p2_display_name || `${match.p2_first_name} ${match.p2_last_name}`,
      } : null,
      winner_registration_id: match.winner_registration_id,
      scores: scoreMap.get(match.id) || [],
      started_at: match.started_at,
      completed_at: match.completed_at,
    }));

    return {
      id: bracket.id,
      event_id: bracket.event_id,
      structure: JSON.parse(bracket.structure),
      total_rounds: bracket.total_rounds,
      status: bracket.status,
      matches: enrichedMatches,
    };
  }

  static async enterMatchResult(
    matchId: number,
    scores: Array<{ set_number: number; p1_score: number; p2_score: number; is_tiebreak?: boolean }>,
    winnerId: number,
    userId: number
  ) {
    const match = await db(t('matches')).where('id', matchId).first();
    if (!match) throw AppError.notFound('Match');

    if (match.status === 'completed') {
      throw AppError.badRequest('Match result has already been entered');
    }

    // Validate winner is one of the participants
    if (winnerId !== match.participant_1_registration_id && winnerId !== match.participant_2_registration_id) {
      throw AppError.badRequest('Winner must be one of the match participants');
    }

    const now = new Date();

    await db.transaction(async (trx) => {
      // Insert scores
      for (const score of scores) {
        await trx(t('match_scores'))
          .insert({
            match_id: matchId,
            set_number: score.set_number,
            participant_1_score: score.p1_score,
            participant_2_score: score.p2_score,
            is_tiebreak: score.is_tiebreak || false,
          })
          .onConflict(['match_id', 'set_number'])
          .merge();
      }

      // Update match
      await trx(t('matches')).where('id', matchId).update({
        winner_registration_id: winnerId,
        status: 'completed',
        completed_at: now,
        updated_at: now,
      });

      // Advance winner to next match
      if (match.next_match_id) {
        const nextMatch = await trx(t('matches')).where('id', match.next_match_id).first();
        if (nextMatch) {
          if (!nextMatch.participant_1_registration_id) {
            await trx(t('matches')).where('id', match.next_match_id).update({
              participant_1_registration_id: winnerId,
              updated_at: now,
            });
          } else if (!nextMatch.participant_2_registration_id) {
            await trx(t('matches')).where('id', match.next_match_id).update({
              participant_2_registration_id: winnerId,
              updated_at: now,
            });
          }
        }
      }

      // Handle third place match - advance loser to 3rd place match
      if (match.round_name === 'Semifinal' || match.round_name === 'Halbfinale') {
        const loserId = winnerId === match.participant_1_registration_id
          ? match.participant_2_registration_id
          : match.participant_1_registration_id;

        const thirdPlaceMatch = await trx(t('matches'))
          .where('event_id', match.event_id)
          .where('is_third_place_match', true)
          .first();

        if (thirdPlaceMatch && loserId) {
          if (!thirdPlaceMatch.participant_1_registration_id) {
            await trx(t('matches')).where('id', thirdPlaceMatch.id).update({
              participant_1_registration_id: loserId,
              updated_at: now,
            });
          } else if (!thirdPlaceMatch.participant_2_registration_id) {
            await trx(t('matches')).where('id', thirdPlaceMatch.id).update({
              participant_2_registration_id: loserId,
              updated_at: now,
            });
          }
        }
      }

      // Notify participants
      const participant1 = await trx(t('registrations')).where('id', match.participant_1_registration_id).first();
      const participant2 = await trx(t('registrations')).where('id', match.participant_2_registration_id).first();

      const notifyUsers = [participant1?.user_id, participant2?.user_id].filter(Boolean);
      for (const notifyUserId of notifyUsers) {
        await trx(t('notifications')).insert({
          user_id: notifyUserId,
          type: 'result_entered',
          title: 'Ergebnis eingetragen',
          body: 'Das Ergebnis deines Matches wurde eingetragen.',
          data: JSON.stringify({ match_id: matchId, event_id: match.event_id }),
          created_at: now,
        });
      }

      // Audit log
      await trx(t('audit_log')).insert({
        user_id: userId,
        action: 'match.result_entered',
        entity_type: 'match',
        entity_id: matchId,
        new_values: JSON.stringify({ winner_id: winnerId, scores }),
        created_at: now,
      });
    });

    return this.getBracket(match.event_id);
  }

  // --- Helper Methods ---

  private static nextPowerOf2(n: number): number {
    let power = 1;
    while (power < n) power *= 2;
    return power;
  }

  private static seedParticipants(
    registrations: any[],
    bracketSize: number
  ): (number | null)[] {
    const positions: (number | null)[] = new Array(bracketSize).fill(null);

    // Standard seeding positions for power-of-2 brackets
    const seedOrder = this.generateSeedOrder(bracketSize);

    for (let i = 0; i < registrations.length; i++) {
      positions[seedOrder[i]] = registrations[i].id;
    }

    return positions;
  }

  private static generateSeedOrder(size: number): number[] {
    if (size === 1) return [0];
    if (size === 2) return [0, 1];

    const result: number[] = [];
    const recurse = (start: number, end: number, seeds: number[]) => {
      if (seeds.length === 0) return;
      if (seeds.length === 1) {
        result[seeds[0] - 1] = start;
        return;
      }

      const mid = Math.floor((start + end) / 2);
      const top: number[] = [];
      const bottom: number[] = [];

      for (let i = 0; i < seeds.length; i++) {
        if (i % 2 === 0) top.push(seeds[i]);
        else bottom.push(seeds[i]);
      }

      recurse(start, mid, top);
      recurse(mid, end, bottom);
    };

    const seeds = Array.from({ length: size }, (_, i) => i + 1);
    recurse(0, size, seeds);

    return result;
  }

  private static generateMatchStructure(
    bracketSize: number,
    totalRounds: number,
    seededPositions: (number | null)[],
    hasThirdPlace: boolean
  ): BracketMatch[] {
    const matches: BracketMatch[] = [];
    let matchNumber = 1;

    const roundNames: Record<number, string> = {};
    roundNames[totalRounds] = 'Finale';
    if (totalRounds >= 2) roundNames[totalRounds - 1] = 'Halbfinale';
    if (totalRounds >= 3) roundNames[totalRounds - 2] = 'Viertelfinale';
    if (totalRounds >= 4) roundNames[totalRounds - 3] = 'Achtelfinale';
    if (totalRounds >= 5) roundNames[totalRounds - 4] = 'Sechzehntelfinale';

    // Generate round 1 matches
    for (let i = 0; i < bracketSize; i += 2) {
      const currentMatchNumber = matchNumber++;
      const nextRoundMatch = Math.ceil(currentMatchNumber / 2) + bracketSize / 2;

      matches.push({
        round: 1,
        matchNumber: currentMatchNumber,
        roundName: roundNames[1] || `Runde 1`,
        participant1RegId: seededPositions[i],
        participant2RegId: seededPositions[i + 1],
        nextMatchNumber: totalRounds > 1 ? nextRoundMatch : null,
        isThirdPlace: false,
        isFinal: totalRounds === 1,
      });
    }

    // Generate subsequent rounds
    let matchesInRound = bracketSize / 4;
    for (let round = 2; round <= totalRounds; round++) {
      const firstMatchInRound = matchNumber;
      for (let i = 0; i < matchesInRound; i++) {
        const currentMatchNumber = matchNumber++;
        const nextRoundMatch = round < totalRounds
          ? Math.ceil((currentMatchNumber - firstMatchInRound + 1) / 2) + matchNumber + matchesInRound - (currentMatchNumber - firstMatchInRound + 1)
          : null;

        matches.push({
          round,
          matchNumber: currentMatchNumber,
          roundName: roundNames[round] || `Runde ${round}`,
          participant1RegId: null,
          participant2RegId: null,
          nextMatchNumber: round < totalRounds ? firstMatchInRound + matchesInRound + Math.floor(i / 2) : null,
          isThirdPlace: false,
          isFinal: round === totalRounds,
        });
      }
      matchesInRound = Math.max(1, matchesInRound / 2);
    }

    // Third place match
    if (hasThirdPlace && totalRounds >= 2) {
      matches.push({
        round: totalRounds,
        matchNumber: matchNumber++,
        roundName: 'Spiel um Platz 3',
        participant1RegId: null,
        participant2RegId: null,
        nextMatchNumber: null,
        isThirdPlace: true,
        isFinal: false,
      });
    }

    return matches;
  }
}