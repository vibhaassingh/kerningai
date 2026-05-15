-- =============================================================================
-- Migration 0009 — Production-safe core seed
-- =============================================================================
-- This migration runs in BOTH local + remote (production). It only seeds
-- the minimal data needed for the platform to function at all:
--
--   * The internal Kerning AI organization (anchors super_admin memberships)
--
-- Dev-only data (sample clients, sites, users) lives in `supabase/seed.sql`
-- which is applied only during `supabase db reset` and never pushed to prod.
--
-- Idempotent. Safe to re-run.
-- =============================================================================

-- The canonical internal org. Re-use the same UUID across environments so
-- that super_admin memberships are portable.
INSERT INTO public.organizations (id, name, slug, type, region, billing_email, status, metadata)
VALUES (
  '00000000-0000-0000-0000-000000000001'::uuid,
  'Kerning AI',
  'kerning-ai',
  'internal',
  'eu-central-1',
  'hello@kerningai.eu',
  'active',
  '{"role": "internal", "is_kerning": true}'::jsonb
)
ON CONFLICT (id) DO NOTHING;
