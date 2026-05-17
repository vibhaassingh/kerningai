-- =============================================================================
-- Migration 0026 — Formal proposals
-- =============================================================================
-- A proposal is the client-facing commercial document derived from a
-- project's workflow canvas (and optionally a solution blueprint):
--   * scope boundaries (in / out / assumptions / dependencies)
--   * phased delivery plan with per-phase pricing
--   * modules in scope + risk register
--   * commercial line items + total
--
-- Multiple proposals can attach to one project (versions). A proposal
-- becomes client-visible once it is `sent`; the client can then accept
-- or decline it. Writes flow through service-role action wrappers.
-- =============================================================================

CREATE TYPE public.proposal_status AS ENUM (
  'draft',
  'internal_review',
  'sent',
  'accepted',
  'declined',
  'expired',
  'archived'
);

CREATE TABLE public.proposals (
  id                uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  project_id        uuid NOT NULL REFERENCES public.projects(id) ON DELETE CASCADE,
  organization_id   uuid REFERENCES public.organizations(id) ON DELETE SET NULL,
  blueprint_id      uuid REFERENCES public.solution_blueprints(id) ON DELETE SET NULL,
  source_canvas_id  uuid REFERENCES public.workflow_canvases(id) ON DELETE SET NULL,
  version           integer NOT NULL DEFAULT 1,
  status            public.proposal_status NOT NULL DEFAULT 'draft',
  title             text NOT NULL,
  summary           text,
  executive_brief   text,
  currency          text NOT NULL DEFAULT 'INR',
  valid_until       date,
  total_amount      numeric(14,2) NOT NULL DEFAULT 0,
  generated_by      text NOT NULL DEFAULT 'canvas_derived'
                      CHECK (generated_by IN ('canvas_derived','manual','llm_enriched')),
  prepared_by_id    uuid REFERENCES public.app_users(id) ON DELETE SET NULL,
  sent_at           timestamptz,
  decided_at        timestamptz,
  decided_by_id     uuid REFERENCES public.app_users(id) ON DELETE SET NULL,
  created_at        timestamptz NOT NULL DEFAULT now(),
  updated_at        timestamptz NOT NULL DEFAULT now(),
  metadata          jsonb NOT NULL DEFAULT '{}'::jsonb,
  UNIQUE (project_id, version)
);

CREATE INDEX idx_proposals_project ON public.proposals (project_id);
CREATE INDEX idx_proposals_status ON public.proposals (status);
CREATE INDEX idx_proposals_org ON public.proposals (organization_id);

CREATE TRIGGER trg_proposals_updated_at
  BEFORE UPDATE ON public.proposals
  FOR EACH ROW EXECUTE FUNCTION app.set_updated_at();

-- ---------------------------------------------------------------------------
-- Delivery phases (mirrors blueprint phases, with optional per-phase price)
-- ---------------------------------------------------------------------------
CREATE TABLE public.proposal_phases (
  id              uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  proposal_id     uuid NOT NULL REFERENCES public.proposals(id) ON DELETE CASCADE,
  position        integer NOT NULL,
  name            text NOT NULL,
  description     text,
  duration_weeks  integer NOT NULL DEFAULT 0,
  owners          text[] NOT NULL DEFAULT ARRAY[]::text[],
  deliverables    text[] NOT NULL DEFAULT ARRAY[]::text[],
  price           numeric(14,2),
  metadata        jsonb NOT NULL DEFAULT '{}'::jsonb,
  UNIQUE (proposal_id, position)
);

CREATE INDEX idx_proposal_phases_proposal ON public.proposal_phases (proposal_id, position);

-- ---------------------------------------------------------------------------
-- Modules in scope
-- ---------------------------------------------------------------------------
CREATE TABLE public.proposal_modules (
  id              uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  proposal_id     uuid NOT NULL REFERENCES public.proposals(id) ON DELETE CASCADE,
  module_slug     text NOT NULL,
  module_name     text NOT NULL,
  rationale       text NOT NULL,
  emphasis        text NOT NULL DEFAULT 'core' CHECK (emphasis IN ('core','recommended','optional')),
  position        integer NOT NULL,
  metadata        jsonb NOT NULL DEFAULT '{}'::jsonb,
  UNIQUE (proposal_id, module_slug)
);

CREATE INDEX idx_proposal_modules_proposal ON public.proposal_modules (proposal_id, position);

-- ---------------------------------------------------------------------------
-- Scope boundaries
-- ---------------------------------------------------------------------------
CREATE TABLE public.proposal_scope_items (
  id              uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  proposal_id     uuid NOT NULL REFERENCES public.proposals(id) ON DELETE CASCADE,
  kind            text NOT NULL CHECK (kind IN ('in_scope','out_of_scope','assumption','dependency')),
  description     text NOT NULL,
  position        integer NOT NULL,
  metadata        jsonb NOT NULL DEFAULT '{}'::jsonb
);

CREATE INDEX idx_proposal_scope_proposal ON public.proposal_scope_items (proposal_id, position);

-- ---------------------------------------------------------------------------
-- Risk register
-- ---------------------------------------------------------------------------
CREATE TABLE public.proposal_risks (
  id              uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  proposal_id     uuid NOT NULL REFERENCES public.proposals(id) ON DELETE CASCADE,
  category        text NOT NULL,
  description     text NOT NULL,
  severity        text NOT NULL CHECK (severity IN ('low','medium','high','critical')),
  mitigation      text,
  position        integer NOT NULL,
  metadata        jsonb NOT NULL DEFAULT '{}'::jsonb
);

CREATE INDEX idx_proposal_risks_proposal ON public.proposal_risks (proposal_id, position);

-- ---------------------------------------------------------------------------
-- Commercial line items
-- ---------------------------------------------------------------------------
CREATE TABLE public.proposal_commercials (
  id              uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  proposal_id     uuid NOT NULL REFERENCES public.proposals(id) ON DELETE CASCADE,
  label           text NOT NULL,
  basis           text NOT NULL DEFAULT 'fixed'
                    CHECK (basis IN ('fixed','time_and_materials','license','subscription','one_time')),
  quantity        numeric(12,2) NOT NULL DEFAULT 1,
  unit_rate       numeric(14,2) NOT NULL DEFAULT 0,
  amount          numeric(14,2) NOT NULL DEFAULT 0,
  notes           text,
  position        integer NOT NULL,
  metadata        jsonb NOT NULL DEFAULT '{}'::jsonb
);

CREATE INDEX idx_proposal_commercials_proposal ON public.proposal_commercials (proposal_id, position);

-- ---------------------------------------------------------------------------
-- RLS
-- ---------------------------------------------------------------------------
-- Internal staff with proposal permission read everything. Client members
-- read a proposal once it leaves internal review (sent / accepted /
-- declined / expired) and is attached to their org. Writes happen via
-- service role through the action wrappers.
-- ---------------------------------------------------------------------------
ALTER TABLE public.proposals ENABLE ROW LEVEL SECURITY;

CREATE POLICY "proposals_internal_read" ON public.proposals
  FOR SELECT
  USING (
    app.is_super_admin()
    OR app.is_internal_staff()
    OR app.has_permission_any('manage_proposals')
  );

CREATE POLICY "proposals_client_read" ON public.proposals
  FOR SELECT
  USING (
    status IN ('sent','accepted','declined','expired')
    AND organization_id IS NOT NULL
    AND app.is_member_of(organization_id)
  );

-- Helper: child rows inherit visibility from their parent proposal.
CREATE OR REPLACE FUNCTION app.proposal_visible(p_proposal_id uuid)
RETURNS boolean
LANGUAGE sql STABLE SECURITY DEFINER
SET search_path = public, app
AS $$
  SELECT EXISTS (
    SELECT 1
    FROM public.proposals p
    WHERE p.id = p_proposal_id
      AND (
        app.is_super_admin()
        OR app.is_internal_staff()
        OR app.has_permission_any('manage_proposals')
        OR (p.status IN ('sent','accepted','declined','expired')
            AND p.organization_id IS NOT NULL
            AND app.is_member_of(p.organization_id))
      )
  )
$$;
GRANT EXECUTE ON FUNCTION app.proposal_visible(uuid) TO authenticated;

ALTER TABLE public.proposal_phases ENABLE ROW LEVEL SECURITY;
CREATE POLICY "proposal_phases_read" ON public.proposal_phases
  FOR SELECT USING (app.proposal_visible(proposal_id));

ALTER TABLE public.proposal_modules ENABLE ROW LEVEL SECURITY;
CREATE POLICY "proposal_modules_read" ON public.proposal_modules
  FOR SELECT USING (app.proposal_visible(proposal_id));

ALTER TABLE public.proposal_scope_items ENABLE ROW LEVEL SECURITY;
CREATE POLICY "proposal_scope_read" ON public.proposal_scope_items
  FOR SELECT USING (app.proposal_visible(proposal_id));

ALTER TABLE public.proposal_risks ENABLE ROW LEVEL SECURITY;
CREATE POLICY "proposal_risks_read" ON public.proposal_risks
  FOR SELECT USING (app.proposal_visible(proposal_id));

ALTER TABLE public.proposal_commercials ENABLE ROW LEVEL SECURITY;
CREATE POLICY "proposal_commercials_read" ON public.proposal_commercials
  FOR SELECT USING (app.proposal_visible(proposal_id));
