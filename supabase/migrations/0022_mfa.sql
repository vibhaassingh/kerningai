-- =============================================================================
-- Migration 0022 — MFA (TOTP) factors
-- =============================================================================
-- Stores per-user TOTP secrets + backup codes. Activation is two-step:
-- enrol writes a `pending` row with the secret; verify confirms a valid
-- code and flips status to `active`.
--
-- Recovery codes are stored hashed (sha-256 hex) so they're verifiable
-- but not leakable from a DB dump.
-- =============================================================================

CREATE TYPE public.mfa_factor_status AS ENUM ('pending', 'active', 'revoked');

CREATE TABLE public.user_mfa_factors (
  id                    uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id               uuid NOT NULL REFERENCES public.app_users(id) ON DELETE CASCADE,
  kind                  text NOT NULL DEFAULT 'totp' CHECK (kind IN ('totp')),
  status                public.mfa_factor_status NOT NULL DEFAULT 'pending',
  -- Base32-encoded TOTP secret. Sensitive — never returned to clients.
  secret                text NOT NULL,
  -- Display label (e.g. "Vibhaas iPhone").
  label                 text NOT NULL DEFAULT 'Authenticator',
  -- Recovery codes — sha-256 hex of the plaintext code. NULL when used.
  backup_code_hashes    text[] NOT NULL DEFAULT ARRAY[]::text[],
  used_backup_code_hashes text[] NOT NULL DEFAULT ARRAY[]::text[],
  enrolled_at           timestamptz NOT NULL DEFAULT now(),
  activated_at          timestamptz,
  last_used_at          timestamptz,
  revoked_at            timestamptz,
  created_at            timestamptz NOT NULL DEFAULT now(),
  updated_at            timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX idx_user_mfa_factors_user ON public.user_mfa_factors (user_id);
CREATE INDEX idx_user_mfa_factors_status ON public.user_mfa_factors (status);
CREATE UNIQUE INDEX uq_user_mfa_factors_active
  ON public.user_mfa_factors (user_id)
  WHERE status = 'active';

CREATE TRIGGER trg_user_mfa_factors_updated_at
  BEFORE UPDATE ON public.user_mfa_factors
  FOR EACH ROW EXECUTE FUNCTION app.set_updated_at();

-- ---------------------------------------------------------------------------
-- RLS — users only see their own factors. Writes go through the
-- service-role client in Server Actions; nothing reaches users
-- directly except the public-safe metadata.
-- ---------------------------------------------------------------------------
ALTER TABLE public.user_mfa_factors ENABLE ROW LEVEL SECURITY;

CREATE POLICY "mfa_factors_self_read" ON public.user_mfa_factors
  FOR SELECT
  USING (user_id = app.current_user_id());

-- ---------------------------------------------------------------------------
-- Helper: has the user activated a TOTP factor?
-- ---------------------------------------------------------------------------
CREATE OR REPLACE FUNCTION app.has_active_mfa()
RETURNS boolean
LANGUAGE sql STABLE SECURITY DEFINER
SET search_path = public, app
AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.user_mfa_factors
    WHERE user_id = app.current_user_id()
      AND status = 'active'
  )
$$;

GRANT EXECUTE ON FUNCTION app.has_active_mfa() TO authenticated;

-- ---------------------------------------------------------------------------
-- Add MFA security event kinds (already exist in 0001 enum, but
-- guarded here for re-runnability).
-- ---------------------------------------------------------------------------
-- The kinds 'mfa_enabled' / 'mfa_disabled' already exist in
-- public.security_event_kind from migration 0001 — no change needed.
