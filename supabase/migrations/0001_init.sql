-- =============================================================================
-- Migration 0001 — Core identity, tenancy, audit, storage scaffolding
-- =============================================================================
-- Establishes:
--   * extensions (pgcrypto for UUIDs, citext for case-insensitive emails)
--   * `app` schema with helper functions used by RLS policies
--   * core identity tables: app_users, connected_accounts
--   * tenancy tables: organizations, client_settings, sites, site_areas
--   * membership + invite tables
--   * security + audit log tables
--   * system tables: feature_flags, system_settings
--   * RLS enabled on every tenant table with helper-function-based policies
-- =============================================================================

-- ---------------------------------------------------------------------------
-- Extensions
-- ---------------------------------------------------------------------------
CREATE EXTENSION IF NOT EXISTS pgcrypto;
CREATE EXTENSION IF NOT EXISTS citext;

-- ---------------------------------------------------------------------------
-- `app` schema — server-trusted helpers used by RLS policies
-- ---------------------------------------------------------------------------
CREATE SCHEMA IF NOT EXISTS app;

-- Reads the auth user id from the JWT claim. Returns NULL when unauthenticated.
CREATE OR REPLACE FUNCTION app.current_user_id()
RETURNS uuid
LANGUAGE sql STABLE
AS $$
  SELECT NULLIF(
    current_setting('request.jwt.claim.sub', true),
    ''
  )::uuid
$$;

-- ---------------------------------------------------------------------------
-- app_users — profile data linked 1:1 to auth.users
-- ---------------------------------------------------------------------------
CREATE TABLE public.app_users (
  id                uuid PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  email             citext NOT NULL UNIQUE,
  full_name         text,
  avatar_url        text,
  default_org_id    uuid,
  language          text NOT NULL DEFAULT 'en',
  timezone          text NOT NULL DEFAULT 'Europe/Amsterdam',
  last_login_at     timestamptz,
  created_at        timestamptz NOT NULL DEFAULT now(),
  updated_at        timestamptz NOT NULL DEFAULT now(),
  deleted_at        timestamptz,
  metadata          jsonb NOT NULL DEFAULT '{}'::jsonb
);

CREATE INDEX idx_app_users_email ON public.app_users (email);
CREATE INDEX idx_app_users_deleted_at ON public.app_users (deleted_at) WHERE deleted_at IS NULL;

-- ---------------------------------------------------------------------------
-- organizations — both internal Kerning org and client orgs
-- ---------------------------------------------------------------------------
CREATE TYPE public.org_type AS ENUM ('internal', 'client');

CREATE TABLE public.organizations (
  id                uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name              text NOT NULL,
  slug              text NOT NULL UNIQUE,
  type              public.org_type NOT NULL,
  region            text NOT NULL DEFAULT 'eu-central-1',
  billing_email     citext,
  status            text NOT NULL DEFAULT 'active' CHECK (status IN ('active', 'suspended', 'archived')),
  created_at        timestamptz NOT NULL DEFAULT now(),
  updated_at        timestamptz NOT NULL DEFAULT now(),
  deleted_at        timestamptz,
  created_by_id     uuid REFERENCES public.app_users(id),
  updated_by_id     uuid REFERENCES public.app_users(id),
  metadata          jsonb NOT NULL DEFAULT '{}'::jsonb
);

CREATE INDEX idx_organizations_type ON public.organizations (type);
CREATE INDEX idx_organizations_status ON public.organizations (status);

-- FK back from app_users now that organizations exists
ALTER TABLE public.app_users
  ADD CONSTRAINT app_users_default_org_fk
  FOREIGN KEY (default_org_id) REFERENCES public.organizations(id) ON DELETE SET NULL;

-- ---------------------------------------------------------------------------
-- client_settings — extends organizations where type='client'
-- ---------------------------------------------------------------------------
CREATE TYPE public.deployment_type AS ENUM ('cloud', 'sovereign_cloud', 'on_prem', 'air_gapped');

CREATE TABLE public.client_settings (
  organization_id   uuid PRIMARY KEY REFERENCES public.organizations(id) ON DELETE CASCADE,
  industry          text,
  deployment_type   public.deployment_type NOT NULL DEFAULT 'cloud',
  modules_enabled   text[] NOT NULL DEFAULT ARRAY[]::text[],
  health_score      integer CHECK (health_score >= 0 AND health_score <= 100),
  mrr_cents         bigint NOT NULL DEFAULT 0,
  currency          text NOT NULL DEFAULT 'EUR',
  renewal_date      date,
  created_at        timestamptz NOT NULL DEFAULT now(),
  updated_at        timestamptz NOT NULL DEFAULT now(),
  metadata          jsonb NOT NULL DEFAULT '{}'::jsonb
);

-- ---------------------------------------------------------------------------
-- sites — physical locations per client org
-- ---------------------------------------------------------------------------
CREATE TABLE public.sites (
  id                uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id   uuid NOT NULL REFERENCES public.organizations(id) ON DELETE CASCADE,
  name              text NOT NULL,
  slug              text NOT NULL,
  region            text NOT NULL DEFAULT 'eu-central-1',
  timezone          text NOT NULL DEFAULT 'Europe/Amsterdam',
  deployment_type   public.deployment_type,
  address           jsonb NOT NULL DEFAULT '{}'::jsonb,
  status            text NOT NULL DEFAULT 'active' CHECK (status IN ('active', 'pending', 'archived')),
  created_at        timestamptz NOT NULL DEFAULT now(),
  updated_at        timestamptz NOT NULL DEFAULT now(),
  deleted_at        timestamptz,
  created_by_id     uuid REFERENCES public.app_users(id),
  updated_by_id     uuid REFERENCES public.app_users(id),
  metadata          jsonb NOT NULL DEFAULT '{}'::jsonb,
  UNIQUE (organization_id, slug)
);

CREATE INDEX idx_sites_org ON public.sites (organization_id);
CREATE INDEX idx_sites_status ON public.sites (status);

-- ---------------------------------------------------------------------------
-- site_areas — sub-locations within a site
-- ---------------------------------------------------------------------------
CREATE TABLE public.site_areas (
  id                uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id   uuid NOT NULL REFERENCES public.organizations(id) ON DELETE CASCADE,
  site_id           uuid NOT NULL REFERENCES public.sites(id) ON DELETE CASCADE,
  name              text NOT NULL,
  kind              text,
  created_at        timestamptz NOT NULL DEFAULT now(),
  updated_at        timestamptz NOT NULL DEFAULT now(),
  metadata          jsonb NOT NULL DEFAULT '{}'::jsonb
);

CREATE INDEX idx_site_areas_org ON public.site_areas (organization_id);
CREATE INDEX idx_site_areas_site ON public.site_areas (site_id);

-- ---------------------------------------------------------------------------
-- organization_memberships — users belong to orgs via this join table
-- ---------------------------------------------------------------------------
CREATE TYPE public.membership_status AS ENUM ('pending', 'active', 'suspended');

-- NB: role_id is added in migration 0002 once `roles` exists. We use text
-- here for the immediate seed; the FK is wired up after roles ship.
CREATE TABLE public.organization_memberships (
  id                uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id           uuid NOT NULL REFERENCES public.app_users(id) ON DELETE CASCADE,
  organization_id   uuid NOT NULL REFERENCES public.organizations(id) ON DELETE CASCADE,
  role_slug         text NOT NULL,
  status            public.membership_status NOT NULL DEFAULT 'pending',
  site_ids          uuid[] NOT NULL DEFAULT ARRAY[]::uuid[],
  invited_at        timestamptz,
  accepted_at       timestamptz,
  created_at        timestamptz NOT NULL DEFAULT now(),
  updated_at        timestamptz NOT NULL DEFAULT now(),
  metadata          jsonb NOT NULL DEFAULT '{}'::jsonb,
  UNIQUE (user_id, organization_id)
);

CREATE INDEX idx_memberships_user ON public.organization_memberships (user_id);
CREATE INDEX idx_memberships_org ON public.organization_memberships (organization_id);
CREATE INDEX idx_memberships_status ON public.organization_memberships (status);

-- ---------------------------------------------------------------------------
-- invites — pending email invites to join an org
-- ---------------------------------------------------------------------------
CREATE TYPE public.invite_status AS ENUM ('pending', 'accepted', 'revoked', 'expired');

CREATE TABLE public.invites (
  id                uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  email             citext NOT NULL,
  organization_id   uuid NOT NULL REFERENCES public.organizations(id) ON DELETE CASCADE,
  role_slug         text NOT NULL,
  site_ids          uuid[] NOT NULL DEFAULT ARRAY[]::uuid[],
  token_hash        text NOT NULL,
  expires_at        timestamptz NOT NULL,
  status            public.invite_status NOT NULL DEFAULT 'pending',
  invited_by_id     uuid REFERENCES public.app_users(id),
  accepted_by_id    uuid REFERENCES public.app_users(id),
  accepted_at       timestamptz,
  created_at        timestamptz NOT NULL DEFAULT now(),
  updated_at        timestamptz NOT NULL DEFAULT now(),
  metadata          jsonb NOT NULL DEFAULT '{}'::jsonb
);

CREATE INDEX idx_invites_email ON public.invites (email);
CREATE INDEX idx_invites_org ON public.invites (organization_id);
CREATE INDEX idx_invites_status ON public.invites (status);
CREATE INDEX idx_invites_token_hash ON public.invites (token_hash);

-- ---------------------------------------------------------------------------
-- connected_accounts — OAuth provider links (Google for now)
-- ---------------------------------------------------------------------------
CREATE TYPE public.auth_provider AS ENUM ('google');

CREATE TABLE public.connected_accounts (
  id                uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id           uuid NOT NULL REFERENCES public.app_users(id) ON DELETE CASCADE,
  provider          public.auth_provider NOT NULL,
  provider_user_id  text NOT NULL,
  email             citext,
  linked_at         timestamptz NOT NULL DEFAULT now(),
  metadata          jsonb NOT NULL DEFAULT '{}'::jsonb,
  UNIQUE (provider, provider_user_id),
  UNIQUE (user_id, provider)
);

CREATE INDEX idx_connected_accounts_user ON public.connected_accounts (user_id);

-- ---------------------------------------------------------------------------
-- security_events — auditable auth/security events
-- ---------------------------------------------------------------------------
CREATE TYPE public.security_event_kind AS ENUM (
  'account_created',
  'invite_accepted',
  'email_verified',
  'password_changed',
  'password_reset_requested',
  'password_reset_completed',
  'login_succeeded',
  'login_failed',
  'logout',
  'session_revoked',
  'forced_logout',
  'google_linked',
  'google_unlinked',
  'mfa_enabled',
  'mfa_disabled',
  'permission_changed',
  'role_changed'
);

CREATE TABLE public.security_events (
  id                uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id           uuid REFERENCES public.app_users(id) ON DELETE SET NULL,
  kind              public.security_event_kind NOT NULL,
  ip                inet,
  user_agent        text,
  created_at        timestamptz NOT NULL DEFAULT now(),
  metadata          jsonb NOT NULL DEFAULT '{}'::jsonb
);

CREATE INDEX idx_security_events_user ON public.security_events (user_id);
CREATE INDEX idx_security_events_kind ON public.security_events (kind);
CREATE INDEX idx_security_events_created_at ON public.security_events (created_at DESC);

-- ---------------------------------------------------------------------------
-- audit_logs — generic mutation log for admin-visible actions
-- ---------------------------------------------------------------------------
CREATE TABLE public.audit_logs (
  id                uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  actor_id          uuid REFERENCES public.app_users(id) ON DELETE SET NULL,
  organization_id   uuid REFERENCES public.organizations(id) ON DELETE SET NULL,
  action            text NOT NULL,
  resource_type     text NOT NULL,
  resource_id       text,
  before            jsonb,
  after             jsonb,
  ip                inet,
  user_agent        text,
  created_at        timestamptz NOT NULL DEFAULT now(),
  metadata          jsonb NOT NULL DEFAULT '{}'::jsonb
);

CREATE INDEX idx_audit_logs_actor ON public.audit_logs (actor_id);
CREATE INDEX idx_audit_logs_org ON public.audit_logs (organization_id);
CREATE INDEX idx_audit_logs_action ON public.audit_logs (action);
CREATE INDEX idx_audit_logs_resource ON public.audit_logs (resource_type, resource_id);
CREATE INDEX idx_audit_logs_created_at ON public.audit_logs (created_at DESC);

-- ---------------------------------------------------------------------------
-- feature_flags — global + per-org flag store
-- ---------------------------------------------------------------------------
CREATE TABLE public.feature_flags (
  slug              text PRIMARY KEY,
  description       text,
  enabled_globally  boolean NOT NULL DEFAULT false,
  enabled_org_ids   uuid[] NOT NULL DEFAULT ARRAY[]::uuid[],
  config            jsonb NOT NULL DEFAULT '{}'::jsonb,
  created_at        timestamptz NOT NULL DEFAULT now(),
  updated_at        timestamptz NOT NULL DEFAULT now()
);

-- ---------------------------------------------------------------------------
-- system_settings — singleton config (one row per key)
-- ---------------------------------------------------------------------------
CREATE TABLE public.system_settings (
  key               text PRIMARY KEY,
  value             jsonb NOT NULL,
  updated_at        timestamptz NOT NULL DEFAULT now(),
  updated_by_id     uuid REFERENCES public.app_users(id)
);

-- ---------------------------------------------------------------------------
-- updated_at trigger — auto-bump on UPDATE
-- ---------------------------------------------------------------------------
CREATE OR REPLACE FUNCTION app.set_updated_at()
RETURNS trigger
LANGUAGE plpgsql
AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$;

-- Apply to every table with an updated_at column
DO $$
DECLARE
  t text;
BEGIN
  FOR t IN
    SELECT c.table_name
    FROM information_schema.columns c
    WHERE c.table_schema = 'public'
      AND c.column_name = 'updated_at'
  LOOP
    EXECUTE format(
      'CREATE TRIGGER trg_%I_updated_at BEFORE UPDATE ON public.%I FOR EACH ROW EXECUTE FUNCTION app.set_updated_at();',
      t, t
    );
  END LOOP;
END $$;

-- ---------------------------------------------------------------------------
-- Tenancy helper functions
-- ---------------------------------------------------------------------------

-- Returns the org IDs the current authenticated user belongs to (active membership only).
CREATE OR REPLACE FUNCTION app.user_org_ids()
RETURNS SETOF uuid
LANGUAGE sql STABLE SECURITY DEFINER
SET search_path = public, app
AS $$
  SELECT m.organization_id
  FROM public.organization_memberships m
  WHERE m.user_id = app.current_user_id()
    AND m.status = 'active'
$$;

-- True if the current user is a member of the given org with active status.
CREATE OR REPLACE FUNCTION app.is_member_of(p_org_id uuid)
RETURNS boolean
LANGUAGE sql STABLE SECURITY DEFINER
SET search_path = public, app
AS $$
  SELECT EXISTS (
    SELECT 1
    FROM public.organization_memberships m
    WHERE m.user_id = app.current_user_id()
      AND m.organization_id = p_org_id
      AND m.status = 'active'
  )
$$;

-- Returns the current user's role slug in the given org, or NULL if not a member.
CREATE OR REPLACE FUNCTION app.user_role_in(p_org_id uuid)
RETURNS text
LANGUAGE sql STABLE SECURITY DEFINER
SET search_path = public, app
AS $$
  SELECT m.role_slug
  FROM public.organization_memberships m
  WHERE m.user_id = app.current_user_id()
    AND m.organization_id = p_org_id
    AND m.status = 'active'
  LIMIT 1
$$;

-- True if the current user is a super_admin in the internal Kerning org.
CREATE OR REPLACE FUNCTION app.is_super_admin()
RETURNS boolean
LANGUAGE sql STABLE SECURITY DEFINER
SET search_path = public, app
AS $$
  SELECT EXISTS (
    SELECT 1
    FROM public.organization_memberships m
    JOIN public.organizations o ON o.id = m.organization_id
    WHERE m.user_id = app.current_user_id()
      AND m.status = 'active'
      AND m.role_slug = 'super_admin'
      AND o.type = 'internal'
  )
$$;

-- True if the current user is internal staff (any role inside an internal org).
CREATE OR REPLACE FUNCTION app.is_internal_staff()
RETURNS boolean
LANGUAGE sql STABLE SECURITY DEFINER
SET search_path = public, app
AS $$
  SELECT EXISTS (
    SELECT 1
    FROM public.organization_memberships m
    JOIN public.organizations o ON o.id = m.organization_id
    WHERE m.user_id = app.current_user_id()
      AND m.status = 'active'
      AND o.type = 'internal'
  )
$$;

-- ---------------------------------------------------------------------------
-- RLS policies
-- ---------------------------------------------------------------------------

-- app_users: users can read their own row; super_admin can read all
ALTER TABLE public.app_users ENABLE ROW LEVEL SECURITY;

CREATE POLICY "app_users_self_read" ON public.app_users
  FOR SELECT
  USING (id = app.current_user_id() OR app.is_super_admin());

CREATE POLICY "app_users_self_update" ON public.app_users
  FOR UPDATE
  USING (id = app.current_user_id() OR app.is_super_admin())
  WITH CHECK (id = app.current_user_id() OR app.is_super_admin());

-- organizations: members can read; super_admin can read all
ALTER TABLE public.organizations ENABLE ROW LEVEL SECURITY;

CREATE POLICY "organizations_member_read" ON public.organizations
  FOR SELECT
  USING (app.is_member_of(id) OR app.is_super_admin());

CREATE POLICY "organizations_super_admin_write" ON public.organizations
  FOR ALL
  USING (app.is_super_admin())
  WITH CHECK (app.is_super_admin());

-- client_settings: members of the org can read; super_admin + client_owner can update
ALTER TABLE public.client_settings ENABLE ROW LEVEL SECURITY;

CREATE POLICY "client_settings_member_read" ON public.client_settings
  FOR SELECT
  USING (app.is_member_of(organization_id) OR app.is_super_admin());

CREATE POLICY "client_settings_admin_write" ON public.client_settings
  FOR ALL
  USING (app.is_super_admin() OR app.user_role_in(organization_id) = 'client_owner')
  WITH CHECK (app.is_super_admin() OR app.user_role_in(organization_id) = 'client_owner');

-- sites: members of the org can read; super_admin + site-managing roles can write
ALTER TABLE public.sites ENABLE ROW LEVEL SECURITY;

CREATE POLICY "sites_member_read" ON public.sites
  FOR SELECT
  USING (app.is_member_of(organization_id) OR app.is_super_admin());

CREATE POLICY "sites_admin_write" ON public.sites
  FOR ALL
  USING (
    app.is_super_admin()
    OR app.user_role_in(organization_id) IN ('client_owner', 'site_director')
    OR app.is_internal_staff()
  )
  WITH CHECK (
    app.is_super_admin()
    OR app.user_role_in(organization_id) IN ('client_owner', 'site_director')
    OR app.is_internal_staff()
  );

-- site_areas: same as sites
ALTER TABLE public.site_areas ENABLE ROW LEVEL SECURITY;

CREATE POLICY "site_areas_member_read" ON public.site_areas
  FOR SELECT
  USING (app.is_member_of(organization_id) OR app.is_super_admin());

CREATE POLICY "site_areas_admin_write" ON public.site_areas
  FOR ALL
  USING (
    app.is_super_admin()
    OR app.user_role_in(organization_id) IN ('client_owner', 'site_director', 'site_manager')
    OR app.is_internal_staff()
  )
  WITH CHECK (
    app.is_super_admin()
    OR app.user_role_in(organization_id) IN ('client_owner', 'site_director', 'site_manager')
    OR app.is_internal_staff()
  );

-- organization_memberships: users see their own memberships; admins see org memberships
ALTER TABLE public.organization_memberships ENABLE ROW LEVEL SECURITY;

CREATE POLICY "memberships_self_or_admin_read" ON public.organization_memberships
  FOR SELECT
  USING (
    user_id = app.current_user_id()
    OR app.is_super_admin()
    OR app.user_role_in(organization_id) IN ('client_owner', 'it_admin')
    OR app.is_internal_staff()
  );

CREATE POLICY "memberships_admin_write" ON public.organization_memberships
  FOR ALL
  USING (
    app.is_super_admin()
    OR app.user_role_in(organization_id) IN ('client_owner', 'it_admin')
  )
  WITH CHECK (
    app.is_super_admin()
    OR app.user_role_in(organization_id) IN ('client_owner', 'it_admin')
  );

-- invites: admins of the target org see them; everyone else sees nothing
ALTER TABLE public.invites ENABLE ROW LEVEL SECURITY;

CREATE POLICY "invites_admin_read" ON public.invites
  FOR SELECT
  USING (
    app.is_super_admin()
    OR app.user_role_in(organization_id) IN ('client_owner', 'it_admin')
    OR app.is_internal_staff()
  );

CREATE POLICY "invites_admin_write" ON public.invites
  FOR ALL
  USING (
    app.is_super_admin()
    OR app.user_role_in(organization_id) IN ('client_owner', 'it_admin')
    OR app.is_internal_staff()
  )
  WITH CHECK (
    app.is_super_admin()
    OR app.user_role_in(organization_id) IN ('client_owner', 'it_admin')
    OR app.is_internal_staff()
  );

-- connected_accounts: users see + manage only their own
ALTER TABLE public.connected_accounts ENABLE ROW LEVEL SECURITY;

CREATE POLICY "connected_accounts_self" ON public.connected_accounts
  FOR ALL
  USING (user_id = app.current_user_id() OR app.is_super_admin())
  WITH CHECK (user_id = app.current_user_id() OR app.is_super_admin());

-- security_events: users see their own; super_admin sees all
ALTER TABLE public.security_events ENABLE ROW LEVEL SECURITY;

CREATE POLICY "security_events_self_read" ON public.security_events
  FOR SELECT
  USING (user_id = app.current_user_id() OR app.is_super_admin());

-- security_events writes happen via service role only (auth flows)
-- No INSERT/UPDATE/DELETE policy for end users.

-- audit_logs: super_admin + org admins can read their org's logs
ALTER TABLE public.audit_logs ENABLE ROW LEVEL SECURITY;

CREATE POLICY "audit_logs_admin_read" ON public.audit_logs
  FOR SELECT
  USING (
    app.is_super_admin()
    OR (organization_id IS NOT NULL AND app.user_role_in(organization_id) IN ('client_owner', 'it_admin', 'read_only_auditor_client'))
    OR app.is_internal_staff()
  );

-- audit_logs writes happen via service role through withAudit() wrapper.

-- feature_flags: readable by authenticated users; only super_admin writes
ALTER TABLE public.feature_flags ENABLE ROW LEVEL SECURITY;

CREATE POLICY "feature_flags_authed_read" ON public.feature_flags
  FOR SELECT
  USING (app.current_user_id() IS NOT NULL);

CREATE POLICY "feature_flags_super_admin_write" ON public.feature_flags
  FOR ALL
  USING (app.is_super_admin())
  WITH CHECK (app.is_super_admin());

-- system_settings: only super_admin reads/writes
ALTER TABLE public.system_settings ENABLE ROW LEVEL SECURITY;

CREATE POLICY "system_settings_super_admin" ON public.system_settings
  FOR ALL
  USING (app.is_super_admin())
  WITH CHECK (app.is_super_admin());

-- ---------------------------------------------------------------------------
-- Bootstrap trigger: when a new auth.users row is created, mirror it to app_users
-- ---------------------------------------------------------------------------
CREATE OR REPLACE FUNCTION app.handle_new_auth_user()
RETURNS trigger
LANGUAGE plpgsql SECURITY DEFINER
SET search_path = public, app
AS $$
BEGIN
  INSERT INTO public.app_users (id, email, full_name)
  VALUES (
    NEW.id,
    NEW.email,
    COALESCE(NEW.raw_user_meta_data->>'full_name', NULL)
  )
  ON CONFLICT (id) DO UPDATE
    SET email = EXCLUDED.email,
        updated_at = now();
  RETURN NEW;
END;
$$;

CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION app.handle_new_auth_user();

-- ---------------------------------------------------------------------------
-- Grant minimal usage to authenticated/anon roles. Detailed table grants
-- happen implicitly through RLS; we just need to allow schema access.
-- ---------------------------------------------------------------------------
GRANT USAGE ON SCHEMA app TO authenticated, anon;
GRANT EXECUTE ON FUNCTION app.current_user_id() TO authenticated, anon;
GRANT EXECUTE ON FUNCTION app.user_org_ids() TO authenticated;
GRANT EXECUTE ON FUNCTION app.is_member_of(uuid) TO authenticated;
GRANT EXECUTE ON FUNCTION app.user_role_in(uuid) TO authenticated;
GRANT EXECUTE ON FUNCTION app.is_super_admin() TO authenticated;
GRANT EXECUTE ON FUNCTION app.is_internal_staff() TO authenticated;
