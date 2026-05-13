import "server-only";
import { z } from "zod";

/**
 * Canonical site URL — explicit env wins, then Vercel-injected production
 * alias, then localhost.
 */
function deriveSiteUrl(): string {
  if (process.env.NEXT_PUBLIC_SITE_URL) return process.env.NEXT_PUBLIC_SITE_URL;
  if (process.env.VERCEL_PROJECT_PRODUCTION_URL) {
    return `https://${process.env.VERCEL_PROJECT_PRODUCTION_URL}`;
  }
  return "http://localhost:3000";
}

/**
 * Always-loaded env. These are checked at module load and fail fast if
 * missing — they must exist for the marketing site to even render.
 */
const baseSchema = z.object({
  NEXT_PUBLIC_SITE_URL: z.string().url(),
  APP_ENV: z.enum(["local", "staging", "production"]).default("local"),
  ALLOWED_REDIRECT_HOSTS: z.string().optional(),
  RESEND_API_KEY: z.string().optional(),
  RESEND_FROM_EMAIL: z.string().optional(),
  CONTACT_TO_EMAIL: z.string().optional(),
  CRON_SECRET: z.string().optional(),
  NEXT_PUBLIC_GSC_TOKEN: z.string().optional(),
  NEXT_PUBLIC_BING_TOKEN: z.string().optional(),
});

export const env = baseSchema.parse({
  NEXT_PUBLIC_SITE_URL: deriveSiteUrl(),
  APP_ENV: process.env.APP_ENV,
  ALLOWED_REDIRECT_HOSTS: process.env.ALLOWED_REDIRECT_HOSTS,
  RESEND_API_KEY: process.env.RESEND_API_KEY,
  RESEND_FROM_EMAIL: process.env.RESEND_FROM_EMAIL,
  CONTACT_TO_EMAIL: process.env.CONTACT_TO_EMAIL,
  CRON_SECRET: process.env.CRON_SECRET,
  NEXT_PUBLIC_GSC_TOKEN: process.env.NEXT_PUBLIC_GSC_TOKEN,
  NEXT_PUBLIC_BING_TOKEN: process.env.NEXT_PUBLIC_BING_TOKEN,
});

export const SITE_URL = env.NEXT_PUBLIC_SITE_URL;
export const APP_ENV = env.APP_ENV;

/**
 * Default sender — Resend-managed, no DNS setup required. Override with
 * `RESEND_FROM_EMAIL` once `kerningai.eu` is verified in Resend (e.g.
 * `Kerning AI <hello@kerningai.eu>`).
 */
export const FROM_EMAIL =
  env.RESEND_FROM_EMAIL ?? "Kerning AI <onboarding@resend.dev>";

/** Recipient list — accepts a single address or comma-separated. */
export const CONTACT_RECIPIENTS: string[] = (env.CONTACT_TO_EMAIL ?? "")
  .split(",")
  .map((s) => s.trim())
  .filter(Boolean);

/** True when the email backend is fully wired. */
export const EMAIL_CONFIGURED =
  Boolean(env.RESEND_API_KEY) && CONTACT_RECIPIENTS.length > 0;

/**
 * Hosts the auth flow is allowed to redirect back to after sign-in or
 * sign-up. Always includes the current site URL; extras come from the
 * `ALLOWED_REDIRECT_HOSTS` env (comma-separated).
 */
export const ALLOWED_REDIRECT_HOSTS: string[] = (() => {
  const hosts = new Set<string>();
  try {
    hosts.add(new URL(SITE_URL).host);
  } catch {
    // SITE_URL is validated by zod; this catch is defensive only.
  }
  for (const raw of (env.ALLOWED_REDIRECT_HOSTS ?? "").split(",")) {
    const trimmed = raw.trim();
    if (trimmed) hosts.add(trimmed);
  }
  return [...hosts];
})();

// ===========================================================================
// Supabase / OAuth — lazy, only validated when actually accessed.
// ---------------------------------------------------------------------------
// The marketing site doesn't need Supabase. Auth + portal routes do. By
// reading these lazily, the existing site keeps building/running even
// before the Supabase project is provisioned.
// ===========================================================================

const supabaseSchema = z.object({
  NEXT_PUBLIC_SUPABASE_URL: z.string().url(),
  NEXT_PUBLIC_SUPABASE_ANON_KEY: z.string().min(1),
  SUPABASE_SERVICE_ROLE_KEY: z.string().min(1),
  SUPABASE_JWT_SECRET: z.string().optional(),
});

const googleSchema = z.object({
  GOOGLE_CLIENT_ID: z.string().min(1),
  GOOGLE_CLIENT_SECRET: z.string().min(1),
});

const upstashSchema = z.object({
  UPSTASH_REDIS_REST_URL: z.string().url(),
  UPSTASH_REDIS_REST_TOKEN: z.string().min(1),
});

/**
 * Reads + validates Supabase env. Throws a typed error with guidance if
 * any required variable is missing. Call only from server-side code that
 * actually needs Supabase.
 */
export function requireSupabaseEnv() {
  const parsed = supabaseSchema.safeParse({
    NEXT_PUBLIC_SUPABASE_URL: process.env.NEXT_PUBLIC_SUPABASE_URL,
    NEXT_PUBLIC_SUPABASE_ANON_KEY: process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY,
    SUPABASE_SERVICE_ROLE_KEY: process.env.SUPABASE_SERVICE_ROLE_KEY,
    SUPABASE_JWT_SECRET: process.env.SUPABASE_JWT_SECRET,
  });
  if (!parsed.success) {
    throw new Error(
      `Supabase env not configured. Missing/invalid: ${parsed.error.issues
        .map((i) => i.path.join("."))
        .join(", ")}. See .env.example.`,
    );
  }
  return parsed.data;
}

/**
 * Same as requireSupabaseEnv() but returns null instead of throwing. Use
 * in code paths that can gracefully no-op when Supabase isn't configured
 * (e.g. middleware deciding whether to gate portal routes).
 */
export function maybeSupabaseEnv() {
  const parsed = supabaseSchema.safeParse({
    NEXT_PUBLIC_SUPABASE_URL: process.env.NEXT_PUBLIC_SUPABASE_URL,
    NEXT_PUBLIC_SUPABASE_ANON_KEY: process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY,
    SUPABASE_SERVICE_ROLE_KEY: process.env.SUPABASE_SERVICE_ROLE_KEY,
    SUPABASE_JWT_SECRET: process.env.SUPABASE_JWT_SECRET,
  });
  return parsed.success ? parsed.data : null;
}

/** True when Supabase env is fully wired. */
export const SUPABASE_CONFIGURED = (() => {
  return supabaseSchema.safeParse({
    NEXT_PUBLIC_SUPABASE_URL: process.env.NEXT_PUBLIC_SUPABASE_URL,
    NEXT_PUBLIC_SUPABASE_ANON_KEY: process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY,
    SUPABASE_SERVICE_ROLE_KEY: process.env.SUPABASE_SERVICE_ROLE_KEY,
  }).success;
})();

/** Google OAuth env — optional; throws if accessed without config. */
export function requireGoogleEnv() {
  const parsed = googleSchema.safeParse({
    GOOGLE_CLIENT_ID: process.env.GOOGLE_CLIENT_ID,
    GOOGLE_CLIENT_SECRET: process.env.GOOGLE_CLIENT_SECRET,
  });
  if (!parsed.success) {
    throw new Error(
      "Google OAuth not configured. Set GOOGLE_CLIENT_ID and GOOGLE_CLIENT_SECRET.",
    );
  }
  return parsed.data;
}

export const GOOGLE_OAUTH_CONFIGURED = googleSchema.safeParse({
  GOOGLE_CLIENT_ID: process.env.GOOGLE_CLIENT_ID,
  GOOGLE_CLIENT_SECRET: process.env.GOOGLE_CLIENT_SECRET,
}).success;

/** Upstash rate-limit env — optional; gates rate-limit middleware. */
export function maybeUpstashEnv() {
  const parsed = upstashSchema.safeParse({
    UPSTASH_REDIS_REST_URL: process.env.UPSTASH_REDIS_REST_URL,
    UPSTASH_REDIS_REST_TOKEN: process.env.UPSTASH_REDIS_REST_TOKEN,
  });
  return parsed.success ? parsed.data : null;
}

export const RATE_LIMIT_CONFIGURED = upstashSchema.safeParse({
  UPSTASH_REDIS_REST_URL: process.env.UPSTASH_REDIS_REST_URL,
  UPSTASH_REDIS_REST_TOKEN: process.env.UPSTASH_REDIS_REST_TOKEN,
}).success;
