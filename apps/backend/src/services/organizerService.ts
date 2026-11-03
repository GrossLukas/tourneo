import { db, t } from '../config/database';
import { AppError } from '../middleware/errorHandler';
import { RegistrationService } from './registrationService';

const ACTIVE = ['confirmed', 'pending_payment', 'waitlisted'];

const nameOf = (display?: string | null, first?: string | null, last?: string | null) =>
  display || [first, last].filter(Boolean).join(' ').trim() || 'Spieler';

/**
 * Tournament-day tools for whoever runs a tournament (admin or the player who
 * created it). Callers check that right with requireEventOrganizer; every
 * method here still makes sure the registration or match belongs to the event.
 */
export class OrganizerService {
  /** Names and status only – organisers do not get e-mail addresses or phone numbers. */
  static async listParticipants(eventId: number) {
    const rows = await db(`${t('registrations')} as r`)
      .leftJoin(`${t('profiles')} as p`, 'p.user_id', 'r.user_id')
      .leftJoin(`${t('profiles')} as pp`, 'pp.user_id', 'r.partner_user_id')
      .where('r.event_id', eventId)
      .whereIn('r.status', ACTIVE)
      .orderByRaw("CASE r.status WHEN 'confirmed' THEN 1 WHEN 'pending_payment' THEN 2 ELSE 3 END ASC")
      .orderBy('r.created_at', 'asc')
      .select(
        'r.id', 'r.user_id', 'r.status', 'r.registration_type', 'r.checked_in', 'r.checked_in_at',
        'r.waitlist_position', 'r.partner_user_id', 'r.partner_email',
        'p.display_name', 'p.first_name', 'p.last_name',
        'pp.display_name as partner_display_name', 'pp.first_name as partner_first_name',
        'pp.last_name as partner_last_name'
      );
    return rows.map((r: any) => ({
      id: Number(r.id),
      user_id: Number(r.user_id),
      status: r.status,
      registration_type: r.registration_type,
      checked_in: Boolean(r.checked_in),
      checked_in_at: r.checked_in_at ?? null,
      waitlist_position: r.waitlist_position ?? null,
      name: nameOf(r.display_name, r.first_name, r.last_name),
      partner_name: r.partner_user_id
        ? nameOf(r.partner_display_name, r.partner_first_name, r.partner_last_name)
        : r.partner_email ? 'Partner eingeladen' : null,
    }));
  }

  private static async registrationOf(eventId: number, regId: number) {
    const registration = Number.isFinite(regId)
      ? await db(t('registrations')).where('id', regId).where('event_id', eventId).first()
      : undefined;
    if (!registration) throw AppError.notFound('Registration');
    return registration;
  }

  static async checkIn(eventId: number, regId: number, staffUserId: number) {
    const registration = await this.registrationOf(eventId, regId);
    if (registration.status !== 'confirmed') {
      throw AppError.badRequest('Nur bestätigte Anmeldungen können eingecheckt werden.');
    }
    if (registration.checked_in) throw AppError.badRequest('Schon eingecheckt.');

    const now = new Date();
    await db.transaction(async (trx) => {
      await trx(t('registrations')).where('id', regId).update({ checked_in: true, checked_in_at: now, updated_at: now });
      await trx(t('checkins')).insert({
        registration_id: regId,
        checked_in_by: staffUserId,
        checked_in_at: now,
        method: 'manual',
        notes: null,
        created_at: now,
      });
    });
    return { registration_id: regId, checked_in: true, checked_in_at: now };
  }

  static async undoCheckIn(eventId: number, regId: number) {
    const registration = await this.registrationOf(eventId, regId);
    if (!registration.checked_in) throw AppError.badRequest('Nicht eingecheckt.');

    await db.transaction(async (trx) => {
      await trx(t('registrations')).where('id', regId).update({
        checked_in: false,
        checked_in_at: null,
        updated_at: new Date(),
      });
      await trx(t('checkins')).where('registration_id', regId).del();
    });
    return { registration_id: regId, checked_in: false };
  }

  static async removeParticipant(eventId: number, regId: number) {
    const registration = await this.registrationOf(eventId, regId);
    if (!ACTIVE.includes(registration.status)) throw AppError.badRequest('Diese Anmeldung ist schon storniert.');
    const bracket = await db(t('brackets')).where('event_id', eventId).first('status');
    if (bracket && bracket.status !== 'draft') {
      throw AppError.badRequest('Der Turnierbaum läuft schon – jetzt kann niemand mehr entfernt werden.');
    }

    await db(t('registrations')).where('id', regId).update({ status: 'cancelled', updated_at: new Date() });
    // A freed place goes to the next one on the waitlist (own transaction, so the push goes out too)
    if (registration.status !== 'waitlisted') await RegistrationService.promoteFromWaitlist(eventId);
    return { registration_id: regId, status: 'cancelled' };
  }

  /**
   * Takes a wrong result back so it can be entered again. Only as long as
   * nothing was built on it: the following match (and, for a semifinal, the
   * match for third place) must not be finished, and the final is never
   * reopened because it already completed the tournament.
   */
  static async reopenMatch(matchId: number) {
    await db.transaction(async (trx) => {
      const match = await trx(t('matches')).where('id', matchId).forUpdate().first();
      if (!match) throw AppError.notFound('Match');
      if (match.status !== 'completed' || !match.winner_registration_id) {
        throw AppError.badRequest('Für dieses Spiel gibt es noch kein Ergebnis.');
      }
      if (match.is_final) throw AppError.badRequest('Das Finale hat das Turnier schon abgeschlossen.');

      const winnerId = Number(match.winner_registration_id);
      const loserId = Number(
        winnerId === Number(match.participant_1_registration_id)
          ? match.participant_2_registration_id
          : match.participant_1_registration_id
      );
      const isSemifinal = match.round_name === 'Semifinal' || match.round_name === 'Halbfinale';
      const following = [
        match.next_match_id
          ? await trx(t('matches')).where('id', match.next_match_id).forUpdate().first()
          : null,
        isSemifinal
          ? await trx(t('matches')).where('event_id', match.event_id).where('is_third_place_match', true).forUpdate().first()
          : null,
      ];
      if (following.some((m) => m && m.status === 'completed')) {
        throw AppError.badRequest('Das nächste Spiel ist schon gespielt – korrigiere zuerst dieses Ergebnis.');
      }

      const now = new Date();
      const [next, thirdPlace] = following;
      for (const [slotMatch, regId] of [[next, winnerId], [thirdPlace, loserId]] as const) {
        if (!slotMatch || !regId) continue;
        const slot = Number(slotMatch.participant_1_registration_id) === regId ? 'participant_1_registration_id'
          : Number(slotMatch.participant_2_registration_id) === regId ? 'participant_2_registration_id'
            : null;
        if (slot) await trx(t('matches')).where('id', slotMatch.id).update({ [slot]: null, updated_at: now });
      }

      await trx(t('match_scores')).where('match_id', matchId).del();
      await trx(t('matches')).where('id', matchId).update({
        winner_registration_id: null,
        status: 'in_progress',
        completed_at: null,
        updated_at: now,
      });
    });
    return { match_id: matchId, status: 'in_progress' };
  }
}
