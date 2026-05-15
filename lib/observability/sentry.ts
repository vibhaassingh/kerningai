import "server-only";

import { SENTRY_CONFIGURED } from "@/lib/env";

/**
 * Observability surface — thin wrapper that forwards to `@sentry/nextjs`
 * when `SENTRY_DSN` is set, falls back to structured `console.error`
 * otherwise. Either way, the call sites in the app don't change.
 *
 * The Sentry SDK is loaded via dynamic import so that environments
 * without `SENTRY_DSN` don't pay the bundle/load cost.
 *
 * Sentry init itself happens in `sentry.server.config.ts` /
 * `sentry.edge.config.ts`, gated by `SENTRY_DSN` from
 * `instrumentation.ts`.
 */

export interface SentryContext {
  tags?: Record<string, string>;
  user?: { id?: string; email?: string };
  extra?: Record<string, unknown>;
}

function format(level: "error" | "warning" | "info", message: string, ctx?: SentryContext) {
  return JSON.stringify({
    level,
    surface: "sentry",
    message,
    tags: ctx?.tags,
    // Strip email by default — keeps PII out of structured logs.
    user: ctx?.user ? { id: ctx.user.id } : undefined,
    extra: ctx?.extra,
    sentry_configured: SENTRY_CONFIGURED,
    ts: new Date().toISOString(),
  });
}

async function forwardToSentry(
  fn: (sdk: typeof import("@sentry/nextjs")) => void,
): Promise<void> {
  if (!SENTRY_CONFIGURED) return;
  try {
    const Sentry = await import("@sentry/nextjs");
    fn(Sentry);
  } catch (err) {
    // Forwarding to Sentry must never break the underlying operation.
    console.error("[sentry-forward] failed", err);
  }
}

export function captureException(err: unknown, ctx?: SentryContext): void {
  const message = err instanceof Error ? err.message : String(err);
  const stack = err instanceof Error ? err.stack : undefined;

  // Always log structured to console (Vercel runtime logs are grep-able).
  console.error(
    format("error", message, {
      ...ctx,
      extra: { ...(ctx?.extra ?? {}), stack },
    }),
  );

  // Forward to Sentry if DSN is set. Fire-and-forget — don't block.
  void forwardToSentry((Sentry) => {
    Sentry.captureException(err, {
      tags: ctx?.tags,
      user: ctx?.user,
      extra: ctx?.extra,
    });
  });
}

export function captureMessage(message: string, ctx?: SentryContext): void {
  console.warn(format("warning", message, ctx));
  void forwardToSentry((Sentry) => {
    Sentry.captureMessage(message, {
      tags: ctx?.tags,
      user: ctx?.user,
      extra: ctx?.extra,
    });
  });
}

/**
 * Wrap an async function so any thrown error is captured + re-thrown.
 * Used at the outer edge of cron handlers and webhook receivers.
 */
export function withSentry<T>(name: string, fn: () => Promise<T>): Promise<T> {
  return fn().catch((err) => {
    captureException(err, { tags: { surface: name } });
    throw err;
  });
}
