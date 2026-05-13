import "server-only";

import { RATE_LIMIT_CONFIGURED } from "@/lib/env";

/**
 * Lightweight rate-limit helper. When Upstash isn't configured (Phase 1
 * default), this is a no-op that always permits the request. Phase 2
 * swaps the implementation for `@upstash/ratelimit` over Redis without
 * changing the call site.
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

export async function rateLimit(input: RateLimitInput): Promise<RateLimitResult> {
  if (!RATE_LIMIT_CONFIGURED) {
    return { allowed: true, remaining: Number.MAX_SAFE_INTEGER, retryAfterSeconds: 0 };
  }
  // Phase 2: swap in real Upstash/Redis backend keyed on `input.key`.
  void input;
  return { allowed: true, remaining: Number.MAX_SAFE_INTEGER, retryAfterSeconds: 0 };
}
