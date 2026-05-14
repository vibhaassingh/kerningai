-- =============================================================================
-- Migration 0014 — Agentic workflows
-- =============================================================================
-- The brand-DNA module: human-approved AI agents with a full action
-- ledger. Phase 4a stays read-mostly — recommendations live in the DB,
-- humans approve/reject them, and the action ledger captures the
-- decision. Real agent runners + ingestion land in Phase 4b.
-- =============================================================================

CREATE TYPE public.agent_risk_level AS ENUM (
  'informational',
  'low',
  'operational',
  'requires_approval',
  'critical_approval',
  'blocked'
);

CREATE TYPE public.recommendation_status AS ENUM (
  'pending',
  'approved',
  'rejected',
  'expired',
  'superseded'
);

-- ---------------------------------------------------------------------------
-- Templates — the canonical agent specs we offer
-- ---------------------------------------------------------------------------
CREATE TABLE public.agent_templates (
  slug              text PRIMARY KEY,
  name              text NOT NULL,
  description       text,
  default_risk      public.agent_risk_level NOT NULL DEFAULT 'requires_approval',
  module_slug       text,
  created_at        timestamptz NOT NULL DEFAULT now()
);

INSERT INTO public.agent_templates (slug, name, description, default_risk, module_slug) VALUES
  ('maintenance_forecast',  'Maintenance forecast agent',  'Spots failure patterns from sensor + work-order history and proposes maintenance actions.', 'requires_approval', 'predictive_maintenance'),
  ('energy_optimization',   'Energy optimization agent',   'Watches sub-meter signal vs tariff windows and recommends setpoint or schedule changes.',    'requires_approval', 'energy'),
  ('compliance_variance',   'Compliance variance agent',   'Detects FSMS / temperature / SOP deviations from the audit checklist baseline.',            'requires_approval', 'compliance'),
  ('cold_chain_monitor',    'Cold-chain monitoring agent', 'Watches refrigeration + cold-room logs and flags drift before product is impacted.',        'requires_approval', 'compliance'),
  ('site_triage',           'Site anomaly triage agent',   'Cross-correlates signals across modules and routes the most consequential ones to humans.', 'operational',       'operational_intelligence'),
  ('demand_forecasting',    'Demand forecasting agent',    'Forecasts demand by site/SKU/shift from historical patterns and external signals.',         'low',               'decision_intelligence')
ON CONFLICT (slug) DO NOTHING;

ALTER TABLE public.agent_templates ENABLE ROW LEVEL SECURITY;
CREATE POLICY "agent_templates_authed_read" ON public.agent_templates
  FOR SELECT USING (app.current_user_id() IS NOT NULL);
CREATE POLICY "agent_templates_super_admin_write" ON public.agent_templates
  FOR ALL USING (app.is_super_admin()) WITH CHECK (app.is_super_admin());

-- ---------------------------------------------------------------------------
-- Agent runs — a single execution that produced zero or more recommendations
-- ---------------------------------------------------------------------------
CREATE TABLE public.agent_runs (
  id                uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id   uuid NOT NULL REFERENCES public.organizations(id) ON DELETE CASCADE,
  template_slug     text NOT NULL REFERENCES public.agent_templates(slug),
  triggered_by      text NOT NULL DEFAULT 'schedule',
  started_at        timestamptz NOT NULL DEFAULT now(),
  finished_at       timestamptz,
  status            text NOT NULL DEFAULT 'succeeded' CHECK (status IN ('running','succeeded','failed')),
  metadata          jsonb NOT NULL DEFAULT '{}'::jsonb
);

CREATE INDEX idx_agent_runs_org ON public.agent_runs (organization_id, started_at DESC);
CREATE INDEX idx_agent_runs_template ON public.agent_runs (template_slug);

ALTER TABLE public.agent_runs ENABLE ROW LEVEL SECURITY;
CREATE POLICY "agent_runs_member_read" ON public.agent_runs
  FOR SELECT
  USING (app.is_member_of(organization_id) OR app.is_internal_staff() OR app.is_super_admin());

-- ---------------------------------------------------------------------------
-- Recommendations — what humans approve / reject
-- ---------------------------------------------------------------------------
CREATE TABLE public.agent_recommendations (
  id                uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id   uuid NOT NULL REFERENCES public.organizations(id) ON DELETE CASCADE,
  site_id           uuid REFERENCES public.sites(id) ON DELETE SET NULL,
  asset_id          uuid REFERENCES public.assets(id) ON DELETE SET NULL,
  run_id            uuid REFERENCES public.agent_runs(id) ON DELETE SET NULL,
  template_slug     text NOT NULL REFERENCES public.agent_templates(slug),

  title             text NOT NULL,
  summary           text NOT NULL,
  reasoning         text,
  risk_level        public.agent_risk_level NOT NULL DEFAULT 'requires_approval',
  confidence        numeric(4, 3) CHECK (confidence IS NULL OR (confidence >= 0 AND confidence <= 1)),
  expected_impact   text,
  evidence          jsonb NOT NULL DEFAULT '[]'::jsonb,
  proposed_action   text NOT NULL,

  status            public.recommendation_status NOT NULL DEFAULT 'pending',
  expires_at        timestamptz,
  decided_at        timestamptz,
  decided_by_id     uuid REFERENCES public.app_users(id) ON DELETE SET NULL,
  decision_reason   text,

  created_at        timestamptz NOT NULL DEFAULT now(),
  updated_at        timestamptz NOT NULL DEFAULT now(),
  metadata          jsonb NOT NULL DEFAULT '{}'::jsonb
);

CREATE INDEX idx_recs_org_status ON public.agent_recommendations (organization_id, status, created_at DESC);
CREATE INDEX idx_recs_site ON public.agent_recommendations (site_id);
CREATE INDEX idx_recs_asset ON public.agent_recommendations (asset_id);

CREATE TRIGGER trg_recs_updated_at
  BEFORE UPDATE ON public.agent_recommendations
  FOR EACH ROW EXECUTE FUNCTION app.set_updated_at();

ALTER TABLE public.agent_recommendations ENABLE ROW LEVEL SECURITY;
CREATE POLICY "recs_member_read" ON public.agent_recommendations
  FOR SELECT
  USING (app.is_member_of(organization_id) OR app.is_internal_staff() OR app.is_super_admin());

-- ---------------------------------------------------------------------------
-- Action ledger — append-only record of every decision
-- ---------------------------------------------------------------------------
CREATE TYPE public.agent_action_kind AS ENUM (
  'approved',
  'rejected',
  'requested_changes',
  'manually_overridden',
  'rolled_back'
);

CREATE TABLE public.agent_actions (
  id                uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id   uuid NOT NULL REFERENCES public.organizations(id) ON DELETE CASCADE,
  recommendation_id uuid NOT NULL REFERENCES public.agent_recommendations(id) ON DELETE CASCADE,
  kind              public.agent_action_kind NOT NULL,
  actor_id          uuid REFERENCES public.app_users(id) ON DELETE SET NULL,
  reason            text,
  payload           jsonb NOT NULL DEFAULT '{}'::jsonb,
  created_at        timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX idx_actions_org_created ON public.agent_actions (organization_id, created_at DESC);
CREATE INDEX idx_actions_rec ON public.agent_actions (recommendation_id);

ALTER TABLE public.agent_actions ENABLE ROW LEVEL SECURITY;
CREATE POLICY "actions_member_read" ON public.agent_actions
  FOR SELECT
  USING (app.is_member_of(organization_id) OR app.is_internal_staff() OR app.is_super_admin());
