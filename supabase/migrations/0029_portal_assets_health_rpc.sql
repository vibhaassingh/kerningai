-- =============================================================================
-- Migration 0029 — portal_assets_with_latest_health RPC
-- =============================================================================
-- lib/portal/maintenance.ts#listAssetsForClient previously fetched ALL
-- equipment_health_scores rows for every asset in the org and folded the
-- latest per asset in JS — O(assets × history) rows over the wire.
--
-- This SECURITY INVOKER function returns one row per asset with only its
-- latest health observation via LEFT JOIN LATERAL (served by the existing
-- idx_health_asset (asset_id, observed_at DESC) index). SECURITY INVOKER
-- means RLS on assets / equipment_health_scores / sites still applies as
-- the calling user — tenant isolation is unchanged.
--
-- p_limit defaults to NULL (return every org asset — no UX truncation of
-- the maintenance list). Callers may pass p_limit/p_offset to paginate;
-- a provided limit is hard-capped at 200.
-- =============================================================================

CREATE OR REPLACE FUNCTION public.portal_assets_with_latest_health(
  p_org_id   uuid,
  p_limit    integer DEFAULT NULL,
  p_offset   integer DEFAULT 0
)
RETURNS TABLE (
  id             uuid,
  name           text,
  asset_code     text,
  kind           text,
  status         text,
  site_id        uuid,
  site_name      text,
  manufacturer   text,
  model          text,
  installed_at   date,
  health_score   integer,
  health_band    text,
  health_reason  text,
  forecast_event text,
  forecast_days  integer,
  observed_at    timestamptz
)
LANGUAGE sql
STABLE
SECURITY INVOKER
SET search_path = public
AS $$
  SELECT
    a.id,
    a.name,
    a.asset_code,
    a.kind::text,
    a.status::text,
    a.site_id,
    s.name AS site_name,
    a.manufacturer,
    a.model,
    a.installed_at,
    h.score,
    h.band,
    h.reason,
    h.forecast_event,
    h.forecast_days,
    h.observed_at
  FROM public.assets a
  LEFT JOIN public.sites s ON s.id = a.site_id
  LEFT JOIN LATERAL (
    SELECT e.score, e.band, e.reason, e.forecast_event, e.forecast_days, e.observed_at
    FROM public.equipment_health_scores e
    WHERE e.asset_id = a.id
    ORDER BY e.observed_at DESC
    LIMIT 1
  ) h ON true
  WHERE a.organization_id = p_org_id
  ORDER BY a.status ASC, a.name ASC
  OFFSET GREATEST(COALESCE(p_offset, 0), 0)
  LIMIT CASE
          WHEN p_limit IS NULL THEN NULL
          ELSE LEAST(GREATEST(p_limit, 1), 200)
        END
$$;

GRANT EXECUTE ON FUNCTION
  public.portal_assets_with_latest_health(uuid, integer, integer)
  TO authenticated;
