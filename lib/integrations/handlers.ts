import "server-only";

import type { SupabaseClient } from "@supabase/supabase-js";

/**
 * Per-connector webhook normalizers (Phase 4d).
 *
 * Each handler takes a verified payload + the client org id and writes
 * into the existing signal tables so the rule-based agent inference
 * (lib/agents/inference.ts) can turn it into recommendations on the
 * next run. Handlers are deliberately tolerant: rows that can't resolve
 * an asset/site are skipped (counted), never throw, so one bad record
 * doesn't drop a whole batch.
 *
 * Supported connectors:
 *   * cmms → equipment_health_scores   (work-order / asset-health feed)
 *   * bms  → temperature_logs          (building-management / cold-chain)
 *   * mes  → energy_anomalies          (manufacturing energy signal)
 *
 * Payload shape (each accepts a single object OR { events: [...] }):
 *   cmms: { asset_code, score, band?, reason?, forecast_event?, forecast_days? }
 *   bms:  { asset_code?, temperature_c, setpoint_c?, recorded_at? }
 *   mes:  { kind, severity, description, site_slug? }
 */

type Service = SupabaseClient;

export interface NormalizeResult {
  normalized: number;
  skipped: number;
}

function asEvents(payload: unknown): Record<string, unknown>[] {
  if (Array.isArray(payload)) return payload as Record<string, unknown>[];
  if (payload && typeof payload === "object") {
    const obj = payload as Record<string, unknown>;
    if (Array.isArray(obj.events)) return obj.events as Record<string, unknown>[];
    return [obj];
  }
  return [];
}

async function resolveAssetId(
  service: Service,
  orgId: string,
  assetCode: unknown,
): Promise<{ id: string; site_id: string | null } | null> {
  if (typeof assetCode !== "string" || !assetCode) return null;
  const { data } = await service
    .from("assets")
    .select("id, site_id")
    .eq("organization_id", orgId)
    .eq("asset_code", assetCode)
    .maybeSingle();
  return (data as { id: string; site_id: string | null }) ?? null;
}

async function resolveSiteId(
  service: Service,
  orgId: string,
  siteSlug: unknown,
): Promise<string | null> {
  if (typeof siteSlug !== "string" || !siteSlug) return null;
  const { data } = await service
    .from("sites")
    .select("id")
    .eq("organization_id", orgId)
    .eq("slug", siteSlug)
    .maybeSingle();
  return (data as { id: string } | null)?.id ?? null;
}

const BANDS = ["strong", "healthy", "watch", "at_risk", "critical"] as const;

function bandFromScore(score: number): (typeof BANDS)[number] {
  if (score >= 85) return "strong";
  if (score >= 70) return "healthy";
  if (score >= 50) return "watch";
  if (score >= 30) return "at_risk";
  return "critical";
}

// --- cmms → equipment_health_scores ---------------------------------------
async function cmms(
  service: Service,
  orgId: string,
  payload: unknown,
): Promise<NormalizeResult> {
  let normalized = 0;
  let skipped = 0;
  for (const e of asEvents(payload)) {
    const asset = await resolveAssetId(service, orgId, e.asset_code);
    const score = Number(e.score);
    if (!asset || !Number.isFinite(score) || score < 0 || score > 100) {
      skipped += 1;
      continue;
    }
    const band =
      typeof e.band === "string" && (BANDS as readonly string[]).includes(e.band)
        ? (e.band as string)
        : bandFromScore(score);
    const { error } = await service.from("equipment_health_scores").insert({
      organization_id: orgId,
      asset_id: asset.id,
      score: Math.round(score),
      band,
      reason: typeof e.reason === "string" ? e.reason : null,
      forecast_event:
        typeof e.forecast_event === "string" ? e.forecast_event : null,
      forecast_days:
        Number.isFinite(Number(e.forecast_days)) && e.forecast_days != null
          ? Math.round(Number(e.forecast_days))
          : null,
      metadata: { source: "webhook:cmms" },
    });
    if (error) skipped += 1;
    else normalized += 1;
  }
  return { normalized, skipped };
}

// --- bms → temperature_logs ----------------------------------------------
async function bms(
  service: Service,
  orgId: string,
  payload: unknown,
): Promise<NormalizeResult> {
  let normalized = 0;
  let skipped = 0;
  for (const e of asEvents(payload)) {
    const temp = Number(e.temperature_c);
    if (!Number.isFinite(temp)) {
      skipped += 1;
      continue;
    }
    const asset = await resolveAssetId(service, orgId, e.asset_code);
    const setpoint =
      e.setpoint_c != null && Number.isFinite(Number(e.setpoint_c))
        ? Number(e.setpoint_c)
        : null;
    // Out of envelope if >3°C from setpoint (or no setpoint: trust caller).
    const inEnvelope =
      setpoint == null
        ? e.in_envelope !== false
        : Math.abs(temp - setpoint) <= 3;
    const { error } = await service.from("temperature_logs").insert({
      organization_id: orgId,
      asset_id: asset?.id ?? null,
      site_id: asset?.site_id ?? (await resolveSiteId(service, orgId, e.site_slug)),
      recorded_at:
        typeof e.recorded_at === "string"
          ? e.recorded_at
          : new Date().toISOString(),
      temperature_c: temp,
      setpoint_c: setpoint,
      in_envelope: inEnvelope,
      metadata: { source: "webhook:bms" },
    });
    if (error) skipped += 1;
    else normalized += 1;
  }
  return { normalized, skipped };
}

// --- mes → energy_anomalies ----------------------------------------------
const ANOM_KINDS = ["spike", "drift", "baseline_breach", "tariff_overlap"];
const SEVERITIES = ["low", "medium", "high"];

async function mes(
  service: Service,
  orgId: string,
  payload: unknown,
): Promise<NormalizeResult> {
  let normalized = 0;
  let skipped = 0;
  for (const e of asEvents(payload)) {
    const kind = String(e.kind);
    const severity = String(e.severity);
    if (
      !ANOM_KINDS.includes(kind) ||
      !SEVERITIES.includes(severity) ||
      typeof e.description !== "string"
    ) {
      skipped += 1;
      continue;
    }
    const { error } = await service.from("energy_anomalies").insert({
      organization_id: orgId,
      site_id: await resolveSiteId(service, orgId, e.site_slug),
      detected_at:
        typeof e.detected_at === "string"
          ? e.detected_at
          : new Date().toISOString(),
      kind,
      severity,
      description: e.description,
      metadata: { source: "webhook:mes" },
    });
    if (error) skipped += 1;
    else normalized += 1;
  }
  return { normalized, skipped };
}

export type ConnectorSlug = "cmms" | "bms" | "mes";

const REGISTRY: Record<
  ConnectorSlug,
  (s: Service, o: string, p: unknown) => Promise<NormalizeResult>
> = { cmms, bms, mes };

export function isKnownConnector(slug: string): slug is ConnectorSlug {
  return slug in REGISTRY;
}

export async function normalizeWebhook(
  service: Service,
  connector: string,
  orgId: string,
  payload: unknown,
): Promise<NormalizeResult> {
  if (!isKnownConnector(connector)) {
    // Unknown connectors are still received + audited upstream; nothing
    // to normalize here.
    return { normalized: 0, skipped: 0 };
  }
  return REGISTRY[connector](service, orgId, payload);
}
