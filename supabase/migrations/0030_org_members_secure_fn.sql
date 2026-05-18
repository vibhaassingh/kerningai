-- =============================================================================
-- Migration 0030 — Replace org_members_view with a tenant-guarded function
-- =============================================================================
-- public.org_members_view was a bare (RLS-bypassing) view; tenant isolation
-- depended entirely on every caller remembering to add
-- `.eq(organization_id, <caller's org>)`. The Supabase linter flags this
-- (security_definer_view) because the DB enforces nothing.
--
-- Switching the view to security_invoker is NOT viable: app_users SELECT RLS
-- is `id = current_user OR is_super_admin`, so under the caller's RLS the
-- member-list join collapses to "self only" for everyone except super admin
-- (breaking the portal Team page + admin member lists).
--
-- Instead: a SECURITY DEFINER function that enforces the tenant boundary
-- inside the DB — a caller only gets rows for an org they belong to, or if
-- they are internal staff / super admin. A missing or wrong caller-side
-- filter can no longer leak another org's members.
-- =============================================================================

CREATE OR REPLACE FUNCTION public.org_members_for_org(p_org_id uuid)
RETURNS TABLE (
  membership_id   uuid,
  organization_id uuid,
  user_id         uuid,
  email           text,
  full_name       text,
  last_login_at   timestamptz,
  role_slug       text,
  role_name       text,
  status          text,
  site_ids        text[],
  invited_at      timestamptz,
  accepted_at     timestamptz,
  created_at      timestamptz,
  updated_at      timestamptz
)
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public, app
AS $$
  SELECT
    m.id,
    m.organization_id,
    m.user_id,
    u.email::text,
    u.full_name,
    u.last_login_at,
    m.role_slug,
    r.name,
    m.status::text,
    m.site_ids::text[],
    m.invited_at,
    m.accepted_at,
    m.created_at,
    m.updated_at
  FROM public.organization_memberships m
  JOIN public.app_users u ON u.id = m.user_id
  JOIN public.roles r ON r.slug = m.role_slug
  WHERE m.organization_id = p_org_id
    AND (
      app.is_super_admin()
      OR app.is_internal_staff()
      OR app.is_member_of(p_org_id)
    )
$$;

-- Postgres grants EXECUTE to PUBLIC by default; scope it to authenticated
-- only (anon never needs this RPC, and the in-function guard already
-- returns nothing without a user context — defense in depth).
REVOKE EXECUTE ON FUNCTION public.org_members_for_org(uuid) FROM PUBLIC;
REVOKE EXECUTE ON FUNCTION public.org_members_for_org(uuid) FROM anon;
GRANT EXECUTE ON FUNCTION public.org_members_for_org(uuid) TO authenticated;

-- Nothing in the DB depends on the view (verified); all app callers move to
-- the function in the same change.
DROP VIEW IF EXISTS public.org_members_view;
