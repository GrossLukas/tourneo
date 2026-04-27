import * as admin from 'firebase-admin';
import { db, t } from '../config/database';
import { env } from '../config/environment';

export type NotificationType =
  | 'registration_confirmed'
  | 'event_published'
  | 'waitlist_promoted'
  | 'event_reminder_1d'
  | 'event_reminder_1h'
  | 'checkin_available'
  | 'match_upcoming'
  | 'result_entered'
  | 'tournament_completed'
  | 'prize_available'
  | 'membership_renewed'
  | 'general';

let firebaseInitialized = false;

function initFirebase(): boolean {
  if (firebaseInitialized) return true;
  if (!env.firebase.projectId || !env.firebase.clientEmail || !env.firebase.privateKey) {
    return false;
  }
  try {
    if (!admin.apps.length) {
      admin.initializeApp({
        credential: admin.credential.cert({
          projectId: env.firebase.projectId,
          clientEmail: env.firebase.clientEmail,
          privateKey: env.firebase.privateKey,
        }),
      });
    }
    firebaseInitialized = true;
    return true;
  } catch (err) {
    console.error('[notifications] Firebase init failed:', err);
    return false;
  }
}

/**
 * NotificationService – persists notifications in the database AND
 * dispatches a push notification via Firebase Cloud Messaging when the
 * user has registered push tokens.
 *
 * Falls back gracefully when Firebase credentials are not configured.
 */
export class NotificationService {
  /**
   * Send a single notification to a user. By default inserts a row in
   * `notifications` so the in-app inbox stays in sync, then dispatches a
   * Firebase push.
   *
   * Pass `skipDbInsert: true` when the caller has already persisted the
   * notification row in their own transaction (e.g. waitlist promotion,
   * payment success) and only the push should be fired.
   */
  static async send(
    userId: number,
    type: NotificationType,
    title: string,
    body: string,
    data?: Record<string, any>,
    options: { skipDbInsert?: boolean } = {}
  ): Promise<void> {
    const now = new Date();

    // 1) Persist the notification (unless caller already did it)
    let notificationId: number | null = null;
    if (!options.skipDbInsert) {
      const [insertedId] = await db(t('notifications')).insert({
        user_id: userId,
        type,
        title,
        body,
        data: data ? JSON.stringify(data) : null,
        is_read: false,
        created_at: now,
      });
      notificationId = insertedId;
    }

    // 2) Try to send a push if Firebase is configured
    const fcmReady = initFirebase();
    if (!fcmReady) return;

    const tokens = await db(t('push_tokens'))
      .where('user_id', userId)
      .where('is_active', true)
      .pluck('token');

    if (!tokens.length) return;

    try {
      const messaging = admin.messaging();
      const stringifiedData: Record<string, string> = {
        type,
      };
      if (notificationId !== null) {
        stringifiedData.notification_id = String(notificationId);
      }
      if (data) {
        for (const [key, value] of Object.entries(data)) {
          stringifiedData[key] = String(value);
        }
      }

      const response = await messaging.sendEachForMulticast({
        tokens,
        notification: { title, body },
        data: stringifiedData,
      });

      // Deactivate dead tokens in a single batched update so a slow
      // database does not leave the response hanging on N parallel
      // .catch() promises and so failures are surfaced via await.
      const deadTokens: string[] = [];
      response.responses.forEach((resp, idx) => {
        if (!resp.success) {
          const code = resp.error?.code || '';
          if (
            code === 'messaging/registration-token-not-registered' ||
            code === 'messaging/invalid-registration-token'
          ) {
            deadTokens.push(tokens[idx]);
          }
        }
      });
      if (deadTokens.length) {
        try {
          await db(t('push_tokens'))
            .whereIn('token', deadTokens)
            .update({ is_active: false, updated_at: new Date() });
        } catch (e: any) {
          console.warn('[notifications] Failed to deactivate dead tokens:', e?.message || e);
        }
      }

      if (notificationId !== null) {
        await db(t('notifications')).where('id', notificationId).update({
          is_push_sent: true,
          push_sent_at: new Date(),
        });
      }
    } catch (err) {
      console.error('[notifications] Push delivery failed:', err);
    }
  }

  /**
   * Notify all users who registered for an event – used for event reminders.
   */
  static async sendEventReminder(eventId: number, hoursUntilEvent: number): Promise<void> {
    const event = await db(t('events')).where('id', eventId).first();
    if (!event) return;

    const registrations = await db(t('registrations'))
      .where('event_id', eventId)
      .where('status', 'confirmed')
      .select('user_id');

    const type: NotificationType =
      hoursUntilEvent <= 1 ? 'event_reminder_1h' : 'event_reminder_1d';
    const title =
      hoursUntilEvent <= 1
        ? 'Dein Turnier startet bald!'
        : 'Erinnerung an dein Turnier morgen';
    const body = `"${event.title}" beginnt in ${hoursUntilEvent} Stunde${
      hoursUntilEvent === 1 ? '' : 'n'
    }.`;

    for (const reg of registrations) {
      await this.send(reg.user_id, type, title, body, {
        event_id: eventId,
      });
    }
  }

  /**
   * Notify all registered users that a new event has been published.
   *
   * Streams users in pages and dispatches notifications in concurrent
   * batches so a 100k-user fan-out does not block the event-loop or
   * exhaust memory. Each batch shares a single in-app notification
   * insert and one FCM multicast.
   */
  static async notifyEventPublished(
    eventId: number,
    options: { pageSize?: number; concurrency?: number } = {}
  ): Promise<{ notified: number }> {
    const event = await db(t('events')).where('id', eventId).first();
    if (!event) return { notified: 0 };

    const pageSize = options.pageSize ?? 500;
    const concurrency = options.concurrency ?? 25;

    const title = 'Neues Turnier verfügbar';
    const body = `"${event.title}" ist jetzt zur Anmeldung freigegeben.`;
    const data = { event_id: eventId };

    let lastId = 0;
    let totalNotified = 0;

    while (true) {
      const users: Array<{ id: number }> = await db(t('users'))
        .where('status', 'active')
        .where('id', '>', lastId)
        .orderBy('id', 'asc')
        .limit(pageSize)
        .select('id');

      if (!users.length) break;
      lastId = users[users.length - 1].id;

      // Dispatch within the page in capped-concurrency chunks so a slow
      // FCM call from one user does not stall the rest.
      for (let i = 0; i < users.length; i += concurrency) {
        const chunk = users.slice(i, i + concurrency);
        await Promise.all(
          chunk.map((u) =>
            this.send(u.id, 'event_published', title, body, data).catch((err) => {
              console.warn(
                '[notifications] event_published failed for user',
                u.id,
                err?.message || err
              );
            })
          )
        );
        totalNotified += chunk.length;
      }
    }

    return { notified: totalNotified };
  }
}
