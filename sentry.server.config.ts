/**
 * Sentry server-runtime initialisation. Loaded by `instrumentation.ts`
 * only when `SENTRY_DSN` is set.
 */
import * as Sentry from "@sentry/nextjs";

Sentry.init({
  dsn: process.env.SENTRY_DSN,
  environment: process.env.APP_ENV ?? process.env.VERCEL_ENV ?? "local",
  tracesSampleRate: process.env.APP_ENV === "production" ? 0.1 : 1.0,

  // Don't ship PII to Sentry by default. Server-side `captureException`
  // calls in `lib/observability/sentry.ts` already strip emails before
  // forwarding here.
  sendDefaultPii: false,

  // Filter out the boring stuff.
  ignoreErrors: [
    // Next.js prerender abort signals
    "NEXT_NOT_FOUND",
    "NEXT_REDIRECT",
    // Supabase RLS violations are expected — they're authorization
    // signals, not bugs.
    /^new row violates row-level security policy/,
  ],
});
