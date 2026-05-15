import { ALLOWED_REDIRECT_HOSTS, SITE_URL } from "@/lib/env";

/**
 * Validates a user-supplied `returnTo` path or URL so we never hand
 * control to a third-party host after auth.
 *
 * Accepts:
 *   * Relative paths starting with "/" (and not "//", which would be a
 *     protocol-relative URL).
 *   * Absolute URLs whose host is in `ALLOWED_REDIRECT_HOSTS`.
 *
 * Falls back to `SITE_URL` (rooted at "/") when input is missing or
 * unsafe.
 */
export function safeRedirectTarget(returnTo: string | null | undefined): string {
  if (!returnTo) return "/";

  // Reject protocol-relative URLs immediately ("//evil.example/").
  if (returnTo.startsWith("//")) return "/";

  // Relative path — safe.
  if (returnTo.startsWith("/")) return returnTo;

  // Absolute URL — host must be allow-listed.
  try {
    const url = new URL(returnTo);
    if (ALLOWED_REDIRECT_HOSTS.includes(url.host)) {
      return url.toString();
    }
  } catch {
    // not a valid URL
  }

  return "/";
}

/**
 * Same as `safeRedirectTarget` but always returns an absolute URL,
 * useful for Supabase Auth's `emailRedirectTo` etc.
 */
export function safeRedirectUrl(returnTo: string | null | undefined): string {
  const target = safeRedirectTarget(returnTo);
  if (target.startsWith("http")) return target;
  return new URL(target, SITE_URL).toString();
}
