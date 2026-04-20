/**
 * crashReport — thin abstraction for error tracking.
 *
 * Attempts to lazy-use @sentry/react-native if it is installed. If the
 * package is not present (the default in the current build), it falls back
 * to console logging. This lets us ship the surfaces that report errors
 * (ErrorBoundary, API interceptor, etc.) without requiring a native rebuild
 * today.
 *
 * When Sentry is wired up, set EXPO_PUBLIC_SENTRY_DSN in app config and
 * install `@sentry/react-native`; this module will pick it up automatically.
 */
import Constants from 'expo-constants';

type Primitive = string | number | boolean | null | undefined;

interface ReportContext {
  tags?: Record<string, Primitive>;
  extra?: Record<string, unknown>;
  user?: { id?: number; email?: string };
}

let sentry: any | null = null;
let initialized = false;

function tryLoadSentry(): any | null {
  if (sentry !== null) return sentry;
  try {
    // Indirect require so Metro can resolve it when present; stays optional.
    // eslint-disable-next-line @typescript-eslint/no-var-requires
    sentry = require('@sentry/react-native');
    return sentry;
  } catch {
    sentry = false as any;
    return null;
  }
}

export function initCrashReporting(): void {
  if (initialized) return;
  initialized = true;

  const dsn =
    process.env.EXPO_PUBLIC_SENTRY_DSN ||
    (Constants.expoConfig?.extra as any)?.sentryDsn;
  if (!dsn) return;

  const s = tryLoadSentry();
  if (!s?.init) return;

  try {
    s.init({
      dsn,
      debug: __DEV__,
      tracesSampleRate: __DEV__ ? 1.0 : 0.2,
      enableAutoSessionTracking: true,
      environment: __DEV__ ? 'development' : 'production',
    });
  } catch (err) {
    console.warn('[crashReport] Sentry init failed:', err);
  }
}

export function captureError(error: unknown, ctx: ReportContext = {}): void {
  const s = tryLoadSentry();
  if (s?.captureException) {
    try {
      if (ctx.user?.id) s.setUser({ id: String(ctx.user.id), email: ctx.user.email });
      if (ctx.tags) {
        for (const [k, v] of Object.entries(ctx.tags)) s.setTag(k, String(v ?? ''));
      }
      if (ctx.extra) {
        for (const [k, v] of Object.entries(ctx.extra)) s.setExtra(k, v);
      }
      s.captureException(error);
      return;
    } catch {
      // fall through to console
    }
  }
  console.error('[crashReport]', error, ctx);
}

export function captureMessage(msg: string, ctx: ReportContext = {}): void {
  const s = tryLoadSentry();
  if (s?.captureMessage) {
    try {
      s.captureMessage(msg, { level: 'info', extra: ctx.extra, tags: ctx.tags });
      return;
    } catch {
      // fall through
    }
  }
  console.log('[crashReport]', msg, ctx);
}

export function setCrashUser(user: { id: number; email?: string } | null): void {
  const s = tryLoadSentry();
  if (!s?.setUser) return;
  try {
    if (user) s.setUser({ id: String(user.id), email: user.email });
    else s.setUser(null);
  } catch {
    // no-op
  }
}
