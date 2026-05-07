import { z } from "zod";

/**
 * Canonical site URL — explicit env wins, then Vercel-injected
 * production alias, then localhost.
 */
function deriveSiteUrl(): string {
  if (process.env.NEXT_PUBLIC_SITE_URL) return process.env.NEXT_PUBLIC_SITE_URL;
  if (process.env.VERCEL_PROJECT_PRODUCTION_URL) {
    return `https://${process.env.VERCEL_PROJECT_PRODUCTION_URL}`;
  }
  return "http://localhost:3000";
}

const envSchema = z.object({
  /** Resend API key — get one free at https://resend.com/api-keys.
   *  Without this, submissions are accepted but only logged. */
  RESEND_API_KEY: z.string().optional(),
  /** Inbox(es) to deliver enquiries to. Comma-separate for multiple,
   *  e.g. "vibhaas@kerning.ooo,hello@kerningai.eu". */
  CONTACT_TO_EMAIL: z.string().optional(),
  /** Optional From address. Defaults to Resend's `onboarding@resend.dev`
   *  so emails go out without DNS setup. */
  RESEND_FROM_EMAIL: z.string().optional(),
  NEXT_PUBLIC_SITE_URL: z.string().url(),
});

export const env = envSchema.parse({
  RESEND_API_KEY: process.env.RESEND_API_KEY,
  CONTACT_TO_EMAIL: process.env.CONTACT_TO_EMAIL,
  RESEND_FROM_EMAIL: process.env.RESEND_FROM_EMAIL,
  NEXT_PUBLIC_SITE_URL: deriveSiteUrl(),
});

export const SITE_URL = env.NEXT_PUBLIC_SITE_URL;

/** Default sender — Resend-managed, no domain verification needed.
 *  Override with RESEND_FROM_EMAIL once kerningai.eu is verified
 *  in Resend (e.g. `Kerning AI <hello@kerningai.eu>`). */
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
