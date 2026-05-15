/**
 * Next.js instrumentation entry — runs once per process at startup.
 * Used to bootstrap Sentry on the server + edge runtimes.
 *
 * Sentry init is gated on `SENTRY_DSN` being present, so projects
 * without Sentry configured pay zero runtime cost beyond the
 * `import()` resolution.
 *
 * https://nextjs.org/docs/app/building-your-application/optimizing/instrumentation
 */

export async function register() {
  if (!process.env.SENTRY_DSN) return;

  if (process.env.NEXT_RUNTIME === "nodejs") {
    await import("./sentry.server.config");
  }
  if (process.env.NEXT_RUNTIME === "edge") {
    await import("./sentry.edge.config");
  }
}

// Capture unhandled errors in React Server Components and forward to
// `captureException` (which forwards to Sentry when configured).
export const onRequestError = async (
  err: unknown,
  request: Request,
  context: { routerKind: "Pages Router" | "App Router"; routePath: string },
) => {
  if (!process.env.SENTRY_DSN) return;
  const Sentry = await import("@sentry/nextjs");
  Sentry.captureException(err, {
    tags: {
      surface: "request",
      router: context.routerKind,
      route: context.routePath,
    },
    extra: {
      request_url: request.url,
      request_method: request.method,
    },
  });
};
