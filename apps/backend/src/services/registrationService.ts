import { v4 as uuidv4 } from 'uuid';
import crypto from 'crypto';
import { db, t } from '../config/database';
import { AppError } from '../middleware/errorHandler';
import { EventService } from './eventService';
import { CreateRegistrationInput } from '../validators/registrations';
import { MembershipTier } from '../types';
import dayjs from 'dayjs';

const ACTIVE_REGISTRATION_STATUSES = ['confirmed', 'pending_payment', 'pending_verification'];

export class RegistrationService {
  static async createRegistration(input: CreateRegistrationInput, userId: number) {
    const regUuid = uuidv4();
    const now = new Date();

    // All reads + writes happen inside a single transaction with a
    // SELECT ... FOR UPDATE on the event row. Concurrent registrations
    // therefore serialize: capacity check and duplicate check cannot
    // race with a parallel insert, which previously allowed overbooking
    // and duplicate registrations.
    const result = await db.transaction(async (trx) => {
      const event = await trx(t('events'))
        .where('id', input.event_id)
        .forUpdate()
        .first();
      if (!event) throw AppError.notFound('Event');

      const currentUser = await trx(t('users'))
        .where('id', userId)
        .where('status', 'active')
        .first();
      if (!currentUser) throw AppError.notFound('User');

      const membership = await trx(t('memberships'))
        .where('user_id', userId)
        .where('status', 'active')
        .first();
      const membershipTier: MembershipTier = membership?.tier || 'free';

      const accessCheck = EventService.canUserRegister(event, membershipTier);
      if (!accessCheck.canRegister) {
        throw AppError.badRequest(accessCheck.reason || 'Cannot register for this event');
      }

      const existingReg = await trx(t('registrations'))
        .where('event_id', input.event_id)
        .where('user_id', userId)
        .whereNotIn('status', ['cancelled', 'refunded', 'rejected'])
        .first();
      if (existingReg) {
        throw AppError.conflict('You are already registered for this event');
      }

      const partnerEmail = input.partner_email?.trim().toLowerCase();
      let partnerUserId = input.partner_user_id || null;
      let partnerInviteUserId: number | null = null;
      if (input.registration_type === 'duo' && partnerEmail) {
        if (partnerEmail === String(currentUser.email).toLowerCase()) {
          throw AppError.badRequest('Partner email must be different from your own email');
        }
        const partnerUser = await trx(t('users'))
          .whereRaw('LOWER(email) = ?', [partnerEmail])
          .where('status', 'active')
          .first();
        if (partnerUser) {
          partnerUserId = partnerUser.id;
          partnerInviteUserId = partnerUser.id;
        }
      }

      const incomingPartnerInvite = await trx(t('registrations'))
        .where('event_id', input.event_id)
        .where('registration_type', 'duo')
        .where('partner_invite_status', 'pending')
        .whereNot('user_id', userId)
        .where(function () {
          this.where('partner_user_id', userId).orWhere(
            'partner_invite_email',
            String(currentUser.email).toLowerCase()
          );
        })
        .orderBy('created_at', 'asc')
        .first();
      if (incomingPartnerInvite) {
        partnerUserId = incomingPartnerInvite.user_id;
      }

      const [{ count: currentCount }] = await trx(t('registrations'))
        .where('event_id', input.event_id)
        .whereIn('status', ACTIVE_REGISTRATION_STATUSES)
        .count('* as count');
      const isFull = Number(currentCount) >= event.max_participants;

      const { fee: netFee, discount } = EventService.calculateDiscountedFee(
        event.entry_fee_cents,
        membershipTier
      );

      let status: string;
      let waitlistPosition: number | null = null;
      const profile = await this.getProfileWithPlaytomicSubmission(trx, userId, input);
      const eligibility = this.evaluatePlaytomicEligibility(event, profile);

      if (isFull) {
        const [{ maxPos }] = await trx(t('registrations'))
          .where('event_id', input.event_id)
          .where('status', 'waitlisted')
          .max('waitlist_position as maxPos');

        waitlistPosition = (maxPos || 0) + 1;
        status = 'waitlisted';
      } else if (eligibility.requiresVerification && !eligibility.isEligible) {
        status = 'pending_verification';
      } else {
        status = 'pending_payment';
      }

      const [registrationId] = await trx(t('registrations')).insert({
        uuid: regUuid,
        event_id: input.event_id,
        user_id: userId,
        team_id: input.team_id || null,
        registration_type: input.registration_type,
        partner_user_id: partnerUserId || null,
        partner_invite_email: input.registration_type === 'duo' ? partnerEmail || null : null,
        partner_invite_status:
          input.registration_type === 'duo'
            ? incomingPartnerInvite
              ? 'accepted'
              : partnerEmail
                ? 'pending'
                : 'none'
            : 'none',
        partner_invited_at: input.registration_type === 'duo' && partnerEmail ? now : null,
        partner_accepted_at: incomingPartnerInvite ? now : null,
        status,
        membership_tier_at_registration: membershipTier,
        discount_applied_cents: discount,
        consent_tournament_terms: input.consent_tournament_terms,
        consent_age_verified: input.consent_age_verified,
        consent_media: input.consent_media,
        waitlist_position: waitlistPosition,
        eligibility_status: eligibility.requiresVerification
          ? eligibility.isEligible
            ? 'approved'
            : 'pending'
          : 'not_required',
        eligibility_note: eligibility.note,
        playtomic_level_at_registration: eligibility.level,
        playtomic_status_at_registration: eligibility.playtomicStatus,
        created_at: now,
        updated_at: now,
      });

      if (incomingPartnerInvite) {
        await trx(t('registrations')).where('id', incomingPartnerInvite.id).update({
          partner_user_id: userId,
          partner_invite_status: 'accepted',
          partner_accepted_at: now,
          updated_at: now,
        });
      }

      await trx(t('audit_log')).insert({
        user_id: userId,
        action: isFull
          ? 'registration.waitlisted'
          : status === 'pending_verification'
            ? 'registration.pending_verification'
            : 'registration.created',
        entity_type: 'registration',
        entity_id: registrationId,
        new_values: JSON.stringify({
          event_id: input.event_id,
          type: input.registration_type,
          status,
          fee: netFee,
          discount,
        }),
        created_at: now,
      });

      return {
        registrationId,
        status,
        waitlistPosition,
        netFee,
        discount,
        entryFeeCents: event.entry_fee_cents,
        membershipTier,
        requiresVerification: eligibility.requiresVerification,
        eligibilityStatus: eligibility.requiresVerification
          ? eligibility.isEligible
            ? 'approved'
            : 'pending'
          : 'not_required',
        eligibilityNote: eligibility.note,
        partnerInviteUserId,
        partnerInviteEmail: partnerEmail || null,
        partnerInviteAccepted: Boolean(incomingPartnerInvite),
        eventTitle: event.title,
        eventDate: event.start_date,
        inviterName:
          profile?.display_name ||
          [profile?.first_name, profile?.last_name].filter(Boolean).join(' ') ||
          String(currentUser.email).split('@')[0],
      };
    });

    if (result.partnerInviteUserId) {
      try {
        const { NotificationService } = await import('./notificationService');
        await NotificationService.send(
          result.partnerInviteUserId,
          'general',
          'Duo-Einladung',
          `Du wurdest zu "${result.eventTitle}" als Duo-Partner eingeladen. Melde dich separat an und bezahle deinen Anteil.`,
          { event_id: input.event_id, registration_id: result.registrationId, inviter_id: userId }
        );
      } catch (err) {
        console.error('[registration] Partner invite notification failed:', err);
      }
    }

    if (result.partnerInviteEmail) {
      try {
        const { emailService } = await import('./emailService');
        await emailService.sendDuoInvite(
          result.partnerInviteEmail,
          result.inviterName,
          result.eventTitle,
          result.eventDate ? new Date(result.eventDate).toLocaleDateString('de-DE') : ''
        );
      } catch (err) {
        console.error('[registration] Partner invite email failed:', err);
      }
    }

    return {
      id: result.registrationId,
      uuid: regUuid,
      event_id: input.event_id,
      status: result.status,
      waitlist_position: result.waitlistPosition,
      entry_fee_cents: result.entryFeeCents,
      discount_cents: result.discount,
      net_fee_cents: result.netFee,
      membership_tier: result.membershipTier,
      eligibility_status: result.eligibilityStatus,
      eligibility_note: result.eligibilityNote,
      partner_invite_email: result.partnerInviteEmail,
      partner_invite_status: result.partnerInviteAccepted
        ? 'accepted'
        : result.partnerInviteEmail
          ? 'pending'
          : 'none',
      requires_verification: result.requiresVerification && result.status === 'pending_verification',
      requires_payment: result.status === 'pending_payment' && result.netFee > 0,
    };
  }

  static async cancelRegistration(registrationId: number, userId: number, reason?: string) {
    const registration = await db(t('registrations'))
      .where('id', registrationId)
      .where('user_id', userId)
      .first();

    if (!registration) throw AppError.notFound('Registration');

    const cancellableStatuses = ['confirmed', 'pending_payment', 'pending_verification', 'waitlisted'] as const;
    if (!cancellableStatuses.includes(registration.status)) {
      throw AppError.badRequest('This registration cannot be cancelled');
    }

    const event = await db(t('events')).where('id', registration.event_id).first();
    if (!event) throw AppError.notFound('Event');

    const now = new Date();
    const eventStart = new Date(event.start_date);
    const daysUntilEvent = dayjs(eventStart).diff(dayjs(now), 'day');

    // Default to no refund. Each branch must explicitly opt-in so a future
    // status added to the enum cannot accidentally inherit a refund.
    let refundPercentage = 0;
    const refundReason: 'user_cancellation_14d' | 'user_cancellation_late' = 'user_cancellation_14d';

    if (registration.status === 'waitlisted') {
      // Waitlisted users get a full refund if they paid (rare case where
      // someone pre-paid before being demoted to the waitlist).
      refundPercentage = 100;
    } else if (registration.status === 'confirmed' && daysUntilEvent >= 14) {
      refundPercentage = 75;
    } else {
      refundPercentage = 0;
    }

    let promoted: any = null;
    await db.transaction(async (trx) => {
      await trx(t('registrations')).where('id', registrationId).update({
        status: 'cancelled',
        updated_at: now,
      });

      // If there's a confirmed payment and refund is due
      if (refundPercentage > 0 && registration.status === 'confirmed') {
        const payment = await trx(t('payments'))
          .where('registration_id', registrationId)
          .where('status', 'succeeded')
          .first();

        if (payment) {
          const refundAmount = Math.round(payment.net_amount_cents * (refundPercentage / 100));

          await trx(t('refunds')).insert({
            uuid: uuidv4(),
            payment_id: payment.id,
            user_id: userId,
            amount_cents: refundAmount,
            reason: refundReason,
            reason_detail: reason || null,
            status: 'pending',
            created_at: now,
          });
        }
      }

      // If confirmed registration was cancelled, check waitlist
      if (registration.status === 'confirmed') {
        promoted = await this.promoteFromWaitlist(registration.event_id, trx);
      }

      // Audit log
      await trx(t('audit_log')).insert({
        user_id: userId,
        action: 'registration.cancelled',
        entity_type: 'registration',
        entity_id: registrationId,
        new_values: JSON.stringify({
          refund_percentage: refundPercentage,
          days_until_event: daysUntilEvent,
        }),
        created_at: now,
      });
    });

    if (promoted) {
      await this.dispatchWaitlistPromotion(promoted);
    }

    if (refundPercentage > 0) {
      try {
        const userRow = await db(t('users')).where('id', userId).first();
        const profileRow = await db(t('profiles')).where('user_id', userId).first();
        if (userRow?.email) {
          const { emailService } = await import('./emailService');
          const payment = await db(t('payments'))
            .where('registration_id', registrationId)
            .where('status', 'succeeded')
            .first();
          if (payment) {
            await emailService.sendRefundUpdate(
              userRow.email,
              profileRow?.first_name || 'Spieler',
              Math.round(payment.net_amount_cents * (refundPercentage / 100)),
              'pending'
            );
          }
        }
      } catch (err) {
        console.error('[registration] Refund email failed:', err);
      }
    }

    return {
      id: registrationId,
      status: 'cancelled',
      refund_percentage: refundPercentage,
      refund_eligible: refundPercentage > 0,
    };
  }

  /**
   * Promotes the next user from the waitlist to a pending_payment slot.
   * - Checks capacity first to avoid over-booking.
   * - Sends an in-app + push notification via NotificationService.
   * - Sets a 24h payment window (waitlist_promoted_at + 24h).
   *
   * Re-runs idempotently: callers may invoke after every cancellation
   * or refund and any cron job can call this safely.
   */
  static async promoteFromWaitlist(eventId: number, trx?: any) {
    // When called without an outer transaction, open one and lock the
    // event row so the capacity check and promotion cannot race with a
    // concurrent createRegistration or a parallel waitlist promotion.
    if (!trx) {
      return db.transaction(async (innerTrx) => {
        return this._promoteFromWaitlistInternal(eventId, innerTrx, /* externalTrx */ false);
      });
    }
    return this._promoteFromWaitlistInternal(eventId, trx, /* externalTrx */ true);
  }

  private static async _promoteFromWaitlistInternal(
    eventId: number,
    trx: any,
    externalTrx: boolean
  ) {
    const event = await trx(t('events')).where('id', eventId).forUpdate().first();
    if (!event) return null;

    const [{ count: activeCount }] = await trx(t('registrations'))
      .where('event_id', eventId)
      .whereIn('status', ACTIVE_REGISTRATION_STATUSES)
      .count('* as count');

    if (Number(activeCount) >= event.max_participants) {
      return null;
    }

    const nextInLine = await trx(t('registrations'))
      .where('event_id', eventId)
      .where('status', 'waitlisted')
      .orderByRaw(`
        CASE membership_tier_at_registration
          WHEN 'club' THEN 1
          WHEN 'plus' THEN 2
          WHEN 'free' THEN 3
        END ASC,
        COALESCE(waitlist_position, 999999) ASC,
        created_at ASC
      `)
      .first();

    if (!nextInLine) return null;

    const now = new Date();
    const profile = await trx(t('profiles')).where('user_id', nextInLine.user_id).first();
    const eligibility = this.evaluatePlaytomicEligibility(event, profile);
    const promotedStatus =
      eligibility.requiresVerification && !eligibility.isEligible
        ? 'pending_verification'
        : 'pending_payment';
    const notificationTitle =
      promotedStatus === 'pending_verification' ? 'Playtomic-Prüfung offen' : 'Du bist dabei!';
    const paymentWindowHours = Number(event.waitlist_payment_window_hours || 24);
    const notificationBody =
      promotedStatus === 'pending_verification'
        ? 'Ein Platz ist frei geworden. Wir prüfen jetzt deine Playtomic-Daten.'
        : `Ein Platz ist frei geworden. Bitte schließe deine Zahlung innerhalb von ${paymentWindowHours} Stunden ab.`;

    await trx(t('registrations')).where('id', nextInLine.id).update({
      status: promotedStatus,
      waitlist_position: null,
      waitlist_promoted_at: now,
      eligibility_status: eligibility.requiresVerification
        ? eligibility.isEligible
          ? 'approved'
          : 'pending'
        : 'not_required',
      eligibility_note: eligibility.note,
      playtomic_level_at_registration: eligibility.level,
      playtomic_status_at_registration: eligibility.playtomicStatus,
      updated_at: now,
    });

    // Persist the notification row inside the current transaction so it
    // rolls back if the promotion fails. Push delivery (Firebase) is
    // dispatched after the transaction commits; see waitlist_push below.
    await trx(t('notifications')).insert({
      user_id: nextInLine.user_id,
      type: 'waitlist_promoted',
      title: notificationTitle,
      body: notificationBody,
      data: JSON.stringify({
        event_id: eventId,
        registration_id: nextInLine.id,
        payment_window_hours: paymentWindowHours,
      }),
      created_at: now,
    });

    // Fire-and-forget push only when we own the transaction; when the
    // caller owns it, they should dispatch after their own commit.
    if (!externalTrx) {
      const promotedUserId = nextInLine.user_id as number;
      const promotedRegId = nextInLine.id as number;
      setImmediate(() => {
        // The notification row was already inserted in the transaction
        // above; tell NotificationService to dispatch the push only.
        import('./notificationService')
          .then(() =>
            this.dispatchWaitlistPromotion({
              registrationId: promotedRegId,
              userId: promotedUserId,
              eventId,
              eventTitle: event.title,
              eventDate: event.start_date,
              status: promotedStatus,
              notificationTitle,
              notificationBody,
            })
          )
          .catch((err) => {
            console.error('[waitlist] Failed to send push to promoted user:', err?.message || err);
          });
      });
    }

    return {
      registrationId: nextInLine.id as number,
      userId: nextInLine.user_id as number,
      eventId,
      eventTitle: event.title,
      eventDate: event.start_date,
      status: promotedStatus,
      notificationTitle,
      notificationBody,
    };
  }

  private static async dispatchWaitlistPromotion(promotion: {
    registrationId: number;
    userId: number;
    eventId: number;
    eventTitle: string;
    eventDate?: Date | string | null;
    status: string;
    notificationTitle: string;
    notificationBody: string;
  }) {
    try {
      const { NotificationService } = await import('./notificationService');
      await NotificationService.send(
        promotion.userId,
        'waitlist_promoted',
        promotion.notificationTitle,
        promotion.notificationBody,
        {
          event_id: promotion.eventId,
          registration_id: promotion.registrationId,
          payment_required: promotion.status === 'pending_payment',
        },
        { skipDbInsert: true }
      );
    } catch (err) {
      console.error('[waitlist] Failed to send push to promoted user:', err);
    }

    try {
      const [userRow, profileRow] = await Promise.all([
        db(t('users')).where('id', promotion.userId).first(),
        db(t('profiles')).where('user_id', promotion.userId).first(),
      ]);
      if (userRow?.email) {
        const { emailService } = await import('./emailService');
        await emailService.sendPaymentRequired(
          userRow.email,
          profileRow?.first_name || 'Spieler',
          promotion.eventTitle,
          promotion.eventDate ? new Date(promotion.eventDate).toLocaleDateString('de-DE') : '',
          'waitlist_promoted'
        );
      }
    } catch (err) {
      console.error('[waitlist] Failed to send promotion email:', err);
    }
  }

  /**
   * Cron-friendly: cancels promoted waitlist users that have not paid
   * within the event payment window and promotes the next one. Safe to call
   * from any scheduler.
   */
  static async expireUnpaidPromotions() {
    const now = new Date();
    const promoted = await db(`${t('registrations')} as r`)
      .leftJoin(`${t('events')} as e`, 'r.event_id', 'e.id')
      .where('r.status', 'pending_payment')
      .whereNotNull('r.waitlist_promoted_at')
      .select('r.*', 'e.waitlist_payment_window_hours');

    const expired = promoted.filter((reg: any) => {
      const promotedAt = new Date(reg.waitlist_promoted_at).getTime();
      const windowHours = Number(reg.waitlist_payment_window_hours || 24);
      return now.getTime() >= promotedAt + windowHours * 60 * 60 * 1000;
    });

    for (const reg of expired) {
      await db(t('registrations')).where('id', reg.id).update({
        status: 'cancelled',
        updated_at: now,
      });
      await this.promoteFromWaitlist(reg.event_id);
    }

    return { expired_count: expired.length };
  }

  static async sendWaitlistPaymentReminders() {
    const now = new Date();
    const promoted = await db(`${t('registrations')} as r`)
      .leftJoin(`${t('events')} as e`, 'r.event_id', 'e.id')
      .where('r.status', 'pending_payment')
      .whereNotNull('r.waitlist_promoted_at')
      .whereNull('r.waitlist_payment_reminder_sent_at')
      .select(
        'r.id',
        'r.user_id',
        'r.event_id',
        'r.waitlist_promoted_at',
        'e.title as event_title',
        'e.waitlist_payment_window_hours'
      );

    let sent = 0;
    for (const reg of promoted) {
      const windowHours = Number(reg.waitlist_payment_window_hours || 24);
      const promotedAt = new Date(reg.waitlist_promoted_at).getTime();
      const deadline = promotedAt + windowHours * 60 * 60 * 1000;
      const reminderAt = deadline - 6 * 60 * 60 * 1000;
      if (now.getTime() < reminderAt || now.getTime() >= deadline) continue;

      const hoursLeft = Math.max(1, Math.ceil((deadline - now.getTime()) / (60 * 60 * 1000)));
      const { NotificationService } = await import('./notificationService');
      await NotificationService.send(
        reg.user_id,
        'waitlist_promoted',
        `Noch ${hoursLeft}h zum Bezahlen`,
        `Dein Wartelistenplatz fuer "${reg.event_title}" ist noch kurz reserviert. Schließe die Zahlung jetzt ab.`,
        { event_id: reg.event_id, registration_id: reg.id, payment_required: true }
      );
      await db(t('registrations')).where('id', reg.id).update({
        waitlist_payment_reminder_sent_at: now,
        updated_at: now,
      });
      sent += 1;
    }

    return { reminder_count: sent };
  }

  static async checkIn(registrationId: number, userId: number) {
    const registration = await db(t('registrations'))
      .where('id', registrationId)
      .where('user_id', userId)
      .first();

    if (!registration) throw AppError.notFound('Registration');
    if (registration.status !== 'confirmed') {
      throw AppError.badRequest('Only confirmed registrations can check in');
    }
    if (registration.checked_in) {
      throw AppError.badRequest('Already checked in');
    }

    const event = await db(t('events')).where('id', registration.event_id).first();
    if (!event) throw AppError.notFound('Event');

    const now = new Date();
    const eventStart = new Date(event.start_date);
    const openMinutes = Number(event.checkin_opens_minutes_before || 60);
    const checkInOpens = new Date(eventStart.getTime() - openMinutes * 60 * 1000);

    if (now < checkInOpens) {
      throw AppError.badRequest('Check-in is not yet available');
    }

    await db.transaction(async (trx) => {
      await trx(t('registrations')).where('id', registrationId).update({
        checked_in: true,
        checked_in_at: now,
        updated_at: now,
      });
      await this.upsertCheckin(trx, registrationId, userId, now, 'self');
    });

    return { checked_in: true, checked_in_at: now };
  }

  static async ensureCheckinToken(registrationId: number, userId: number) {
    const registration = await db(t('registrations'))
      .where('id', registrationId)
      .where(function () {
        this.where('user_id', userId).orWhere('partner_user_id', userId);
      })
      .first();

    if (!registration) throw AppError.notFound('Registration');
    if (registration.status !== 'confirmed') {
      throw AppError.badRequest('Only confirmed registrations receive a check-in QR code');
    }

    const event = await db(t('events')).where('id', registration.event_id).first();
    if (!event) throw AppError.notFound('Event');

    const now = new Date();
    const expiresAt = new Date(new Date(event.end_date || event.start_date).getTime() + 12 * 60 * 60 * 1000);
    const existingExpires = registration.checkin_qr_expires_at
      ? new Date(registration.checkin_qr_expires_at)
      : null;
    const token =
      registration.checkin_qr_token && existingExpires && existingExpires > now
        ? registration.checkin_qr_token
        : crypto.randomBytes(24).toString('hex');

    if (token !== registration.checkin_qr_token) {
      await db(t('registrations')).where('id', registrationId).update({
        checkin_qr_token: token,
        checkin_qr_expires_at: expiresAt,
        updated_at: now,
      });
    }

    return {
      registration_id: registrationId,
      event_id: registration.event_id,
      token,
      payload: `tourneo-checkin:${token}`,
      expires_at: expiresAt,
      checked_in: Boolean(registration.checked_in),
    };
  }

  static async checkInByQrToken(rawToken: string, adminUserId: number) {
    const token = rawToken.replace(/^tourneo-checkin:/, '').trim();
    if (!/^[a-f0-9]{48}$/i.test(token)) {
      throw AppError.badRequest('Invalid check-in QR token');
    }

    const registration = await db(`${t('registrations')} as r`)
      .leftJoin(`${t('events')} as e`, 'r.event_id', 'e.id')
      .leftJoin(`${t('users')} as u`, 'r.user_id', 'u.id')
      .leftJoin(`${t('profiles')} as p`, 'r.user_id', 'p.user_id')
      .where('r.checkin_qr_token', token)
      .select(
        'r.*',
        'e.title as event_title',
        'e.start_date as event_start_date',
        'e.checkin_opens_minutes_before',
        'u.email',
        'p.first_name',
        'p.last_name',
        'p.display_name'
      )
      .first();

    if (!registration) throw AppError.notFound('Registration');
    if (registration.status !== 'confirmed') {
      throw AppError.badRequest('Only confirmed registrations can check in');
    }
    if (registration.checked_in) {
      return this.qrCheckinResponse(registration, new Date(registration.checked_in_at), true);
    }
    if (registration.checkin_qr_expires_at && new Date(registration.checkin_qr_expires_at) < new Date()) {
      throw AppError.badRequest('Check-in QR code has expired');
    }

    const now = new Date();
    const eventStart = new Date(registration.event_start_date);
    const openMinutes = Number(registration.checkin_opens_minutes_before || 60);
    const checkInOpens = new Date(eventStart.getTime() - openMinutes * 60 * 1000);
    if (now < checkInOpens) {
      throw AppError.badRequest('Check-in is not yet available');
    }

    await db.transaction(async (trx) => {
      await trx(t('registrations')).where('id', registration.id).update({
        checked_in: true,
        checked_in_at: now,
        updated_at: now,
      });
      await this.upsertCheckin(trx, registration.id, adminUserId, now, 'qr_code');
    });

    return this.qrCheckinResponse(registration, now, false);
  }

  static async getUserRegistrations(userId: number, status?: string) {
    let query = db(t('registrations'))
      .where(`${t('registrations')}.user_id`, userId)
      .leftJoin(t('events'), `${t('registrations')}.event_id`, `${t('events')}.id`)
      .leftJoin(t('venues'), `${t('events')}.venue_id`, `${t('venues')}.id`)
      .select(
        `${t('registrations')}.*`,
        `${t('events')}.title as event_title`,
        `${t('events')}.start_date as event_date`,
        `${t('events')}.start_date as event_start_date`,
        `${t('events')}.end_date as event_end_date`,
        `${t('events')}.status as event_status`,
        `${t('events')}.entry_fee_cents as event_entry_fee_cents`,
        `${t('events')}.currency as event_currency`,
        `${t('events')}.banner_image_url as event_banner`,
        `${t('venues')}.name as venue_name`,
        `${t('venues')}.address_city as venue_city`,
        db.raw(`CONCAT(COALESCE(??, ''), CASE WHEN ?? IS NULL OR ?? = '' THEN '' ELSE ', ' END, COALESCE(??, '')) as event_location`, [
          `${t('venues')}.name`,
          `${t('venues')}.address_city`,
          `${t('venues')}.address_city`,
          `${t('venues')}.address_city`,
        ]),
        db.raw('(?? - ??) as net_fee_cents', [
          `${t('events')}.entry_fee_cents`,
          `${t('registrations')}.discount_applied_cents`,
        ])
      )
      .orderBy(`${t('events')}.start_date`, 'desc');

    if (status) {
      query = query.where(`${t('registrations')}.status`, status);
    }

    return query;
  }

  private static async upsertCheckin(
    trx: any,
    registrationId: number,
    checkedInBy: number,
    checkedInAt: Date,
    method: 'self' | 'manual' | 'qr_code'
  ) {
    await trx(t('checkins'))
      .insert({
        registration_id: registrationId,
        checked_in_by: checkedInBy,
        checked_in_at: checkedInAt,
        method,
        created_at: checkedInAt,
      })
      .onConflict('registration_id')
      .merge({
        checked_in_by: checkedInBy,
        checked_in_at: checkedInAt,
        method,
      });
  }

  private static qrCheckinResponse(registration: any, checkedInAt: Date, alreadyCheckedIn: boolean) {
    const displayName =
      registration.display_name ||
      [registration.first_name, registration.last_name].filter(Boolean).join(' ') ||
      registration.email ||
      `User #${registration.user_id}`;
    return {
      checked_in: true,
      already_checked_in: alreadyCheckedIn,
      checked_in_at: checkedInAt,
      registration_id: registration.id,
      event_id: registration.event_id,
      event_title: registration.event_title,
      user_id: registration.user_id,
      display_name: displayName,
      registration_type: registration.registration_type,
    };
  }

  private static async getProfileWithPlaytomicSubmission(
    trx: any,
    userId: number,
    input: CreateRegistrationInput
  ) {
    const profile = await trx(t('profiles')).where('user_id', userId).first();
    const hasSubmittedLevel = input.playtomic_level !== undefined;
    const hasSubmittedScreenshot = Boolean(input.playtomic_screenshot_url);

    if (!profile || (!hasSubmittedLevel && !hasSubmittedScreenshot)) {
      return profile;
    }
    if (profile.playtomic_verification_status === 'approved') {
      return profile;
    }

    const updates: Record<string, any> = {
      playtomic_verification_status: 'pending',
      updated_at: new Date(),
    };

    if (hasSubmittedLevel) {
      updates.playtomic_level = input.playtomic_level;
      updates.initial_rating_source = 'playtomic_self';
    }
    if (hasSubmittedScreenshot) {
      updates.playtomic_screenshot_url = input.playtomic_screenshot_url;
    }

    await trx(t('profiles')).where('user_id', userId).update(updates);
    return trx(t('profiles')).where('user_id', userId).first();
  }

  private static evaluatePlaytomicEligibility(event: any, profile: any) {
    const requiresVerification = Boolean(event.requires_playtomic_verification);
    const level =
      profile?.playtomic_level === null || profile?.playtomic_level === undefined
        ? null
        : Number(profile.playtomic_level);
    const playtomicStatus = profile?.playtomic_verification_status || 'none';

    if (!requiresVerification) {
      return {
        requiresVerification,
        isEligible: true,
        level,
        playtomicStatus,
        note: null as string | null,
      };
    }

    const min = event.min_playtomic_level == null ? null : Number(event.min_playtomic_level);
    const max = event.max_playtomic_level == null ? null : Number(event.max_playtomic_level);
    const hasScreenshot = Boolean(profile?.playtomic_screenshot_url);
    const hasLevel = level !== null && Number.isFinite(level);
    const statusApproved = playtomicStatus === 'approved';
    const withinMin = min === null || (hasLevel && level >= min);
    const withinMax = max === null || (hasLevel && level <= max);
    const isEligible = statusApproved && hasLevel && withinMin && withinMax;

    let note: string | null = null;
    if (!hasScreenshot) {
      note = 'Playtomic-Screenshot fehlt';
    } else if (!hasLevel) {
      note = 'Playtomic-Level fehlt';
    } else if (!withinMin || !withinMax) {
      note = `Playtomic-Level ${level.toFixed(1)} liegt außerhalb des Turnierbereichs ${(min ?? 0).toFixed(1)}-${(max ?? 7).toFixed(1)}`;
    } else if (!statusApproved) {
      note = `Playtomic-Verifizierung ist ${playtomicStatus}`;
    }

    return { requiresVerification, isEligible, level, playtomicStatus, note };
  }
}
