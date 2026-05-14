import "server-only";

import { createHmac, timingSafeEqual } from "node:crypto";

/**
 * Verifies an HMAC-SHA256 signature using a shared secret.
 *
 * The signature is expected as a hex string in the `x-kai-signature`
 * header; the body is the raw request body (string).
 */
export function verifyHmac(
  rawBody: string,
  signature: string | null,
  secret: string,
): boolean {
  if (!signature || !secret) return false;
  const computed = createHmac("sha256", secret).update(rawBody).digest("hex");
  // Both sides must be the same byte length for timingSafeEqual.
  if (computed.length !== signature.length) return false;
  try {
    return timingSafeEqual(Buffer.from(computed), Buffer.from(signature));
  } catch {
    return false;
  }
}
