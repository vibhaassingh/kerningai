// Client-safe shared links (no "server-only" — imported by client chrome).

/**
 * Where the public marketing site sends users to sign in. This is an
 * absolute, cross-origin URL on purpose: the client/account portal lives
 * on its own domain (account.kerningai.eu), separate from the marketing
 * site, so "Sign in" must leave the current origin.
 */
export const PORTAL_SIGN_IN_URL = "https://account.kerningai.eu/login";
