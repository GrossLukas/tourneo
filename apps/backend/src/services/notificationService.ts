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
   * Send a single notification to a user. Always inserts the row so that
   * the in-app notification list works even when push delivery fails.
   */
  static async send(
    userId: number,
    type: NotificationType,
    title: string,
    body: string,
    data?: Record<string, any>
  ): Promise<void> {
    const now = new Date();

    // 1) Persist the notification
    const [notificationId] = await db(t('notifications')).insert({
      user_id: userId,
      type,
      title,
      body,
      data: data ? JSON.stringify(data) : null,
      is_read: false,
      created_at: now,
    });

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
        notification_id: String(notificationId),
        type,
      };
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

      // Deactivate dead tokens
      response.responses.forEach((resp, idx) => {
        if (!resp.success) {
          const code = resp.error?.code || '';
          if (
            code === 'messaging/registration-token-not-registered' ||
            code === 'messaging/invalid-registration-token'
          ) {
            db(t('push_tokens'))
              .where('token', tokens[idx])
              .update({ is_active: false, updated_at: new Date() })
              .catch(() => {});
          }
        }
      });

      await db(t('notifications')).where('id', notificationId).update({
        is_push_sent: true,
        push_sent_at: new Date(),
      });
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
   */
  static async notifyEventPublished(eventId: number): Promise<void> {
    const event = await db(t('events')).where('id', eventId).first();
    if (!event) return;

    // Notify all active users (could be filtered by city / preferences in the future)
    const users = await db(t('users'))
      .where('status', 'active')
      .select('id');

    const title = 'Neues Turnier verfügbar';
    const body = `"${event.title}" ist jetzt zur Anmeldung freigegeben.`;

    for (const user of users) {
      await this.send(user.id, 'event_published', title, body, {
        event_id: eventId,
      });
    }
  }
}
