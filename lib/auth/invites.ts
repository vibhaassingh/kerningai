import "server-only";

import { createHash, randomBytes } from "node:crypto";

/**
 * Generates a fresh invite token + its storage hash.
 *
 *  - The raw token is the only thing sent in the email link
 *  - Only the SHA-256 hash lives in the DB, so a leaked DB row can't be
 *    redeemed without the original URL
 *
 * URL-safe base64 (no padding) so the token survives query strings without
 * needing encoding.
 */
export function generateInviteToken(): { token: string; tokenHash: string } {
  const token = randomBytes(32).toString("base64url");
  const tokenHash = hashInviteToken(token);
  return { token, tokenHash };
}

export function hashInviteToken(token: string): string {
  return createHash("sha256").update(token).digest("hex");
}

/** Default invite lifetime — 7 days from issue. */
export function defaultInviteExpiry(): Date {
  return new Date(Date.now() + 7 * 24 * 60 * 60 * 1000);
}
