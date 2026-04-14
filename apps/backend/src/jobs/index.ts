import { sendMatchReminders } from './matchReminder';

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

  console.log('[jobs] background jobs started (matchReminders every 5min)');
}

export function stopJobs(): void {
  for (const i of intervals) clearInterval(i);
  intervals.length = 0;
  started = false;
}
