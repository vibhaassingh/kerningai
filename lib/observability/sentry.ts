import "server-only";

/**
 * Sentry stub. Wires a thin recording surface that the rest of the
 * codebase can call without owning a hard dependency on Sentry. Once
 * the user provisions a Sentry account + DSN, swap the implementation
 * to the real SDK without touching call sites.
 */

export interface SentryContext {
  tags?: Record<string, string>;
  user?: { id?: string; email?: string };
  extra?: Record<string, unknown>;
}

export function captureException(err: unknown, ctx?: SentryContext): void {
  // eslint-disable-next-line no-console
  console.error("[sentry-stub]", err, ctx ?? "");
}

export function captureMessage(message: string, ctx?: SentryContext): void {
  // eslint-disable-next-line no-console
  console.warn("[sentry-stub]", message, ctx ?? "");
}

export function withSentry<T>(name: string, fn: () => Promise<T>): Promise<T> {
  return fn().catch((err) => {
    captureException(err, { tags: { surface: name } });
    throw err;
  });
}
