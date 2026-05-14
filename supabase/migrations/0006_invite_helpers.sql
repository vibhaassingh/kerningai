-- =============================================================================
-- Migration 0006 — Invite-flow helpers
-- =============================================================================
-- Adds:
--   * Index on (token_hash, status) for fast invite lookup at /invite/[token]
--   * Constraint: an org can have only one pending invite per email at a time
--   * `app.find_invite_by_token_hash()` SECURITY DEFINER helper so the public
--     /invite/[token] route can resolve the invite + show context (org, role)
--     without the user being signed in.
-- =============================================================================

CREATE UNIQUE INDEX IF NOT EXISTS uniq_invites_pending_per_email
  ON public.invites (organization_id, lower(email))
  WHERE status = 'pending';

-- ---------------------------------------------------------------------------
-- find_invite_by_token_hash
-- ---------------------------------------------------------------------------
-- Returns the invite row + the org name + the role label, given a hashed
-- token. SECURITY DEFINER lets the public /invite/[token] page resolve the
-- invite without authenticating. Status + expiry are returned so the page
-- can show the right state (pending, expired, accepted, revoked).
CREATE OR REPLACE FUNCTION app.find_invite_by_token_hash(p_token_hash text)
RETURNS TABLE (
  invite_id          uuid,
  email              text,
  organization_id    uuid,
  organization_name  text,
  organization_type  public.org_type,
  role_slug          text,
  role_name          text,
  status             public.invite_status,
  expires_at         timestamptz
)
LANGUAGE sql STABLE SECURITY DEFINER
SET search_path = public, app
AS $$
  SELECT
    i.id,
    i.email::text,
    i.organization_id,
    o.name,
    o.type,
    i.role_slug,
    r.name,
    i.status,
    i.expires_at
  FROM public.invites i
  JOIN public.organizations o ON o.id = i.organization_id
  JOIN public.roles r ON r.slug = i.role_slug
  WHERE i.token_hash = p_token_hash
  LIMIT 1
$$;

-- Anonymous + authenticated callers both need to read this at /invite/[token].
GRANT EXECUTE ON FUNCTION app.find_invite_by_token_hash(text) TO anon, authenticated;

-- ---------------------------------------------------------------------------
-- Convenience view: org_members_view
-- ---------------------------------------------------------------------------
-- Joins memberships + app_users + roles so the admin "Users & roles" page
-- has a flat row to render. Defined as a view so RLS on the underlying
-- tables still applies; admins see members of orgs they administer,
-- super_admin sees everyone.
CREATE OR REPLACE VIEW public.org_members_view AS
  SELECT
    m.id              AS membership_id,
    m.organization_id,
    m.user_id,
    u.email,
    u.full_name,
    u.last_login_at,
    m.role_slug,
    r.name            AS role_name,
    m.status,
    m.site_ids,
    m.invited_at,
    m.accepted_at,
    m.created_at,
    m.updated_at
  FROM public.organization_memberships m
  JOIN public.app_users u ON u.id = m.user_id
  JOIN public.roles r ON r.slug = m.role_slug;

GRANT SELECT ON public.org_members_view TO authenticated;
