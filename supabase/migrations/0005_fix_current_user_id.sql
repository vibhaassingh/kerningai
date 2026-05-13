-- =============================================================================
-- Migration 0005 — Use auth.uid() instead of legacy JWT claim setting
-- =============================================================================
-- Supabase's new asymmetric JWT keys (sb_publishable_* / sb_secret_*) deliver
-- claims as a single JSON blob in `request.jwt.claims`, not as individual
-- `request.jwt.claim.<key>` settings. The canonical accessor is `auth.uid()`.
--
-- We redefine `app.current_user_id()` to wrap `auth.uid()` so every helper
-- (is_member_of, user_role_in, has_permission, etc) automatically picks up
-- the right value. Also drop the temporary debug function added during
-- bring-up verification.
-- =============================================================================

CREATE OR REPLACE FUNCTION app.current_user_id()
RETURNS uuid
LANGUAGE sql STABLE
AS $$
  SELECT auth.uid()
$$;

DROP FUNCTION IF EXISTS public._debug_whoami();
