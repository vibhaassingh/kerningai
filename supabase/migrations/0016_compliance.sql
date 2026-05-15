-- =============================================================================
-- Migration 0016 — Hygiene, safety & compliance
-- =============================================================================

CREATE TYPE public.audit_run_status AS ENUM ('scheduled','in_progress','passed','flagged','overdue');
CREATE TYPE public.corrective_status AS ENUM ('open','in_progress','blocked','closed');
CREATE TYPE public.incident_severity AS ENUM ('low','medium','high','critical');

-- ---------------------------------------------------------------------------
-- Compliance frameworks (catalogue)
-- ---------------------------------------------------------------------------
CREATE TABLE public.compliance_frameworks (
  slug            text PRIMARY KEY,
  name            text NOT NULL,
  description     text,
  created_at      timestamptz NOT NULL DEFAULT now()
);

INSERT INTO public.compliance_frameworks (slug, name, description) VALUES
  ('fsms_iso22000',   'FSMS · ISO 22000',         'Food safety management baseline.'),
  ('haccp',           'HACCP',                    'Hazard analysis and critical control points.'),
  ('iso9001',         'ISO 9001',                 'Quality management system.'),
  ('gmp',             'GMP',                      'Good manufacturing practice.'),
  ('local_regulation','Local regulation',         'Site-specific regulatory checklist.')
ON CONFLICT (slug) DO NOTHING;

ALTER TABLE public.compliance_frameworks ENABLE ROW LEVEL SECURITY;
CREATE POLICY "frameworks_authed_read" ON public.compliance_frameworks
  FOR SELECT USING (app.current_user_id() IS NOT NULL);
CREATE POLICY "frameworks_super_admin_write" ON public.compliance_frameworks
  FOR ALL USING (app.is_super_admin()) WITH CHECK (app.is_super_admin());

-- ---------------------------------------------------------------------------
-- Audit runs — scheduled audits + their outcomes
-- ---------------------------------------------------------------------------
CREATE TABLE public.audit_runs (
  id                uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id   uuid NOT NULL REFERENCES public.organizations(id) ON DELETE CASCADE,
  site_id           uuid REFERENCES public.sites(id) ON DELETE SET NULL,
  framework_slug    text REFERENCES public.compliance_frameworks(slug),
  name              text NOT NULL,
  scheduled_for     date NOT NULL,
  status            public.audit_run_status NOT NULL DEFAULT 'scheduled',
  completed_at      timestamptz,
  score             integer CHECK (score IS NULL OR (score >= 0 AND score <= 100)),
  notes             text,
  metadata          jsonb NOT NULL DEFAULT '{}'::jsonb,
  created_at        timestamptz NOT NULL DEFAULT now(),
  updated_at        timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX idx_audit_runs_org_date ON public.audit_runs (organization_id, scheduled_for DESC);

CREATE TRIGGER trg_audit_runs_updated_at
  BEFORE UPDATE ON public.audit_runs
  FOR EACH ROW EXECUTE FUNCTION app.set_updated_at();

ALTER TABLE public.audit_runs ENABLE ROW LEVEL SECURITY;
CREATE POLICY "audit_runs_member_read" ON public.audit_runs
  FOR SELECT USING (app.is_member_of(organization_id) OR app.is_internal_staff() OR app.is_super_admin());

-- ---------------------------------------------------------------------------
-- Audit findings — individual non-conformances within a run
-- ---------------------------------------------------------------------------
CREATE TABLE public.audit_findings (
  id              uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id uuid NOT NULL REFERENCES public.organizations(id) ON DELETE CASCADE,
  audit_run_id    uuid NOT NULL REFERENCES public.audit_runs(id) ON DELETE CASCADE,
  severity        public.incident_severity NOT NULL,
  description     text NOT NULL,
  created_at      timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX idx_findings_run ON public.audit_findings (audit_run_id);

ALTER TABLE public.audit_findings ENABLE ROW LEVEL SECURITY;
CREATE POLICY "findings_member_read" ON public.audit_findings
  FOR SELECT USING (app.is_member_of(organization_id) OR app.is_internal_staff() OR app.is_super_admin());

-- ---------------------------------------------------------------------------
-- Corrective actions
-- ---------------------------------------------------------------------------
CREATE TABLE public.corrective_actions (
  id              uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id uuid NOT NULL REFERENCES public.organizations(id) ON DELETE CASCADE,
  site_id         uuid REFERENCES public.sites(id) ON DELETE SET NULL,
  finding_id      uuid REFERENCES public.audit_findings(id) ON DELETE SET NULL,
  title           text NOT NULL,
  description     text,
  owner_id        uuid REFERENCES public.app_users(id) ON DELETE SET NULL,
  status          public.corrective_status NOT NULL DEFAULT 'open',
  due_at          date,
  closed_at       timestamptz,
  created_at      timestamptz NOT NULL DEFAULT now(),
  updated_at      timestamptz NOT NULL DEFAULT now(),
  metadata        jsonb NOT NULL DEFAULT '{}'::jsonb
);

CREATE INDEX idx_corrective_org_status ON public.corrective_actions (organization_id, status);

CREATE TRIGGER trg_corrective_updated_at
  BEFORE UPDATE ON public.corrective_actions
  FOR EACH ROW EXECUTE FUNCTION app.set_updated_at();

ALTER TABLE public.corrective_actions ENABLE ROW LEVEL SECURITY;
CREATE POLICY "corrective_member_read" ON public.corrective_actions
  FOR SELECT USING (app.is_member_of(organization_id) OR app.is_internal_staff() OR app.is_super_admin());

-- ---------------------------------------------------------------------------
-- Temperature logs — cold chain integrity (Phase 4b: daily aggregates only)
-- ---------------------------------------------------------------------------
CREATE TABLE public.temperature_logs (
  id              uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id uuid NOT NULL REFERENCES public.organizations(id) ON DELETE CASCADE,
  site_id         uuid REFERENCES public.sites(id) ON DELETE SET NULL,
  asset_id        uuid REFERENCES public.assets(id) ON DELETE SET NULL,
  recorded_at     timestamptz NOT NULL,
  temperature_c   numeric(6, 2) NOT NULL,
  setpoint_c      numeric(6, 2),
  in_envelope     boolean NOT NULL DEFAULT true,
  recorded_by_id  uuid REFERENCES public.app_users(id) ON DELETE SET NULL,
  metadata        jsonb NOT NULL DEFAULT '{}'::jsonb
);

CREATE INDEX idx_temp_org_asset ON public.temperature_logs (organization_id, asset_id, recorded_at DESC);

ALTER TABLE public.temperature_logs ENABLE ROW LEVEL SECURITY;
CREATE POLICY "temp_logs_member_read" ON public.temperature_logs
  FOR SELECT USING (app.is_member_of(organization_id) OR app.is_internal_staff() OR app.is_super_admin());

-- ---------------------------------------------------------------------------
-- Incidents — anything notable that isn't (yet) a corrective action
-- ---------------------------------------------------------------------------
CREATE TABLE public.incidents (
  id              uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id uuid NOT NULL REFERENCES public.organizations(id) ON DELETE CASCADE,
  site_id         uuid REFERENCES public.sites(id) ON DELETE SET NULL,
  occurred_at     timestamptz NOT NULL DEFAULT now(),
  category        text NOT NULL,
  severity        public.incident_severity NOT NULL DEFAULT 'low',
  title           text NOT NULL,
  description     text,
  reported_by_id  uuid REFERENCES public.app_users(id) ON DELETE SET NULL,
  status          text NOT NULL DEFAULT 'open' CHECK (status IN ('open','investigating','closed')),
  resolved_at     timestamptz,
  created_at      timestamptz NOT NULL DEFAULT now(),
  metadata        jsonb NOT NULL DEFAULT '{}'::jsonb
);

CREATE INDEX idx_incidents_org_date ON public.incidents (organization_id, occurred_at DESC);

ALTER TABLE public.incidents ENABLE ROW LEVEL SECURITY;
CREATE POLICY "incidents_member_read" ON public.incidents
  FOR SELECT USING (app.is_member_of(organization_id) OR app.is_internal_staff() OR app.is_super_admin());
