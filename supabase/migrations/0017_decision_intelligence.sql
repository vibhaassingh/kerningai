-- =============================================================================
-- Migration 0017 — Decision Intelligence (slim Phase 4b shape)
-- =============================================================================
-- Real metric ingestion lands in Phase 4c. Phase 4b is read-only over
-- pre-aggregated snapshots so the portal page has something useful.
-- =============================================================================

CREATE TABLE public.business_metrics (
  slug            text PRIMARY KEY,
  name            text NOT NULL,
  category        text NOT NULL,
  unit            text NOT NULL DEFAULT '',
  better_is       text NOT NULL DEFAULT 'higher' CHECK (better_is IN ('higher','lower')),
  description     text
);

INSERT INTO public.business_metrics (slug, name, category, unit, better_is, description) VALUES
  ('revenue',           'Revenue',              'financial',   'EUR',   'higher', 'Top-line revenue for the period.'),
  ('cogs',              'Cost of goods sold',   'financial',   'EUR',   'lower',  'Direct cost attached to revenue.'),
  ('contribution',      'Contribution margin',  'financial',   '%',     'higher', 'Revenue minus variable costs over revenue.'),
  ('downtime_hours',    'Unplanned downtime',   'operational', 'hours', 'lower',  'Total hours of unplanned downtime.'),
  ('energy_kwh',        'Energy consumption',   'sustainability','kWh', 'lower',  'Total electricity consumption.'),
  ('emissions_scope2',  'Scope-2 emissions',    'sustainability','kg CO2e','lower','Scope-2 emissions from purchased energy.'),
  ('oee',               'OEE',                  'operational', '%',     'higher', 'Overall equipment effectiveness.'),
  ('food_safety_score', 'Food safety score',    'compliance',  'index', 'higher', 'Composite hygiene + cold-chain index.'),
  ('agent_savings',     'Agent-attributed savings','financial','EUR',   'higher', 'Savings attributable to approved agent actions.')
ON CONFLICT (slug) DO NOTHING;

ALTER TABLE public.business_metrics ENABLE ROW LEVEL SECURITY;
CREATE POLICY "metrics_authed_read" ON public.business_metrics
  FOR SELECT USING (app.current_user_id() IS NOT NULL);
CREATE POLICY "metrics_super_admin_write" ON public.business_metrics
  FOR ALL USING (app.is_super_admin()) WITH CHECK (app.is_super_admin());

-- ---------------------------------------------------------------------------
-- Metric snapshots — value per metric per period, optionally per site
-- ---------------------------------------------------------------------------
CREATE TABLE public.metric_snapshots (
  id              uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id uuid NOT NULL REFERENCES public.organizations(id) ON DELETE CASCADE,
  site_id         uuid REFERENCES public.sites(id) ON DELETE SET NULL,
  metric_slug     text NOT NULL REFERENCES public.business_metrics(slug),
  period          text NOT NULL CHECK (period IN ('day','week','month','quarter','year')),
  period_start    date NOT NULL,
  value           numeric(16, 4) NOT NULL,
  delta_pct       numeric(8, 3),
  target_value    numeric(16, 4),
  metadata        jsonb NOT NULL DEFAULT '{}'::jsonb,
  recorded_at     timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX idx_snapshots_org_metric ON public.metric_snapshots (organization_id, metric_slug, period_start DESC);

ALTER TABLE public.metric_snapshots ENABLE ROW LEVEL SECURITY;
CREATE POLICY "snapshots_member_read" ON public.metric_snapshots
  FOR SELECT USING (app.is_member_of(organization_id) OR app.is_internal_staff() OR app.is_super_admin());
