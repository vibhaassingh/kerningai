/**
 * Sentry edge-runtime initialisation. Loaded by `instrumentation.ts`
 * only when `SENTRY_DSN` is set. Edge runtime has different SDK
 * features available than Node.
 */
import * as Sentry from "@sentry/nextjs";

Sentry.init({
  dsn: process.env.SENTRY_DSN,
  environment: process.env.APP_ENV ?? process.env.VERCEL_ENV ?? "local",
  tracesSampleRate: process.env.APP_ENV === "production" ? 0.1 : 1.0,
  sendDefaultPii: false,
});
