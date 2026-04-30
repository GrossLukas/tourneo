import { sendMatchReminders } from './matchReminder';
import { RegistrationService } from '../services/registrationService';

let started = false;
const intervals: NodeJS.Timeout[] = [];

/**
 * Lightweight in-process job runner — no extra dependency, just setInterval.
 * Started once from src/index.ts after the server is listening.
 */
export function startJobs(): void {
  if (started) return;
  started = true;

  // Match reminders every 5 minutes
  const matchTimer = setInterval(() => {
    sendMatchReminders().catch((err) => {
      console.error('[jobs] sendMatchReminders failed:', err);
    });
  }, 5 * 60 * 1000);
  intervals.push(matchTimer);

  const waitlistTimer = setInterval(() => {
    Promise.all([
      RegistrationService.sendWaitlistPaymentReminders(),
      RegistrationService.expireUnpaidPromotions(),
    ])
      .then(([reminders, expirations]) => {
        if (reminders.reminder_count > 0) {
          console.log(`[jobs] sent ${reminders.reminder_count} waitlist payment reminders`);
        }
        if (expirations.expired_count > 0) {
          console.log(`[jobs] expired ${expirations.expired_count} unpaid waitlist promotions`);
        }
      })
      .catch((err) => {
        console.error('[jobs] waitlist maintenance failed:', err);
      });
  }, 15 * 60 * 1000);
  intervals.push(waitlistTimer);

  console.log('[jobs] background jobs started (matchReminders every 5min, waitlist maintenance every 15min)');
}

export function stopJobs(): void {
  for (const i of intervals) clearInterval(i);
  intervals.length = 0;
  started = false;
}
