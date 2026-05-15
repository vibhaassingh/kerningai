-- =============================================================================
-- Migration 0015 — Energy, utility, emissions
-- =============================================================================
-- Phase 4b — read-mostly model. Real ingestion pipelines land in Phase 4c.
-- =============================================================================

CREATE TYPE public.utility_kind AS ENUM ('electricity','gas','water','steam','refrigerant','diesel');

CREATE TABLE public.utility_meters (
  id              uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id uuid NOT NULL REFERENCES public.organizations(id) ON DELETE CASCADE,
  site_id         uuid REFERENCES public.sites(id) ON DELETE SET NULL,
  asset_id        uuid REFERENCES public.assets(id) ON DELETE SET NULL,
  name            text NOT NULL,
  meter_code      text,
  kind            public.utility_kind NOT NULL,
  unit            text NOT NULL DEFAULT 'kWh',
  serial_number   text,
  metadata        jsonb NOT NULL DEFAULT '{}'::jsonb,
  created_at      timestamptz NOT NULL DEFAULT now(),
  updated_at      timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX idx_meters_org ON public.utility_meters (organization_id);
CREATE INDEX idx_meters_site ON public.utility_meters (site_id);

CREATE TRIGGER trg_meters_updated_at
  BEFORE UPDATE ON public.utility_meters
  FOR EACH ROW EXECUTE FUNCTION app.set_updated_at();

-- ---------------------------------------------------------------------------
-- Tariff windows — periods within a day when rates differ
-- ---------------------------------------------------------------------------
CREATE TABLE public.tariff_windows (
  id              uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id uuid NOT NULL REFERENCES public.organizations(id) ON DELETE CASCADE,
  site_id         uuid REFERENCES public.sites(id) ON DELETE SET NULL,
  name            text NOT NULL,
  start_local     time NOT NULL,
  end_local       time NOT NULL,
  rate_per_unit   numeric(10, 4) NOT NULL,
  currency        text NOT NULL DEFAULT 'EUR',
  weekdays_only   boolean NOT NULL DEFAULT false,
  metadata        jsonb NOT NULL DEFAULT '{}'::jsonb
);

CREATE INDEX idx_tariff_org ON public.tariff_windows (organization_id);

-- ---------------------------------------------------------------------------
-- Utility readings — aggregated (daily/hourly) snapshots
-- ---------------------------------------------------------------------------
CREATE TABLE public.utility_readings (
  id              uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id uuid NOT NULL REFERENCES public.organizations(id) ON DELETE CASCADE,
  meter_id        uuid NOT NULL REFERENCES public.utility_meters(id) ON DELETE CASCADE,
  period_start    timestamptz NOT NULL,
  period_end      timestamptz NOT NULL,
  consumption     numeric(14, 4) NOT NULL,
  cost            numeric(14, 4),
  currency        text NOT NULL DEFAULT 'EUR',
  metadata        jsonb NOT NULL DEFAULT '{}'::jsonb
);

CREATE INDEX idx_readings_meter_period ON public.utility_readings (meter_id, period_start DESC);
CREATE INDEX idx_readings_org_period ON public.utility_readings (organization_id, period_start DESC);

-- ---------------------------------------------------------------------------
-- Energy anomalies — flagged drift / spike events
-- ---------------------------------------------------------------------------
CREATE TABLE public.energy_anomalies (
  id              uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id uuid NOT NULL REFERENCES public.organizations(id) ON DELETE CASCADE,
  meter_id        uuid REFERENCES public.utility_meters(id) ON DELETE CASCADE,
  site_id         uuid REFERENCES public.sites(id) ON DELETE SET NULL,
  detected_at     timestamptz NOT NULL DEFAULT now(),
  kind            text NOT NULL CHECK (kind IN ('spike','drift','baseline_breach','tariff_overlap')),
  severity        text NOT NULL CHECK (severity IN ('low','medium','high')),
  description     text NOT NULL,
  resolved_at     timestamptz,
  metadata        jsonb NOT NULL DEFAULT '{}'::jsonb
);

CREATE INDEX idx_energy_anomalies_org ON public.energy_anomalies (organization_id, detected_at DESC);

-- ---------------------------------------------------------------------------
-- RLS — members read; service-role writes
-- ---------------------------------------------------------------------------
ALTER TABLE public.utility_meters ENABLE ROW LEVEL SECURITY;
CREATE POLICY "utility_meters_member_read" ON public.utility_meters
  FOR SELECT USING (app.is_member_of(organization_id) OR app.is_internal_staff() OR app.is_super_admin());

ALTER TABLE public.tariff_windows ENABLE ROW LEVEL SECURITY;
CREATE POLICY "tariff_member_read" ON public.tariff_windows
  FOR SELECT USING (app.is_member_of(organization_id) OR app.is_internal_staff() OR app.is_super_admin());

ALTER TABLE public.utility_readings ENABLE ROW LEVEL SECURITY;
CREATE POLICY "readings_member_read" ON public.utility_readings
  FOR SELECT USING (app.is_member_of(organization_id) OR app.is_internal_staff() OR app.is_super_admin());

ALTER TABLE public.energy_anomalies ENABLE ROW LEVEL SECURITY;
CREATE POLICY "energy_anomalies_member_read" ON public.energy_anomalies
  FOR SELECT USING (app.is_member_of(organization_id) OR app.is_internal_staff() OR app.is_super_admin());
