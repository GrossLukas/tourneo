/**
 * Redis client – lazily initialised, completely optional.
 *
 * If REDIS_URL is missing the export is `null` and call sites are expected
 * to fall back to local in-memory state. This keeps local development
 * frictionless while production multi-instance deployments get distributed
 * rate limiting / brute force protection.
 */
import Redis from 'ioredis';

let client: Redis | null = null;

if (process.env.REDIS_URL) {
  try {
    client = new Redis(process.env.REDIS_URL, {
      maxRetriesPerRequest: 2,
      enableOfflineQueue: false,
      lazyConnect: false,
    });
    client.on('error', (err) => {
      console.error('[redis] connection error:', err.message);
    });
    client.on('connect', () => {
      console.log('[redis] connected');
    });
  } catch (err) {
    console.error('[redis] init failed, falling back to in-memory:', err);
    client = null;
  }
}

export const redis = client;
