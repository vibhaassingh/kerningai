-- =============================================================================
-- Migration 0020 — Workflow Canvas + Projects + Partner org type
-- =============================================================================
-- Adds the structured workflow-canvas feature used during client discovery
-- calls, internal scoping, and proposal presentations. Three audiences edit
-- and consume the same canvases through different lenses (internal admin
-- edits, client reviews shared versions, partner sees a redacted summary).
--
-- Schema additions:
--   * `partner` value added to org_type enum
--   * three partner roles + new permissions for canvas + projects
--   * `projects` table — 1 client → many projects, 1 project → many canvases
--   * `workflow_canvases` + nodes/edges/versions/comments
--   * `app.is_partner_for_project()` and `app.canvas_visible()` helpers
--
-- ALTER TYPE ADD VALUE works inside a transaction in PG 12+ as long as the
-- new value isn't referenced in the same transaction. We add 'partner' here
-- but only seed partner orgs in migration 0021.
-- =============================================================================

-- ---------------------------------------------------------------------------
-- 1. Org type expansion
-- ---------------------------------------------------------------------------
ALTER TYPE public.org_type ADD VALUE IF NOT EXISTS 'partner';

-- ---------------------------------------------------------------------------
-- 2. New permissions
-- ---------------------------------------------------------------------------
INSERT INTO public.permissions (slug, name, category, description) VALUES
  -- Projects
  ('view_projects',                  'View projects',                  'projects',  'Read project records.'),
  ('manage_projects',                'Manage projects',                'projects',  'Create, edit, archive projects.'),

  -- Workflow canvas
  ('view_workflow_canvas',           'View workflow canvas',           'workflow',  'Read workflow canvases scoped by visibility.'),
  ('manage_workflow_canvas',         'Manage workflow canvas',         'workflow',  'Create, edit, share, snapshot canvases.'),
  ('share_workflow_canvas',          'Share workflow canvas',          'workflow',  'Mark canvases as client-ready or partner-visible.'),
  ('manage_workflow_versions',       'Manage workflow versions',       'workflow',  'Save versions, restore prior versions.'),
  ('comment_on_workflow_canvas',     'Comment on workflow canvas',     'workflow',  'Add and resolve comments on nodes/edges.'),

  -- Partner portal
  ('view_partner_dashboard',         'View partner dashboard',         'partner',   'Access the partner portal landing.'),
  ('submit_partner_lead',            'Submit partner lead',            'partner',   'Submit new leads on behalf of clients.'),
  ('view_partner_projects',          'View partner projects',          'partner',   'Read projects where this org is the referring partner.'),
  ('view_partner_workflow_summary',  'View partner workflow summary',  'partner',   'Read partner-redacted workflow summaries.')
ON CONFLICT (slug) DO NOTHING;

-- ---------------------------------------------------------------------------
-- 3. Partner roles
-- ---------------------------------------------------------------------------
INSERT INTO public.roles (slug, name, description, scope, rank) VALUES
  ('partner_owner',   'Partner Owner',   'Manages partner org, invites teammates, submits leads, views projects.', 'both', 100),
  ('partner_user',    'Partner User',    'Submits leads, views projects.',                                          'both', 60),
  ('partner_viewer',  'Partner Viewer',  'Read-only access to referred projects and workflow summaries.',           'both', 30)
ON CONFLICT (slug) DO NOTHING;

-- ---------------------------------------------------------------------------
-- 4. Grant matrix updates
-- ---------------------------------------------------------------------------
-- Internal: super_admin, founder_leadership, operations_admin get everything
INSERT INTO public.role_permissions (role_slug, permission_slug)
SELECT r, p FROM (VALUES
  ('super_admin'),
  ('founder_leadership'),
  ('operations_admin')
) AS roles(r), (VALUES
  ('view_projects'),
  ('manage_projects'),
  ('view_workflow_canvas'),
  ('manage_workflow_canvas'),
  ('share_workflow_canvas'),
  ('manage_workflow_versions'),
  ('comment_on_workflow_canvas')
) AS perms(p)
ON CONFLICT DO NOTHING;

-- Other internal roles get read + comment on canvas
INSERT INTO public.role_permissions (role_slug, permission_slug)
SELECT r, p FROM (VALUES
  ('sales_admin'),
  ('client_success_manager'),
  ('deployment_manager'),
  ('data_engineer'),
  ('ai_ml_engineer')
) AS roles(r), (VALUES
  ('view_projects'),
  ('view_workflow_canvas'),
  ('comment_on_workflow_canvas')
) AS perms(p)
ON CONFLICT DO NOTHING;

-- Sales admin can also create projects + manage canvas drafts
INSERT INTO public.role_permissions (role_slug, permission_slug) VALUES
  ('sales_admin', 'manage_projects'),
  ('sales_admin', 'manage_workflow_canvas'),
  ('sales_admin', 'manage_workflow_versions'),
  ('client_success_manager', 'manage_workflow_canvas'),
  ('client_success_manager', 'manage_workflow_versions')
ON CONFLICT DO NOTHING;

-- Read-only auditor (internal) — read everything
INSERT INTO public.role_permissions (role_slug, permission_slug) VALUES
  ('read_only_auditor', 'view_projects'),
  ('read_only_auditor', 'view_workflow_canvas')
ON CONFLICT DO NOTHING;

-- Client roles: client_owner, executive_cfo, site_director can read + comment
INSERT INTO public.role_permissions (role_slug, permission_slug)
SELECT r, p FROM (VALUES
  ('client_owner'),
  ('executive_cfo'),
  ('site_director')
) AS roles(r), (VALUES
  ('view_projects'),
  ('view_workflow_canvas'),
  ('comment_on_workflow_canvas')
) AS perms(p)
ON CONFLICT DO NOTHING;

-- Other client roles read only
INSERT INTO public.role_permissions (role_slug, permission_slug)
SELECT r, p FROM (VALUES
  ('site_manager'),
  ('operations_manager'),
  ('maintenance_manager'),
  ('it_admin'),
  ('read_only_auditor_client')
) AS roles(r), (VALUES
  ('view_projects'),
  ('view_workflow_canvas')
) AS perms(p)
ON CONFLICT DO NOTHING;

-- Partner roles
INSERT INTO public.role_permissions (role_slug, permission_slug) VALUES
  ('partner_owner',  'view_partner_dashboard'),
  ('partner_owner',  'submit_partner_lead'),
  ('partner_owner',  'view_partner_projects'),
  ('partner_owner',  'view_partner_workflow_summary'),
  ('partner_owner',  'view_workflow_canvas'),
  ('partner_owner',  'view_projects'),
  ('partner_owner',  'manage_users'),

  ('partner_user',   'view_partner_dashboard'),
  ('partner_user',   'submit_partner_lead'),
  ('partner_user',   'view_partner_projects'),
  ('partner_user',   'view_partner_workflow_summary'),
  ('partner_user',   'view_workflow_canvas'),
  ('partner_user',   'view_projects'),

  ('partner_viewer', 'view_partner_dashboard'),
  ('partner_viewer', 'view_partner_projects'),
  ('partner_viewer', 'view_partner_workflow_summary'),
  ('partner_viewer', 'view_workflow_canvas'),
  ('partner_viewer', 'view_projects')
ON CONFLICT DO NOTHING;

-- ---------------------------------------------------------------------------
-- 5. Projects
-- ---------------------------------------------------------------------------
CREATE TYPE public.project_status AS ENUM
  ('discovery', 'proposal', 'implementation', 'live', 'archived', 'on_hold');

CREATE TABLE public.projects (
  id                          uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id             uuid NOT NULL REFERENCES public.organizations(id) ON DELETE CASCADE,
  partner_org_id              uuid REFERENCES public.organizations(id) ON DELETE SET NULL,
  partner_visible_to_client   boolean NOT NULL DEFAULT false,
  blueprint_id                uuid REFERENCES public.solution_blueprints(id) ON DELETE SET NULL,
  lead_id                     uuid REFERENCES public.leads(id) ON DELETE SET NULL,
  name                        text NOT NULL,
  slug                        text NOT NULL,
  description                 text,
  status                      public.project_status NOT NULL DEFAULT 'discovery',
  industry_label              text,
  business_label              text,
  badges                      text[] NOT NULL DEFAULT ARRAY[]::text[],
  created_by_id               uuid REFERENCES public.app_users(id),
  updated_by_id               uuid REFERENCES public.app_users(id),
  created_at                  timestamptz NOT NULL DEFAULT now(),
  updated_at                  timestamptz NOT NULL DEFAULT now(),
  deleted_at                  timestamptz,
  metadata                    jsonb NOT NULL DEFAULT '{}'::jsonb,
  UNIQUE (organization_id, slug)
);

CREATE INDEX idx_projects_org ON public.projects (organization_id);
CREATE INDEX idx_projects_partner ON public.projects (partner_org_id);
CREATE INDEX idx_projects_status ON public.projects (status);
CREATE INDEX idx_projects_blueprint ON public.projects (blueprint_id);

CREATE TRIGGER trg_projects_updated_at
  BEFORE UPDATE ON public.projects
  FOR EACH ROW EXECUTE FUNCTION app.set_updated_at();

-- ---------------------------------------------------------------------------
-- 6. Workflow canvas — types
-- ---------------------------------------------------------------------------
CREATE TYPE public.canvas_visibility AS ENUM
  ('internal_only', 'partner_visible', 'client_visible', 'shared_all');

CREATE TYPE public.canvas_status AS ENUM
  ('draft', 'internal_review', 'client_ready', 'shared_with_client', 'approved', 'archived');

CREATE TYPE public.canvas_type AS ENUM
  ('current_manual', 'proposed_erp', 'erp_ai', 'combined', 'module_mapping');

CREATE TYPE public.canvas_node_type AS ENUM
  ('process', 'approval', 'document', 'data', 'pain_point',
   'ai', 'erp_module', 'decision', 'external_actor', 'system');

CREATE TYPE public.canvas_node_phase AS ENUM
  ('current_manual', 'proposed_erp', 'erp_ai', 'module_mapping');

CREATE TYPE public.canvas_department AS ENUM
  ('management', 'accounts', 'commercial', 'sales', 'depot_godown',
   'head_office', 'driver_transporter', 'partner', 'client', 'system', 'ai_layer');

CREATE TYPE public.canvas_edge_type AS ENUM
  ('normal', 'approval', 'document_flow', 'data_flow',
   'exception', 'ai_assisted', 'system_automation');

-- ---------------------------------------------------------------------------
-- 7. Workflow canvases
-- ---------------------------------------------------------------------------
CREATE TABLE public.workflow_canvases (
  id                          uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id             uuid NOT NULL REFERENCES public.organizations(id) ON DELETE CASCADE,
  project_id                  uuid NOT NULL REFERENCES public.projects(id) ON DELETE CASCADE,
  blueprint_id                uuid REFERENCES public.solution_blueprints(id) ON DELETE SET NULL,
  template_slug               text,
  title                       text NOT NULL,
  subtitle                    text,
  description                 text,
  canvas_type                 public.canvas_type NOT NULL DEFAULT 'combined',
  status                      public.canvas_status NOT NULL DEFAULT 'draft',
  visibility                  public.canvas_visibility NOT NULL DEFAULT 'internal_only',
  viewport                    jsonb NOT NULL DEFAULT '{"x":0,"y":0,"zoom":1}'::jsonb,
  version                     integer NOT NULL DEFAULT 1,
  badges                      text[] NOT NULL DEFAULT ARRAY[]::text[],
  created_by_id               uuid REFERENCES public.app_users(id),
  updated_by_id               uuid REFERENCES public.app_users(id),
  shared_with_client_at       timestamptz,
  shared_with_partner_at      timestamptz,
  created_at                  timestamptz NOT NULL DEFAULT now(),
  updated_at                  timestamptz NOT NULL DEFAULT now(),
  metadata                    jsonb NOT NULL DEFAULT '{}'::jsonb
);

CREATE INDEX idx_canvases_org ON public.workflow_canvases (organization_id);
CREATE INDEX idx_canvases_project ON public.workflow_canvases (project_id);
CREATE INDEX idx_canvases_status ON public.workflow_canvases (status);
CREATE INDEX idx_canvases_visibility ON public.workflow_canvases (visibility);

CREATE TRIGGER trg_canvases_updated_at
  BEFORE UPDATE ON public.workflow_canvases
  FOR EACH ROW EXECUTE FUNCTION app.set_updated_at();

-- ---------------------------------------------------------------------------
-- 8. Workflow canvas nodes
-- ---------------------------------------------------------------------------
CREATE TABLE public.workflow_canvas_nodes (
  id                          uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  canvas_id                   uuid NOT NULL REFERENCES public.workflow_canvases(id) ON DELETE CASCADE,
  node_key                    text NOT NULL,
  node_type                   public.canvas_node_type NOT NULL,
  phase                       public.canvas_node_phase NOT NULL,
  department                  public.canvas_department,
  visibility                  public.canvas_visibility NOT NULL DEFAULT 'internal_only',
  title                       text NOT NULL,
  short_label                 text,
  description                 text,
  actors                      text[] NOT NULL DEFAULT ARRAY[]::text[],
  current_process             text,
  proposed_process            text,
  ai_opportunity              text,
  pain_points                 text[] NOT NULL DEFAULT ARRAY[]::text[],
  erp_modules                 text[] NOT NULL DEFAULT ARRAY[]::text[],
  documents                   text[] NOT NULL DEFAULT ARRAY[]::text[],
  data_captured               text[] NOT NULL DEFAULT ARRAY[]::text[],
  risk_level                  text CHECK (risk_level IN ('low','medium','high')),
  automation_potential        text CHECK (automation_potential IN ('low','medium','high')),
  internal_notes              text,
  client_notes                text,
  position_x                  double precision NOT NULL DEFAULT 0,
  position_y                  double precision NOT NULL DEFAULT 0,
  metadata                    jsonb NOT NULL DEFAULT '{}'::jsonb,
  created_at                  timestamptz NOT NULL DEFAULT now(),
  updated_at                  timestamptz NOT NULL DEFAULT now(),
  UNIQUE (canvas_id, node_key)
);

CREATE INDEX idx_canvas_nodes_canvas ON public.workflow_canvas_nodes (canvas_id);
CREATE INDEX idx_canvas_nodes_phase ON public.workflow_canvas_nodes (canvas_id, phase);
CREATE INDEX idx_canvas_nodes_visibility ON public.workflow_canvas_nodes (visibility);

CREATE TRIGGER trg_canvas_nodes_updated_at
  BEFORE UPDATE ON public.workflow_canvas_nodes
  FOR EACH ROW EXECUTE FUNCTION app.set_updated_at();

-- ---------------------------------------------------------------------------
-- 9. Workflow canvas edges
-- ---------------------------------------------------------------------------
CREATE TABLE public.workflow_canvas_edges (
  id                          uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  canvas_id                   uuid NOT NULL REFERENCES public.workflow_canvases(id) ON DELETE CASCADE,
  edge_key                    text NOT NULL,
  source_node_key             text NOT NULL,
  target_node_key             text NOT NULL,
  edge_type                   public.canvas_edge_type NOT NULL DEFAULT 'normal',
  phase                       public.canvas_node_phase NOT NULL,
  visibility                  public.canvas_visibility NOT NULL DEFAULT 'internal_only',
  label                       text,
  condition                   text,
  metadata                    jsonb NOT NULL DEFAULT '{}'::jsonb,
  created_at                  timestamptz NOT NULL DEFAULT now(),
  UNIQUE (canvas_id, edge_key)
);

CREATE INDEX idx_canvas_edges_canvas ON public.workflow_canvas_edges (canvas_id);
CREATE INDEX idx_canvas_edges_phase ON public.workflow_canvas_edges (canvas_id, phase);

-- ---------------------------------------------------------------------------
-- 10. Workflow canvas versions
-- ---------------------------------------------------------------------------
CREATE TABLE public.workflow_canvas_versions (
  id                          uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  canvas_id                   uuid NOT NULL REFERENCES public.workflow_canvases(id) ON DELETE CASCADE,
  version                     integer NOT NULL,
  title                       text NOT NULL,
  snapshot                    jsonb NOT NULL,
  change_summary              text,
  created_by_id               uuid REFERENCES public.app_users(id),
  created_at                  timestamptz NOT NULL DEFAULT now(),
  UNIQUE (canvas_id, version)
);

CREATE INDEX idx_canvas_versions_canvas ON public.workflow_canvas_versions (canvas_id, version DESC);

-- ---------------------------------------------------------------------------
-- 11. Workflow canvas comments
-- ---------------------------------------------------------------------------
CREATE TABLE public.workflow_canvas_comments (
  id                          uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  canvas_id                   uuid NOT NULL REFERENCES public.workflow_canvases(id) ON DELETE CASCADE,
  node_key                    text,
  edge_key                    text,
  user_id                     uuid NOT NULL REFERENCES public.app_users(id) ON DELETE CASCADE,
  body                        text NOT NULL,
  visibility                  public.canvas_visibility NOT NULL DEFAULT 'internal_only',
  status                      text NOT NULL DEFAULT 'open' CHECK (status IN ('open','resolved')),
  created_at                  timestamptz NOT NULL DEFAULT now(),
  updated_at                  timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX idx_canvas_comments_canvas ON public.workflow_canvas_comments (canvas_id);
CREATE INDEX idx_canvas_comments_node ON public.workflow_canvas_comments (canvas_id, node_key);

CREATE TRIGGER trg_canvas_comments_updated_at
  BEFORE UPDATE ON public.workflow_canvas_comments
  FOR EACH ROW EXECUTE FUNCTION app.set_updated_at();

-- ---------------------------------------------------------------------------
-- 12. Tenancy helpers — partner-for-project + canvas visibility
-- ---------------------------------------------------------------------------
-- True if the current user is an active member of the partner org that
-- referred the given project.
CREATE OR REPLACE FUNCTION app.is_partner_for_project(p_project_id uuid)
RETURNS boolean
LANGUAGE sql STABLE SECURITY DEFINER
SET search_path = public, app
AS $$
  SELECT EXISTS (
    SELECT 1
    FROM public.projects p
    JOIN public.organization_memberships m
      ON m.organization_id = p.partner_org_id
    WHERE p.id = p_project_id
      AND p.partner_org_id IS NOT NULL
      AND m.user_id = app.current_user_id()
      AND m.status = 'active'
  )
$$;

GRANT EXECUTE ON FUNCTION app.is_partner_for_project(uuid) TO authenticated;

-- Canvas visibility helper used by RLS on child tables (nodes/edges/comments).
-- Returns true when the current user can read the parent canvas at all.
-- Audience-level filtering of node/edge content (which fields to redact)
-- happens additionally in TypeScript at lib/workflow-canvas/visibility.ts.
CREATE OR REPLACE FUNCTION app.canvas_visible(p_canvas_id uuid)
RETURNS boolean
LANGUAGE sql STABLE SECURITY DEFINER
SET search_path = public, app
AS $$
  SELECT EXISTS (
    SELECT 1
    FROM public.workflow_canvases c
    WHERE c.id = p_canvas_id
      AND (
        app.is_super_admin()
        OR app.is_internal_staff()
        OR (
          c.visibility IN ('client_visible','shared_all')
          AND c.status IN ('client_ready','shared_with_client','approved')
          AND app.is_member_of(c.organization_id)
        )
        OR (
          c.visibility IN ('partner_visible','shared_all')
          AND c.status IN ('shared_with_client','approved')
          AND app.is_partner_for_project(c.project_id)
        )
      )
  )
$$;

GRANT EXECUTE ON FUNCTION app.canvas_visible(uuid) TO authenticated;

-- ---------------------------------------------------------------------------
-- 13. RLS — projects
-- ---------------------------------------------------------------------------
ALTER TABLE public.projects ENABLE ROW LEVEL SECURITY;

CREATE POLICY "projects_internal_read" ON public.projects
  FOR SELECT
  USING (
    app.is_super_admin()
    OR app.is_internal_staff()
    OR app.has_permission_any('view_projects')
  );

CREATE POLICY "projects_client_read" ON public.projects
  FOR SELECT
  USING (
    app.is_member_of(organization_id)
  );

CREATE POLICY "projects_partner_read" ON public.projects
  FOR SELECT
  USING (
    partner_org_id IS NOT NULL
    AND app.is_member_of(partner_org_id)
  );

-- ---------------------------------------------------------------------------
-- 14. RLS — workflow canvases
-- ---------------------------------------------------------------------------
ALTER TABLE public.workflow_canvases ENABLE ROW LEVEL SECURITY;

CREATE POLICY "canvases_read" ON public.workflow_canvases
  FOR SELECT
  USING (
    app.is_super_admin()
    OR app.is_internal_staff()
    OR (
      visibility IN ('client_visible','shared_all')
      AND status IN ('client_ready','shared_with_client','approved')
      AND app.is_member_of(organization_id)
    )
    OR (
      visibility IN ('partner_visible','shared_all')
      AND status IN ('shared_with_client','approved')
      AND app.is_partner_for_project(project_id)
    )
  );

ALTER TABLE public.workflow_canvas_nodes ENABLE ROW LEVEL SECURITY;
CREATE POLICY "canvas_nodes_read" ON public.workflow_canvas_nodes
  FOR SELECT USING (app.canvas_visible(canvas_id));

ALTER TABLE public.workflow_canvas_edges ENABLE ROW LEVEL SECURITY;
CREATE POLICY "canvas_edges_read" ON public.workflow_canvas_edges
  FOR SELECT USING (app.canvas_visible(canvas_id));

ALTER TABLE public.workflow_canvas_versions ENABLE ROW LEVEL SECURITY;
CREATE POLICY "canvas_versions_read" ON public.workflow_canvas_versions
  FOR SELECT
  USING (
    app.is_super_admin()
    OR app.is_internal_staff()
  );

ALTER TABLE public.workflow_canvas_comments ENABLE ROW LEVEL SECURITY;
CREATE POLICY "canvas_comments_read" ON public.workflow_canvas_comments
  FOR SELECT
  USING (
    app.canvas_visible(canvas_id)
    AND (
      app.is_super_admin()
      OR app.is_internal_staff()
      OR visibility IN ('client_visible','shared_all','partner_visible')
    )
  );

-- ---------------------------------------------------------------------------
-- 15. Partner-side lead visibility
-- ---------------------------------------------------------------------------
-- Partners can read leads they referred. The link is metadata->>'partner_org_id'.
-- Partners cannot edit leads — only internal staff can.
CREATE POLICY "leads_partner_read" ON public.leads
  FOR SELECT
  USING (
    metadata->>'partner_org_id' IS NOT NULL
    AND app.is_member_of((metadata->>'partner_org_id')::uuid)
  );
