import "server-only";

import { SENTRY_CONFIGURED } from "@/lib/env";

/**
 * Observability surface — thin wrapper over Sentry that the rest of the
 * codebase calls without owning a hard dependency on the SDK. When
 * `SENTRY_DSN` isn't set, this falls back to structured `console.error`
 * so prod logs (Vercel) still capture the events.
 *
 * To turn this into a real Sentry integration:
 *   1. `pnpm add @sentry/nextjs`
 *   2. `pnpm dlx @sentry/wizard@latest -i nextjs` — generates
 *      sentry.client.config.ts / sentry.server.config.ts /
 *      sentry.edge.config.ts at the repo root
 *   3. Set `SENTRY_DSN` (server) and `NEXT_PUBLIC_SENTRY_DSN` (client) in
 *      Vercel envs
 *   4. Replace the `captureException` body below with
 *      `Sentry.captureException(err, { tags: ctx?.tags, user: ctx?.user, extra: ctx?.extra })`
 *      (lazy-imported via dynamic import so the SDK doesn't bloat the
 *      bundle when SENTRY_DSN is unset).
 *
 * Until the wizard runs, the structured-console fallback gives us a
 * grep-able trail in Vercel runtime logs that's a strict superset of
 * what we had before.
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
    user: ctx?.user
      ? {
          // Don't log email at error level — keeps PII out of prod logs by
          // default. Wizard-managed Sentry handles this server-side via
          // `sendDefaultPii: false`.
          id: ctx.user.id,
        }
      : undefined,
    extra: ctx?.extra,
    sentry_configured: SENTRY_CONFIGURED,
    ts: new Date().toISOString(),
  });
}

export function captureException(err: unknown, ctx?: SentryContext): void {
  const message = err instanceof Error ? err.message : String(err);
  const stack = err instanceof Error ? err.stack : undefined;

  console.error(
    format("error", message, {
      ...ctx,
      extra: { ...(ctx?.extra ?? {}), stack },
    }),
  );
}

export function captureMessage(message: string, ctx?: SentryContext): void {
  console.warn(format("warning", message, ctx));
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
