import { db, t } from '../config/database';
import { NotificationService } from '../services/notificationService';

/**
 * Sends "Du spielst in ~15 Min" pushes for matches scheduled within
 * the next 10–20 minute window. Each match is reminded at most once
 * (tracked via reminder_sent_at column).
 *
 * Designed to be called from a 5-minute interval timer.
 */
export async function sendMatchReminders(now: Date = new Date()): Promise<number> {
  const past = new Date(now.getTime() + 10 * 60 * 1000);
  const soon = new Date(now.getTime() + 20 * 60 * 1000);

  const matches = await db(t('matches'))
    .whereBetween('scheduled_at', [past, soon])
    .where('status', 'upcoming')
    .whereNull('reminder_sent_at');

  if (!matches.length) return 0;

  let sent = 0;

  for (const match of matches) {
    try {
      const event = await db(t('events')).where('id', match.event_id).first();
      const court = match.court_id
        ? await db(t('courts')).where('id', match.court_id).first()
        : null;

      const participantRegIds = [
        match.participant_1_registration_id,
        match.participant_2_registration_id,
      ].filter((id): id is number => typeof id === 'number');
      if (participantRegIds.length !== 2) continue;

      const registrations = await db(t('registrations'))
        .whereIn('id', participantRegIds)
        .select('id', 'user_id', 'partner_user_id');

      // Build name lookup for opponents
      const allUserIds = registrations.flatMap((r: any) =>
        [r.user_id, r.partner_user_id].filter(
          (id: unknown): id is number => typeof id === 'number'
        )
      );
      const profiles = await db(t('profiles'))
        .whereIn('user_id', allUserIds)
        .select('user_id', 'display_name', 'first_name', 'last_name');
      const nameOf = (uid: number) => {
        const p = profiles.find((x: any) => x.user_id === uid);
        return (
          p?.display_name ||
          [p?.first_name, p?.last_name].filter(Boolean).join(' ') ||
          'Spieler'
        );
      };

      for (const reg of registrations) {
        const opponent = registrations.find((r: any) => r.id !== reg.id);
        if (!opponent) continue;
        const opponentName = nameOf(opponent.user_id);
        const courtName = court?.name ? `Court ${court.name}` : 'deinem Court';
        const title = 'Dein Match beginnt gleich!';
        const body = `Du spielst in ~15 Min auf ${courtName} gegen ${opponentName}`;

        for (const uid of [reg.user_id, reg.partner_user_id].filter(
          (id: unknown): id is number => typeof id === 'number'
        )) {
          await NotificationService.send(uid, 'match_upcoming', title, body, {
            match_id: match.id,
            event_id: event?.id ?? null,
          });
        }
      }

      await db(t('matches'))
        .where('id', match.id)
        .update({ reminder_sent_at: now, updated_at: now });
      sent++;
    } catch (err) {
      console.error('[matchReminder] failed for match', match.id, err);
    }
  }

  return sent;
}
