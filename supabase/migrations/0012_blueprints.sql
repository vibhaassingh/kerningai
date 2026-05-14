-- =============================================================================
-- Migration 0012 — Solution blueprints
-- =============================================================================
-- A blueprint is the structured output of reviewing a submission:
--   * complexity score
--   * recommended modules with rationale
--   * implementation phase plan
--   * integration map
--   * risk register
--   * onboarding checklist
--
-- Multiple blueprints can attach to one submission (versions). Only one
-- per submission is `approved_for_client` at a time — that's the version
-- shown in the portal once a lead converts to a client.
-- =============================================================================

CREATE TYPE public.blueprint_status AS ENUM (
  'draft',
  'needs_internal_review',
  'approved_for_client',
  'archived'
);

CREATE TABLE public.solution_blueprints (
  id                uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  submission_id     uuid NOT NULL REFERENCES public.questionnaire_submissions(id) ON DELETE CASCADE,
  organization_id   uuid REFERENCES public.organizations(id) ON DELETE SET NULL,
  version           integer NOT NULL DEFAULT 1,
  status            public.blueprint_status NOT NULL DEFAULT 'draft',
  complexity_score  integer NOT NULL DEFAULT 0 CHECK (complexity_score >= 0 AND complexity_score <= 100),
  complexity_band   text NOT NULL DEFAULT 'low' CHECK (complexity_band IN ('low','medium','high','very_high')),
  summary           text,
  executive_brief   text,
  generated_by      text NOT NULL DEFAULT 'rule_based' CHECK (generated_by IN ('rule_based','llm_enriched','manual')),
  generated_at      timestamptz NOT NULL DEFAULT now(),
  approved_at       timestamptz,
  approved_by_id    uuid REFERENCES public.app_users(id) ON DELETE SET NULL,
  created_at        timestamptz NOT NULL DEFAULT now(),
  updated_at        timestamptz NOT NULL DEFAULT now(),
  metadata          jsonb NOT NULL DEFAULT '{}'::jsonb,
  UNIQUE (submission_id, version)
);

CREATE INDEX idx_blueprints_submission ON public.solution_blueprints (submission_id);
CREATE INDEX idx_blueprints_status ON public.solution_blueprints (status);
CREATE INDEX idx_blueprints_org ON public.solution_blueprints (organization_id);

CREATE TRIGGER trg_blueprints_updated_at
  BEFORE UPDATE ON public.solution_blueprints
  FOR EACH ROW EXECUTE FUNCTION app.set_updated_at();

-- ---------------------------------------------------------------------------
-- Recommended modules
-- ---------------------------------------------------------------------------
CREATE TABLE public.blueprint_modules (
  id              uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  blueprint_id    uuid NOT NULL REFERENCES public.solution_blueprints(id) ON DELETE CASCADE,
  module_slug     text NOT NULL,
  module_name     text NOT NULL,
  rationale       text NOT NULL,
  position        integer NOT NULL,
  emphasis        text NOT NULL DEFAULT 'core' CHECK (emphasis IN ('core','recommended','optional')),
  metadata        jsonb NOT NULL DEFAULT '{}'::jsonb,
  UNIQUE (blueprint_id, module_slug)
);

CREATE INDEX idx_bp_modules_blueprint ON public.blueprint_modules (blueprint_id, position);

-- ---------------------------------------------------------------------------
-- Integrations
-- ---------------------------------------------------------------------------
CREATE TABLE public.blueprint_integrations (
  id              uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  blueprint_id    uuid NOT NULL REFERENCES public.solution_blueprints(id) ON DELETE CASCADE,
  system          text NOT NULL,
  direction       text NOT NULL CHECK (direction IN ('read','write','bidirectional')),
  frequency       text NOT NULL CHECK (frequency IN ('realtime','minutes','hourly','daily','weekly','manual')),
  risk            text NOT NULL CHECK (risk IN ('low','medium','high')),
  notes           text,
  position        integer NOT NULL,
  metadata        jsonb NOT NULL DEFAULT '{}'::jsonb
);

CREATE INDEX idx_bp_integrations_blueprint ON public.blueprint_integrations (blueprint_id, position);

-- ---------------------------------------------------------------------------
-- Risks
-- ---------------------------------------------------------------------------
CREATE TABLE public.blueprint_risks (
  id              uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  blueprint_id    uuid NOT NULL REFERENCES public.solution_blueprints(id) ON DELETE CASCADE,
  category        text NOT NULL,
  description     text NOT NULL,
  severity        text NOT NULL CHECK (severity IN ('low','medium','high','critical')),
  mitigation      text,
  position        integer NOT NULL,
  metadata        jsonb NOT NULL DEFAULT '{}'::jsonb
);

CREATE INDEX idx_bp_risks_blueprint ON public.blueprint_risks (blueprint_id, position);

-- ---------------------------------------------------------------------------
-- Implementation phases
-- ---------------------------------------------------------------------------
CREATE TABLE public.blueprint_phases (
  id              uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  blueprint_id    uuid NOT NULL REFERENCES public.solution_blueprints(id) ON DELETE CASCADE,
  position        integer NOT NULL,
  name            text NOT NULL,
  description     text,
  duration_weeks  integer NOT NULL DEFAULT 0,
  owners          text[] NOT NULL DEFAULT ARRAY[]::text[],
  deliverables    text[] NOT NULL DEFAULT ARRAY[]::text[],
  metadata        jsonb NOT NULL DEFAULT '{}'::jsonb
);

CREATE INDEX idx_bp_phases_blueprint ON public.blueprint_phases (blueprint_id, position);

-- ---------------------------------------------------------------------------
-- Onboarding checklist
-- ---------------------------------------------------------------------------
CREATE TABLE public.blueprint_checklist_items (
  id              uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  blueprint_id    uuid NOT NULL REFERENCES public.solution_blueprints(id) ON DELETE CASCADE,
  category        text NOT NULL,
  description     text NOT NULL,
  owner           text NOT NULL CHECK (owner IN ('kerning','client','joint')),
  position        integer NOT NULL,
  metadata        jsonb NOT NULL DEFAULT '{}'::jsonb
);

CREATE INDEX idx_bp_checklist_blueprint ON public.blueprint_checklist_items (blueprint_id, position);

-- ---------------------------------------------------------------------------
-- RLS
-- ---------------------------------------------------------------------------
-- Internal staff with review permission can read everything.
-- Client members can read blueprints that are approved AND attached to
-- their org.
-- Writes happen via service role through the action wrappers.
-- ---------------------------------------------------------------------------
ALTER TABLE public.solution_blueprints ENABLE ROW LEVEL SECURITY;

CREATE POLICY "blueprints_internal_read" ON public.solution_blueprints
  FOR SELECT
  USING (
    app.is_super_admin()
    OR app.is_internal_staff()
    OR app.has_permission_any('review_questionnaire_submissions')
  );

CREATE POLICY "blueprints_client_read" ON public.solution_blueprints
  FOR SELECT
  USING (
    status = 'approved_for_client'
    AND organization_id IS NOT NULL
    AND app.is_member_of(organization_id)
  );

-- Helper: child rows inherit visibility from their parent blueprint.
CREATE OR REPLACE FUNCTION app.blueprint_visible(p_blueprint_id uuid)
RETURNS boolean
LANGUAGE sql STABLE SECURITY DEFINER
SET search_path = public, app
AS $$
  SELECT EXISTS (
    SELECT 1
    FROM public.solution_blueprints b
    WHERE b.id = p_blueprint_id
      AND (
        app.is_super_admin()
        OR app.is_internal_staff()
        OR (b.status = 'approved_for_client'
            AND b.organization_id IS NOT NULL
            AND app.is_member_of(b.organization_id))
      )
  )
$$;
GRANT EXECUTE ON FUNCTION app.blueprint_visible(uuid) TO authenticated;

ALTER TABLE public.blueprint_modules ENABLE ROW LEVEL SECURITY;
CREATE POLICY "bp_modules_read" ON public.blueprint_modules
  FOR SELECT USING (app.blueprint_visible(blueprint_id));

ALTER TABLE public.blueprint_integrations ENABLE ROW LEVEL SECURITY;
CREATE POLICY "bp_integrations_read" ON public.blueprint_integrations
  FOR SELECT USING (app.blueprint_visible(blueprint_id));

ALTER TABLE public.blueprint_risks ENABLE ROW LEVEL SECURITY;
CREATE POLICY "bp_risks_read" ON public.blueprint_risks
  FOR SELECT USING (app.blueprint_visible(blueprint_id));

ALTER TABLE public.blueprint_phases ENABLE ROW LEVEL SECURITY;
CREATE POLICY "bp_phases_read" ON public.blueprint_phases
  FOR SELECT USING (app.blueprint_visible(blueprint_id));

ALTER TABLE public.blueprint_checklist_items ENABLE ROW LEVEL SECURITY;
CREATE POLICY "bp_checklist_read" ON public.blueprint_checklist_items
  FOR SELECT USING (app.blueprint_visible(blueprint_id));
