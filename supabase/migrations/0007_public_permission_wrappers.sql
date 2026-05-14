-- =============================================================================
-- Migration 0007 — Expose permission helpers via the public schema
-- =============================================================================
-- PostgREST (and therefore the Supabase JS client's `.rpc(...)`) only
-- resolves functions in schemas listed under `[api].schemas` in
-- supabase/config.toml — by default `public` and `graphql_public`.
--
-- Our auth + RLS helpers live in `app` for clean separation. We expose
-- them through thin SECURITY INVOKER wrappers in `public` so the SDK can
-- call them without us widening the exposed schema list.
-- =============================================================================

CREATE OR REPLACE FUNCTION public.has_permission(p_permission text, p_org_id uuid)
RETURNS boolean
LANGUAGE sql STABLE
AS $$
  SELECT app.has_permission(p_permission, p_org_id)
$$;

CREATE OR REPLACE FUNCTION public.has_permission_any(p_permission text)
RETURNS boolean
LANGUAGE sql STABLE
AS $$
  SELECT app.has_permission_any(p_permission)
$$;

GRANT EXECUTE ON FUNCTION public.has_permission(text, uuid) TO authenticated, anon;
GRANT EXECUTE ON FUNCTION public.has_permission_any(text) TO authenticated, anon;

-- Public wrapper for the invite lookup helper. Inlined (no cross-schema
-- dependency on `app`) so it works for every Postgres role that holds
-- EXECUTE, including `service_role` used by server-side code.
CREATE OR REPLACE FUNCTION public.find_invite_by_token_hash(p_token_hash text)
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
SET search_path = public
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

GRANT EXECUTE ON FUNCTION public.find_invite_by_token_hash(text) TO authenticated, anon;
