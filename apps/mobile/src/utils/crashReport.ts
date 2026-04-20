/**
 * crashReport — local error tracking without external services.
 *
 * Logs errors to console and stores the last 50 in AsyncStorage so they
 * survive restarts. No DSN, no Sentry, no paid dependency.
 */
import AsyncStorage from '@react-native-async-storage/async-storage';

const STORAGE_KEY = 'tourneo_crash_log';
const MAX_ENTRIES = 50;

interface CrashEntry {
  ts: string;
  message: string;
  stack?: string;
  tags?: Record<string, string>;
  extra?: Record<string, unknown>;
  userId?: number;
}

let currentUserId: number | null = null;

export function initCrashReporting(): void {
  // no-op — everything is lazy
}

export function setCrashUser(user: { id: number; email?: string } | null): void {
  currentUserId = user?.id ?? null;
}

export function captureError(error: unknown, ctx: { tags?: Record<string, unknown>; extra?: Record<string, unknown>; user?: { id?: number } } = {}): void {
  const entry = buildEntry(error, ctx);
  console.error('[crash]', entry.message, ctx);
  persistEntry(entry);
}

export function captureMessage(msg: string, ctx: { tags?: Record<string, unknown>; extra?: Record<string, unknown> } = {}): void {
  const entry: CrashEntry = {
    ts: new Date().toISOString(),
    message: msg,
    tags: stringifyTags(ctx.tags),
    extra: ctx.extra,
    userId: currentUserId ?? undefined,
  };
  console.log('[crash]', msg, ctx);
  persistEntry(entry);
}

export async function getCrashLog(): Promise<CrashEntry[]> {
  try {
    const raw = await AsyncStorage.getItem(STORAGE_KEY);
    return raw ? JSON.parse(raw) : [];
  } catch {
    return [];
  }
}

export async function clearCrashLog(): Promise<void> {
  await AsyncStorage.removeItem(STORAGE_KEY);
}

function buildEntry(error: unknown, ctx: { tags?: Record<string, unknown>; extra?: Record<string, unknown>; user?: { id?: number } }): CrashEntry {
  const err = error instanceof Error ? error : new Error(String(error));
  return {
    ts: new Date().toISOString(),
    message: err.message,
    stack: err.stack?.split('\n').slice(0, 5).join('\n'),
    tags: stringifyTags(ctx.tags),
    extra: ctx.extra,
    userId: ctx.user?.id ?? currentUserId ?? undefined,
  };
}

function stringifyTags(tags?: Record<string, unknown>): Record<string, string> | undefined {
  if (!tags) return undefined;
  const out: Record<string, string> = {};
  for (const [k, v] of Object.entries(tags)) out[k] = String(v ?? '');
  return out;
}

async function persistEntry(entry: CrashEntry): Promise<void> {
  try {
    const existing = await getCrashLog();
    existing.push(entry);
    if (existing.length > MAX_ENTRIES) existing.splice(0, existing.length - MAX_ENTRIES);
    await AsyncStorage.setItem(STORAGE_KEY, JSON.stringify(existing));
  } catch {
    // storage unavailable — already logged to console
  }
}
