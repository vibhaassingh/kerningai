import "server-only";

import { Ratelimit } from "@upstash/ratelimit";
import { Redis } from "@upstash/redis";

import { maybeUpstashEnv, RATE_LIMIT_CONFIGURED } from "@/lib/env";

/**
 * Production rate-limit helper. When Upstash isn't configured (local dev,
 * preview without secrets), this returns "always allowed" so dev flows
 * keep working. When Upstash IS configured, it uses a sliding-window
 * limiter against Upstash Redis keyed on `input.key`.
 *
 *   const { allowed, retryAfterSeconds } = await rateLimit({
 *     key: `login:${ip}`,
 *     limit: 5,
 *     windowSeconds: 15 * 60,
 *   });
 *   if (!allowed) return { ok: false, error: "Too many attempts", retryAfterSeconds };
 */
export interface RateLimitResult {
  allowed: boolean;
  remaining: number;
  retryAfterSeconds: number;
}

export interface RateLimitInput {
  key: string;
  limit: number;
  windowSeconds: number;
}

// Lazy singletons — created once per process when first needed.
let _redis: Redis | null = null;
const _limiters = new Map<string, Ratelimit>();

function getRedis(): Redis | null {
  if (_redis) return _redis;
  const env = maybeUpstashEnv();
  if (!env) return null;
  _redis = new Redis({
    url: env.UPSTASH_REDIS_REST_URL,
    token: env.UPSTASH_REDIS_REST_TOKEN,
  });
  return _redis;
}

function getLimiter(limit: number, windowSeconds: number): Ratelimit | null {
  const redis = getRedis();
  if (!redis) return null;

  // Cache one limiter per (limit, windowSeconds) pair — Ratelimit instances
  // are stateless, but creating one per call adds GC pressure.
  const cacheKey = `${limit}:${windowSeconds}`;
  let limiter = _limiters.get(cacheKey);
  if (!limiter) {
    limiter = new Ratelimit({
      redis,
      limiter: Ratelimit.slidingWindow(limit, `${windowSeconds} s`),
      analytics: true,
      prefix: "kerning:ratelimit",
    });
    _limiters.set(cacheKey, limiter);
  }
  return limiter;
}

export async function rateLimit(input: RateLimitInput): Promise<RateLimitResult> {
  if (!RATE_LIMIT_CONFIGURED) {
    return { allowed: true, remaining: Number.MAX_SAFE_INTEGER, retryAfterSeconds: 0 };
  }

  const limiter = getLimiter(input.limit, input.windowSeconds);
  if (!limiter) {
    return { allowed: true, remaining: Number.MAX_SAFE_INTEGER, retryAfterSeconds: 0 };
  }

  const result = await limiter.limit(input.key);

  return {
    allowed: result.success,
    remaining: result.remaining,
    retryAfterSeconds: result.success
      ? 0
      : Math.max(1, Math.ceil((result.reset - Date.now()) / 1000)),
  };
}
