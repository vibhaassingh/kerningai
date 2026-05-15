-- =============================================================================
-- Migration 0013 — Assets + equipment health
-- =============================================================================
-- Schema for the predictive-maintenance surface. Phase 4a stays read-only —
-- assets + the latest health score per asset. Sensors, telemetry, anomaly
-- timelines, work-orders all land in Phase 4b alongside ingestion.
-- =============================================================================

CREATE TYPE public.asset_kind AS ENUM (
  'combi_oven',
  'compressor',
  'hood_motor',
  'hvac',
  'bearing_rig',
  'cold_room',
  'robotic_cell',
  'utility_meter',
  'refrigeration_rack',
  'other'
);

CREATE TYPE public.asset_status AS ENUM (
  'healthy',
  'watch',
  'at_risk',
  'down',
  'retired'
);

CREATE TABLE public.assets (
  id                uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id   uuid NOT NULL REFERENCES public.organizations(id) ON DELETE CASCADE,
  site_id           uuid REFERENCES public.sites(id) ON DELETE SET NULL,
  name              text NOT NULL,
  asset_code        text,
  kind              public.asset_kind NOT NULL DEFAULT 'other',
  status            public.asset_status NOT NULL DEFAULT 'healthy',
  manufacturer      text,
  model             text,
  installed_at      date,
  notes             text,
  created_at        timestamptz NOT NULL DEFAULT now(),
  updated_at        timestamptz NOT NULL DEFAULT now(),
  metadata          jsonb NOT NULL DEFAULT '{}'::jsonb
);

CREATE INDEX idx_assets_org ON public.assets (organization_id);
CREATE INDEX idx_assets_site ON public.assets (site_id);
CREATE INDEX idx_assets_status ON public.assets (status);

CREATE TRIGGER trg_assets_updated_at
  BEFORE UPDATE ON public.assets
  FOR EACH ROW EXECUTE FUNCTION app.set_updated_at();

-- ---------------------------------------------------------------------------
-- equipment_health_scores — most-recent snapshot per asset is what the
-- portal shows; full timeline lands in Phase 4b.
-- ---------------------------------------------------------------------------
CREATE TABLE public.equipment_health_scores (
  id              uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id uuid NOT NULL REFERENCES public.organizations(id) ON DELETE CASCADE,
  asset_id        uuid NOT NULL REFERENCES public.assets(id) ON DELETE CASCADE,
  score           integer NOT NULL CHECK (score >= 0 AND score <= 100),
  confidence      numeric(4, 3) CHECK (confidence IS NULL OR (confidence >= 0 AND confidence <= 1)),
  band            text NOT NULL CHECK (band IN ('strong','healthy','watch','at_risk','critical')),
  reason          text,
  forecast_event  text,
  forecast_days   integer,
  observed_at     timestamptz NOT NULL DEFAULT now(),
  metadata        jsonb NOT NULL DEFAULT '{}'::jsonb
);

CREATE INDEX idx_health_asset ON public.equipment_health_scores (asset_id, observed_at DESC);
CREATE INDEX idx_health_org_observed ON public.equipment_health_scores (organization_id, observed_at DESC);

-- ---------------------------------------------------------------------------
-- RLS — members of the org read; internal staff read everything.
-- Writes happen via service role (background jobs in Phase 4b).
-- ---------------------------------------------------------------------------
ALTER TABLE public.assets ENABLE ROW LEVEL SECURITY;
CREATE POLICY "assets_member_read" ON public.assets
  FOR SELECT
  USING (app.is_member_of(organization_id) OR app.is_internal_staff() OR app.is_super_admin());

ALTER TABLE public.equipment_health_scores ENABLE ROW LEVEL SECURITY;
CREATE POLICY "health_member_read" ON public.equipment_health_scores
  FOR SELECT
  USING (app.is_member_of(organization_id) OR app.is_internal_staff() OR app.is_super_admin());
