// No-op stub. The real `server-only` package throws when imported in a
// browser bundle. In a Vitest node environment we just want imports to
// resolve so we can exercise the server-side helpers from tests.
export {};
