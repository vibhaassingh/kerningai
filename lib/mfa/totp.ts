import "server-only";

import { createHash, randomBytes } from "node:crypto";

import { authenticator } from "@otplib/preset-default";

/**
 * TOTP helpers wrapping `otplib`. Default RFC 6238 settings: 30-second
 * window, 6-digit code, SHA-1 (compatible with Google Authenticator,
 * 1Password, Authy, etc.).
 *
 * Backup codes are 10-character lowercase strings; we store sha-256
 * hex so the DB never holds the raw values.
 */

authenticator.options = {
  step: 30,
  digits: 6,
  window: 1, // accept ±1 step (30s) to handle clock skew
};

export function generateSecret(): string {
  return authenticator.generateSecret();
}

export function buildOtpAuthUrl(opts: {
  secret: string;
  accountEmail: string;
  issuer?: string;
}): string {
  const issuer = opts.issuer ?? "Kerning AI";
  return authenticator.keyuri(opts.accountEmail, issuer, opts.secret);
}

export function verifyTotp(opts: { token: string; secret: string }): boolean {
  try {
    return authenticator.verify({ token: opts.token, secret: opts.secret });
  } catch {
    return false;
  }
}

const BACKUP_CODE_COUNT = 10;
const BACKUP_CODE_BYTES = 6;

export function generateBackupCodes(): {
  plain: string[];
  hashes: string[];
} {
  const plain: string[] = [];
  const hashes: string[] = [];
  for (let i = 0; i < BACKUP_CODE_COUNT; i++) {
    // 6 random bytes → 12 hex chars; trim to 10 for display ergonomics.
    const code = randomBytes(BACKUP_CODE_BYTES)
      .toString("hex")
      .slice(0, 10);
    plain.push(code);
    hashes.push(hashBackupCode(code));
  }
  return { plain, hashes };
}

export function hashBackupCode(code: string): string {
  return createHash("sha256").update(code.trim().toLowerCase()).digest("hex");
}
