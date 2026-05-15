-- =============================================================================
-- Migration 0002 — Role-Based Access Control
-- =============================================================================
-- Creates:
--   * roles — internal + client role catalogue
--   * permissions — atomic permission slugs grouped by category
--   * role_permissions — many-to-many grant table
--   * app.has_permission(perm, org_id) helper for RLS + server checks
-- =============================================================================

CREATE TYPE public.role_scope AS ENUM ('internal', 'client', 'both');

CREATE TABLE public.roles (
  slug              text PRIMARY KEY,
  name              text NOT NULL,
  description       text,
  scope             public.role_scope NOT NULL,
  is_builtin        boolean NOT NULL DEFAULT true,
  rank              integer NOT NULL DEFAULT 0,
  created_at        timestamptz NOT NULL DEFAULT now(),
  updated_at        timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX idx_roles_scope ON public.roles (scope);

CREATE TABLE public.permissions (
  slug              text PRIMARY KEY,
  name              text NOT NULL,
  description       text,
  category          text NOT NULL,
  created_at        timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX idx_permissions_category ON public.permissions (category);

CREATE TABLE public.role_permissions (
  role_slug         text NOT NULL REFERENCES public.roles(slug) ON DELETE CASCADE,
  permission_slug   text NOT NULL REFERENCES public.permissions(slug) ON DELETE CASCADE,
  created_at        timestamptz NOT NULL DEFAULT now(),
  PRIMARY KEY (role_slug, permission_slug)
);

CREATE INDEX idx_role_permissions_perm ON public.role_permissions (permission_slug);

-- Backfill the membership FK now that roles exists.
ALTER TABLE public.organization_memberships
  ADD CONSTRAINT memberships_role_slug_fk
  FOREIGN KEY (role_slug) REFERENCES public.roles(slug) ON DELETE RESTRICT
  DEFERRABLE INITIALLY DEFERRED;

ALTER TABLE public.invites
  ADD CONSTRAINT invites_role_slug_fk
  FOREIGN KEY (role_slug) REFERENCES public.roles(slug) ON DELETE RESTRICT
  DEFERRABLE INITIALLY DEFERRED;

-- ---------------------------------------------------------------------------
-- Permission check helper
-- ---------------------------------------------------------------------------
-- Returns true when the current user has the given permission within the
-- given org. Super-admins always pass.
CREATE OR REPLACE FUNCTION app.has_permission(p_permission text, p_org_id uuid)
RETURNS boolean
LANGUAGE sql STABLE SECURITY DEFINER
SET search_path = public, app
AS $$
  SELECT
    app.is_super_admin()
    OR EXISTS (
      SELECT 1
      FROM public.organization_memberships m
      JOIN public.role_permissions rp ON rp.role_slug = m.role_slug
      WHERE m.user_id = app.current_user_id()
        AND m.organization_id = p_org_id
        AND m.status = 'active'
        AND rp.permission_slug = p_permission
    )
$$;

-- Returns true when the current user has the given permission in ANY of
-- their active memberships. Useful for "can the user even see this nav
-- item" gating.
CREATE OR REPLACE FUNCTION app.has_permission_any(p_permission text)
RETURNS boolean
LANGUAGE sql STABLE SECURITY DEFINER
SET search_path = public, app
AS $$
  SELECT
    app.is_super_admin()
    OR EXISTS (
      SELECT 1
      FROM public.organization_memberships m
      JOIN public.role_permissions rp ON rp.role_slug = m.role_slug
      WHERE m.user_id = app.current_user_id()
        AND m.status = 'active'
        AND rp.permission_slug = p_permission
    )
$$;

GRANT EXECUTE ON FUNCTION app.has_permission(text, uuid) TO authenticated;
GRANT EXECUTE ON FUNCTION app.has_permission_any(text) TO authenticated;

-- ---------------------------------------------------------------------------
-- RLS — roles + permissions are world-readable to authenticated users
-- (no secrets here, just the catalogue). Writes restricted to super_admin.
-- ---------------------------------------------------------------------------
ALTER TABLE public.roles ENABLE ROW LEVEL SECURITY;
CREATE POLICY "roles_authed_read" ON public.roles
  FOR SELECT USING (app.current_user_id() IS NOT NULL);
CREATE POLICY "roles_super_admin_write" ON public.roles
  FOR ALL
  USING (app.is_super_admin())
  WITH CHECK (app.is_super_admin());

ALTER TABLE public.permissions ENABLE ROW LEVEL SECURITY;
CREATE POLICY "permissions_authed_read" ON public.permissions
  FOR SELECT USING (app.current_user_id() IS NOT NULL);
CREATE POLICY "permissions_super_admin_write" ON public.permissions
  FOR ALL
  USING (app.is_super_admin())
  WITH CHECK (app.is_super_admin());

ALTER TABLE public.role_permissions ENABLE ROW LEVEL SECURITY;
CREATE POLICY "role_permissions_authed_read" ON public.role_permissions
  FOR SELECT USING (app.current_user_id() IS NOT NULL);
CREATE POLICY "role_permissions_super_admin_write" ON public.role_permissions
  FOR ALL
  USING (app.is_super_admin())
  WITH CHECK (app.is_super_admin());
