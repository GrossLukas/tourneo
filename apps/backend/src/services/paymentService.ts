import { v4 as uuidv4 } from 'uuid';
import Stripe from 'stripe';
import { db, t } from '../config/database';
import { env } from '../config/environment';
import { AppError } from '../middleware/errorHandler';

const stripe = env.stripe.secretKey
  ? new Stripe(env.stripe.secretKey, { apiVersion: '2023-10-16' as any })
  : null;

export class PaymentService {
  static async createPaymentIntent(registrationId: number, userId: number) {
    if (!stripe) throw AppError.internal('Payment system not configured');

    const registration = await db(t('registrations'))
      .where('id', registrationId)
      .where('user_id', userId)
      .first();

    if (!registration) throw AppError.notFound('Registration');
    if (registration.status !== 'pending_payment') {
      throw AppError.badRequest('Registration is not awaiting payment');
    }

    const event = await db(t('events')).where('id', registration.event_id).first();
    if (!event) throw AppError.notFound('Event');

    // Calculate net amount
    const netAmount = event.entry_fee_cents - registration.discount_applied_cents;

    if (netAmount <= 0) {
      // Free event or fully discounted — confirm directly
      await this.confirmFreeRegistration(registrationId, userId);
      return { free: true, registration_id: registrationId };
    }

    // Create Stripe PaymentIntent
    const paymentIntent = await stripe.paymentIntents.create({
      amount: netAmount,
      currency: event.currency.toLowerCase(),
      metadata: {
        registration_id: registrationId.toString(),
        event_id: event.id.toString(),
        user_id: userId.toString(),
        event_title: event.title,
      },
      description: `Tourneo: ${event.title}`,
      statement_descriptor_suffix: 'TOURNEO',
    });

    // Create payment record
    const paymentUuid = uuidv4();
    const now = new Date();

    await db(t('payments')).insert({
      uuid: paymentUuid,
      user_id: userId,
      registration_id: registrationId,
      payment_type: 'tournament_fee',
      amount_cents: event.entry_fee_cents,
      discount_cents: registration.discount_applied_cents,
      net_amount_cents: netAmount,
      currency: event.currency,
      payment_method: 'card',
      stripe_payment_intent_id: paymentIntent.id,
      status: 'pending',
      created_at: now,
      updated_at: now,
    });

    return {
      client_secret: paymentIntent.client_secret,
      payment_intent_id: paymentIntent.id,
      amount_cents: netAmount,
      currency: event.currency,
      registration_id: registrationId,
    };
  }

  static async handleStripeWebhook(event: Stripe.Event) {
    switch (event.type) {
      case 'payment_intent.succeeded':
        await this.handlePaymentSuccess(event.data.object as Stripe.PaymentIntent);
        break;
      case 'payment_intent.payment_failed':
        await this.handlePaymentFailure(event.data.object as Stripe.PaymentIntent);
        break;
      case 'charge.refunded':
        await this.handleChargeRefunded(event.data.object as Stripe.Charge);
        break;
      default:
        console.log(`Unhandled Stripe event: ${event.type}`);
    }
  }

  private static async handlePaymentSuccess(paymentIntent: Stripe.PaymentIntent) {
    const now = new Date();

    const payment = await db(t('payments'))
      .where('stripe_payment_intent_id', paymentIntent.id)
      .first();

    if (!payment) {
      console.error(`Payment not found for PaymentIntent: ${paymentIntent.id}`);
      return;
    }

    // Idempotency check
    if (payment.status === 'succeeded') return;

    let pushTitle: string | null = null;
    let pushBody: string | null = null;
    let pushData: Record<string, any> | null = null;
    let recipientUserId = payment.user_id;
    let recipientEmail: string | null = null;
    let recipientFirstName: string | null = null;
    let eventTitleForEmail: string | null = null;
    let eventDateForEmail: string | null = null;

    await db.transaction(async (trx) => {
      // Update payment
      await trx(t('payments')).where('id', payment.id).update({
        status: 'succeeded',
        stripe_charge_id: paymentIntent.latest_charge as string,
        paid_at: now,
        receipt_url: null, // Will be updated when receipt is available
        invoice_number: `INV-${now.getFullYear()}-${String(payment.id).padStart(6, '0')}`,
        updated_at: now,
      });

      // Confirm registration
      if (payment.registration_id) {
        await trx(t('registrations')).where('id', payment.registration_id).update({
          status: 'confirmed',
          updated_at: now,
        });

        // Create in-app notification (push will be pushed via NotificationService below)
        const registration = await trx(t('registrations'))
          .where('id', payment.registration_id)
          .first();
        const eventRow = await trx(t('events'))
          .where('id', registration.event_id)
          .first();

        await trx(t('notifications')).insert({
          user_id: payment.user_id,
          type: 'registration_confirmed',
          title: 'Anmeldung bestätigt',
          body: `Deine Anmeldung für "${eventRow?.title}" wurde bestätigt.`,
          data: JSON.stringify({
            event_id: registration.event_id,
            registration_id: payment.registration_id,
          }),
          created_at: now,
          is_push_sent: false,
        });

        pushTitle = 'Anmeldung bestätigt';
        pushBody = `Deine Anmeldung für "${eventRow?.title}" wurde bestätigt.`;
        pushData = {
          event_id: registration.event_id,
          registration_id: payment.registration_id,
        };
        recipientUserId = payment.user_id;

        if (eventRow) {
          eventTitleForEmail = eventRow.title;
          eventDateForEmail = eventRow.start_date
            ? new Date(eventRow.start_date).toLocaleDateString('de-DE')
            : '';
        }

        const userRow = await trx(t('users')).where('id', payment.user_id).first();
        const profileRow = await trx(t('profiles'))
          .where('user_id', payment.user_id)
          .first();
        if (userRow) recipientEmail = userRow.email;
        if (profileRow) recipientFirstName = profileRow.first_name;
      }

      // Audit log
      await trx(t('audit_log')).insert({
        user_id: payment.user_id,
        action: 'payment.succeeded',
        entity_type: 'payment',
        entity_id: payment.id,
        new_values: JSON.stringify({
          amount: payment.net_amount_cents,
          stripe_pi: paymentIntent.id,
        }),
        created_at: now,
      });
    });

    // Push notification (best-effort, outside the transaction)
    if (pushTitle && pushBody) {
      try {
        const { NotificationService } = await import('./notificationService');
        // Skip the DB insert (already done) – call sendPushOnly via send() will create
        // a duplicate row. Instead, send via FCM only by importing the module guarded.
        await NotificationService.send(
          recipientUserId,
          'registration_confirmed',
          pushTitle,
          pushBody,
          pushData || undefined
        );
      } catch (err) {
        console.error('[payment] Push notification failed:', err);
      }
    }

    // Confirmation email (best-effort)
    if (recipientEmail && recipientFirstName && eventTitleForEmail) {
      try {
        const { emailService } = await import('./emailService');
        await emailService.sendRegistrationConfirmation(
          recipientEmail,
          recipientFirstName,
          eventTitleForEmail,
          eventDateForEmail || ''
        );
      } catch (err) {
        console.error('[payment] Confirmation email failed:', err);
      }
    }
  }

  private static async handlePaymentFailure(paymentIntent: Stripe.PaymentIntent) {
    const now = new Date();

    const payment = await db(t('payments'))
      .where('stripe_payment_intent_id', paymentIntent.id)
      .first();

    if (!payment) {
      console.error(`Payment not found for failed PaymentIntent: ${paymentIntent.id}`);
      return;
    }

    // Idempotency check
    if (payment.status === 'failed') return;

    const failureReason =
      paymentIntent.last_payment_error?.message || 'Payment failed';

    await db.transaction(async (trx) => {
      await trx(t('payments')).where('id', payment.id).update({
        status: 'failed',
        failed_at: now,
        failure_reason: failureReason,
        updated_at: now,
      });

      // Cancel registration
      if (payment.registration_id) {
        await trx(t('registrations')).where('id', payment.registration_id).update({
          status: 'cancelled',
          updated_at: now,
        });

        // Notify the user about payment failure
        await trx(t('notifications')).insert({
          user_id: payment.user_id,
          type: 'general',
          title: 'Zahlung fehlgeschlagen',
          body: `Deine Zahlung konnte nicht verarbeitet werden: ${failureReason}`,
          data: JSON.stringify({
            registration_id: payment.registration_id,
            reason: failureReason,
          }),
          created_at: now,
        });
      }

      // Audit log
      await trx(t('audit_log')).insert({
        user_id: payment.user_id,
        action: 'payment.failed',
        entity_type: 'payment',
        entity_id: payment.id,
        new_values: JSON.stringify({
          reason: failureReason,
          stripe_pi: paymentIntent.id,
        }),
        created_at: now,
      });
    });

    // Promote next user from waitlist (free spot opened up)
    if (payment.registration_id) {
      const reg = await db(t('registrations'))
        .where('id', payment.registration_id)
        .first();
      if (reg) {
        const { RegistrationService } = await import('./registrationService');
        await RegistrationService.promoteFromWaitlist(reg.event_id);
      }
    }
  }

  /**
   * Handles charge.refunded webhook from Stripe.
   * Creates refund records, updates payment + registration status,
   * and promotes the next user from the waitlist.
   */
  private static async handleChargeRefunded(charge: Stripe.Charge) {
    const now = new Date();

    // Find the payment via charge_id or payment_intent_id
    const payment = await db(t('payments'))
      .where('stripe_charge_id', charge.id)
      .orWhere('stripe_payment_intent_id', charge.payment_intent as string)
      .first();

    if (!payment) {
      console.error(`Payment not found for refunded Charge: ${charge.id}`);
      return;
    }

    const refundedAmount = charge.amount_refunded;
    const isFullRefund = refundedAmount >= payment.net_amount_cents;

    let promotedEventId: number | null = null;

    await db.transaction(async (trx) => {
      // Idempotency: ensure we have not already recorded this refund
      const existingRefunds = await trx(t('refunds'))
        .where('payment_id', payment.id)
        .sum('amount_cents as total');
      const alreadyRefundedCents = Number(existingRefunds[0]?.total || 0);

      const newRefundCents = refundedAmount - alreadyRefundedCents;
      if (newRefundCents <= 0) {
        // Nothing new to record
        return;
      }

      // Determine stripe refund id (latest refund on the charge)
      const stripeRefundId = charge.refunds?.data?.[0]?.id || null;

      // Insert refund row
      await trx(t('refunds')).insert({
        uuid: uuidv4(),
        payment_id: payment.id,
        user_id: payment.user_id,
        amount_cents: newRefundCents,
        reason: 'admin_decision',
        reason_detail: 'Refunded via Stripe',
        stripe_refund_id: stripeRefundId,
        status: 'processed',
        processed_at: now,
        created_at: now,
        updated_at: now,
      });

      // Update payment status
      await trx(t('payments')).where('id', payment.id).update({
        status: isFullRefund ? 'refunded' : 'partially_refunded',
        updated_at: now,
      });

      // Update registration
      if (payment.registration_id) {
        const reg = await trx(t('registrations'))
          .where('id', payment.registration_id)
          .first();

        if (reg) {
          await trx(t('registrations')).where('id', payment.registration_id).update({
            status: 'refunded',
            updated_at: now,
          });
          promotedEventId = reg.event_id;

          // Notify user
          await trx(t('notifications')).insert({
            user_id: payment.user_id,
            type: 'general',
            title: 'Rückerstattung erhalten',
            body: `Eine Rückerstattung über €${(newRefundCents / 100).toFixed(2)} wurde durchgeführt.`,
            data: JSON.stringify({
              payment_id: payment.id,
              registration_id: payment.registration_id,
              amount_cents: newRefundCents,
            }),
            created_at: now,
          });
        }
      }

      // Audit log
      await trx(t('audit_log')).insert({
        user_id: payment.user_id,
        action: 'payment.refunded',
        entity_type: 'payment',
        entity_id: payment.id,
        new_values: JSON.stringify({
          amount: newRefundCents,
          stripe_charge: charge.id,
          full_refund: isFullRefund,
        }),
        created_at: now,
      });
    });

    // Promote waitlist outside the transaction so it can re-use trx-less helpers
    if (promotedEventId !== null) {
      const { RegistrationService } = await import('./registrationService');
      await RegistrationService.promoteFromWaitlist(promotedEventId);
    }
  }

  private static async confirmFreeRegistration(registrationId: number, userId: number) {
    const now = new Date();

    await db.transaction(async (trx) => {
      await trx(t('registrations')).where('id', registrationId).update({
        status: 'confirmed',
        updated_at: now,
      });

      // Create zero payment record
      await trx(t('payments')).insert({
        uuid: uuidv4(),
        user_id: userId,
        registration_id: registrationId,
        payment_type: 'tournament_fee',
        amount_cents: 0,
        discount_cents: 0,
        net_amount_cents: 0,
        currency: 'EUR',
        payment_method: 'other',
        status: 'succeeded',
        paid_at: now,
        invoice_number: `INV-${now.getFullYear()}-FREE-${String(registrationId).padStart(6, '0')}`,
        created_at: now,
        updated_at: now,
      });
    });
  }

  static async processRefund(refundId: number, adminUserId: number) {
    if (!stripe) throw AppError.internal('Payment system not configured');

    const refund = await db(t('refunds')).where('id', refundId).first();
    if (!refund) throw AppError.notFound('Refund');
    if (refund.status !== 'pending') {
      throw AppError.badRequest('Refund has already been processed');
    }

    const payment = await db(t('payments')).where('id', refund.payment_id).first();
    if (!payment) throw AppError.notFound('Payment');

    const now = new Date();

    try {
      // Process Stripe refund
      const stripeRefund = await stripe.refunds.create({
        payment_intent: payment.stripe_payment_intent_id!,
        amount: refund.amount_cents,
        metadata: {
          refund_id: refundId.toString(),
          user_id: refund.user_id.toString(),
          reason: refund.reason,
        },
      });

      await db.transaction(async (trx) => {
        await trx(t('refunds')).where('id', refundId).update({
          stripe_refund_id: stripeRefund.id,
          status: 'processed',
          processed_at: now,
          processed_by: adminUserId,
        });

        // Update payment status
        const isFullRefund = refund.amount_cents >= payment.net_amount_cents;
        await trx(t('payments')).where('id', payment.id).update({
          status: isFullRefund ? 'refunded' : 'partially_refunded',
          updated_at: now,
        });

        // Update registration
        if (payment.registration_id) {
          await trx(t('registrations')).where('id', payment.registration_id).update({
            status: 'refunded',
            updated_at: now,
          });
        }

        // Notify user
        await trx(t('notifications')).insert({
          user_id: refund.user_id,
          type: 'general',
          title: 'Rückerstattung bearbeitet',
          body: `Deine Rückerstattung über €${(refund.amount_cents / 100).toFixed(2)} wurde bearbeitet.`,
          data: JSON.stringify({ refund_id: refundId }),
          created_at: now,
        });

        // Audit log
        await trx(t('audit_log')).insert({
          user_id: adminUserId,
          action: 'refund.processed',
          entity_type: 'refund',
          entity_id: refundId,
          new_values: JSON.stringify({
            amount: refund.amount_cents,
            stripe_refund: stripeRefund.id,
          }),
          created_at: now,
        });
      });

      return { status: 'processed', stripe_refund_id: stripeRefund.id };
    } catch (error: any) {
      await db(t('refunds')).where('id', refundId).update({
        status: 'failed',
      });
      throw AppError.internal(`Refund processing failed: ${error.message}`);
    }
  }

  static async getUserPayments(userId: number) {
    return db(t('payments'))
      .where(`${t('payments')}.user_id`, userId)
      .leftJoin(t('registrations'), `${t('payments')}.registration_id`, `${t('registrations')}.id`)
      .leftJoin(t('events'), `${t('registrations')}.event_id`, `${t('events')}.id`)
      .select(
        `${t('payments')}.*`,
        `${t('events')}.title as event_title`,
        `${t('events')}.start_date as event_date`
      )
      .orderBy(`${t('payments')}.created_at`, 'desc');
  }

  static async getAdminPaymentStats() {
    const now = new Date();
    const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);

    const [grossRevenue] = await db(t('payments'))
      .where('status', 'succeeded')
      .where('payment_type', 'tournament_fee')
      .sum('net_amount_cents as total');

    const [monthlyRevenue] = await db(t('payments'))
      .where('status', 'succeeded')
      .where('payment_type', 'tournament_fee')
      .where('paid_at', '>=', startOfMonth)
      .sum('net_amount_cents as total');

    const [totalRefunds] = await db(t('refunds'))
      .where('status', 'processed')
      .sum('amount_cents as total');

    const [totalPrizes] = await db(t('prize_payouts'))
      .whereIn('status', ['paid', 'processing'])
      .sum('amount_cents as total');

    const [totalParticipants] = await db(t('registrations'))
      .where('status', 'confirmed')
      .count('* as count');

    const [memberCounts] = await db(t('memberships'))
      .where('status', 'active')
      .select(
        db.raw(`SUM(CASE WHEN tier = 'plus' THEN 1 ELSE 0 END) as plus_count`),
        db.raw(`SUM(CASE WHEN tier = 'club' THEN 1 ELSE 0 END) as club_count`),
        db.raw(`SUM(CASE WHEN tier = 'free' THEN 1 ELSE 0 END) as free_count`),
        db.raw('COUNT(*) as total')
      );

    return {
      gross_revenue_cents: grossRevenue?.total || 0,
      monthly_revenue_cents: monthlyRevenue?.total || 0,
      total_refunds_cents: totalRefunds?.total || 0,
      total_prizes_cents: totalPrizes?.total || 0,
      net_revenue_cents: (grossRevenue?.total || 0) - (totalRefunds?.total || 0),
      total_participants: Number(totalParticipants?.count || 0),
      members: {
        free: Number(memberCounts?.free_count || 0),
        plus: Number(memberCounts?.plus_count || 0),
        club: Number(memberCounts?.club_count || 0),
        total: Number(memberCounts?.total || 0),
      },
    };
  }
}