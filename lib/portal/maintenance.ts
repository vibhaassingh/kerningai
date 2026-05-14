import "server-only";

import { createClient } from "@/lib/supabase/server";

export interface AssetWithHealth {
  id: string;
  name: string;
  asset_code: string | null;
  kind: string;
  status: "healthy" | "watch" | "at_risk" | "down" | "retired";
  site_id: string | null;
  site_name: string | null;
  manufacturer: string | null;
  model: string | null;
  installed_at: string | null;
  health_score: number | null;
  health_band: string | null;
  health_reason: string | null;
  forecast_event: string | null;
  forecast_days: number | null;
  observed_at: string | null;
}

export async function listAssetsForClient(
  organizationId: string,
): Promise<AssetWithHealth[]> {
  const supabase = await createClient();

  // Pull every asset + the latest health row for each.
  const { data: assets } = await supabase
    .from("assets")
    .select(
      "id, name, asset_code, kind, status, site_id, manufacturer, model, installed_at, site:sites(name)",
    )
    .eq("organization_id", organizationId)
    .order("status", { ascending: true })
    .order("name", { ascending: true });

  type AssetRow = {
    id: string;
    name: string;
    asset_code: string | null;
    kind: string;
    status: AssetWithHealth["status"];
    site_id: string | null;
    manufacturer: string | null;
    model: string | null;
    installed_at: string | null;
    site: { name: string } | null;
  };
  const rows = ((assets ?? []) as unknown as AssetRow[]) ?? [];
  if (rows.length === 0) return [];

  const ids = rows.map((r) => r.id);
  const { data: healthRows } = await supabase
    .from("equipment_health_scores")
    .select("asset_id, score, band, reason, forecast_event, forecast_days, observed_at")
    .in("asset_id", ids)
    .order("observed_at", { ascending: false });

  type HealthRow = {
    asset_id: string;
    score: number;
    band: string;
    reason: string | null;
    forecast_event: string | null;
    forecast_days: number | null;
    observed_at: string;
  };

  const latest = new Map<string, HealthRow>();
  for (const h of ((healthRows ?? []) as HealthRow[])) {
    if (!latest.has(h.asset_id)) latest.set(h.asset_id, h);
  }

  return rows.map((r) => {
    const h = latest.get(r.id);
    return {
      id: r.id,
      name: r.name,
      asset_code: r.asset_code,
      kind: r.kind,
      status: r.status,
      site_id: r.site_id,
      site_name: r.site?.name ?? null,
      manufacturer: r.manufacturer,
      model: r.model,
      installed_at: r.installed_at,
      health_score: h?.score ?? null,
      health_band: h?.band ?? null,
      health_reason: h?.reason ?? null,
      forecast_event: h?.forecast_event ?? null,
      forecast_days: h?.forecast_days ?? null,
      observed_at: h?.observed_at ?? null,
    };
  });
}

export async function getAssetDetail(
  assetId: string,
): Promise<AssetWithHealth | null> {
  const supabase = await createClient();

  const { data: asset } = await supabase
    .from("assets")
    .select(
      "id, organization_id, name, asset_code, kind, status, site_id, manufacturer, model, installed_at, notes, site:sites(name)",
    )
    .eq("id", assetId)
    .maybeSingle();
  if (!asset) return null;

  type AssetRow = {
    id: string;
    organization_id: string;
    name: string;
    asset_code: string | null;
    kind: string;
    status: AssetWithHealth["status"];
    site_id: string | null;
    manufacturer: string | null;
    model: string | null;
    installed_at: string | null;
    notes: string | null;
    site: { name: string } | null;
  };
  const r = asset as unknown as AssetRow;

  const { data: latest } = await supabase
    .from("equipment_health_scores")
    .select("score, band, reason, forecast_event, forecast_days, observed_at")
    .eq("asset_id", assetId)
    .order("observed_at", { ascending: false })
    .limit(1)
    .maybeSingle();

  type HealthRow = {
    score: number;
    band: string;
    reason: string | null;
    forecast_event: string | null;
    forecast_days: number | null;
    observed_at: string;
  };
  const h = latest as HealthRow | null;

  return {
    id: r.id,
    name: r.name,
    asset_code: r.asset_code,
    kind: r.kind,
    status: r.status,
    site_id: r.site_id,
    site_name: r.site?.name ?? null,
    manufacturer: r.manufacturer,
    model: r.model,
    installed_at: r.installed_at,
    health_score: h?.score ?? null,
    health_band: h?.band ?? null,
    health_reason: h?.reason ?? null,
    forecast_event: h?.forecast_event ?? null,
    forecast_days: h?.forecast_days ?? null,
    observed_at: h?.observed_at ?? null,
  };
}

export async function listRecommendationsForAsset(
  assetId: string,
): Promise<{ id: string; title: string; status: string; created_at: string }[]> {
  const supabase = await createClient();
  const { data } = await supabase
    .from("agent_recommendations")
    .select("id, title, status, created_at")
    .eq("asset_id", assetId)
    .order("created_at", { ascending: false })
    .limit(20);
  return (data ?? []) as { id: string; title: string; status: string; created_at: string }[];
}
