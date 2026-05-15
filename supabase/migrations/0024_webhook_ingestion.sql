-- =============================================================================
-- Migration 0024 — Webhook ingestion (Phase 4d connector handlers)
-- =============================================================================
-- The HMAC receiver (app/api/webhooks/[connector]/[clientId]) verifies a
-- signature then hands the payload to a per-connector handler
-- (lib/integrations/handlers.ts) that NORMALIZES it into existing signal
-- tables:
--   * cmms       → equipment_health_scores
--   * bms        → temperature_logs
--   * mes        → energy_anomalies
--
-- This table is the append-only ingestion ledger: every received event,
-- whether it normalized cleanly or was skipped, is recorded for
-- traceability + replay. The Phase 4d agent inference (lib/agents/
-- inference.ts) then turns the normalized signal into recommendations.
-- =============================================================================

CREATE TABLE public.webhook_events (
  id                uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id   uuid NOT NULL REFERENCES public.organizations(id) ON DELETE CASCADE,
  connector         text NOT NULL,
  event_key         text,                       -- caller-supplied idempotency key
  status            text NOT NULL DEFAULT 'received'
                      CHECK (status IN ('received','normalized','skipped','failed')),
  normalized_count  integer NOT NULL DEFAULT 0,
  skipped_count     integer NOT NULL DEFAULT 0,
  error             text,
  payload           jsonb NOT NULL DEFAULT '{}'::jsonb,
  received_at       timestamptz NOT NULL DEFAULT now(),
  metadata          jsonb NOT NULL DEFAULT '{}'::jsonb,
  UNIQUE (organization_id, connector, event_key)
);

CREATE INDEX idx_webhook_events_org ON public.webhook_events (organization_id, received_at DESC);
CREATE INDEX idx_webhook_events_connector ON public.webhook_events (connector, status);

-- Internal-staff + client members can read their own ingestion ledger.
ALTER TABLE public.webhook_events ENABLE ROW LEVEL SECURITY;
CREATE POLICY "webhook_events_read" ON public.webhook_events
  FOR SELECT
  USING (
    app.is_super_admin()
    OR app.is_internal_staff()
    OR app.is_member_of(organization_id)
  );
