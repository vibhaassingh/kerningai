import "server-only";

import { createClient } from "@/lib/supabase/server";

export interface MetricSnapshotRow {
  metric_slug: string;
  metric_name: string;
  category: string;
  unit: string;
  better_is: "higher" | "lower";
  period: string;
  period_start: string;
  value: number;
  delta_pct: number | null;
  target_value: number | null;
}

export async function listLatestMetrics(
  organizationId: string,
): Promise<MetricSnapshotRow[]> {
  const supabase = await createClient();
  const { data } = await supabase
    .from("metric_snapshots")
    .select(
      "metric_slug, period, period_start, value, delta_pct, target_value, metric:business_metrics(name, category, unit, better_is)",
    )
    .eq("organization_id", organizationId)
    .order("period_start", { ascending: false })
    .limit(60);

  type Row = {
    metric_slug: string;
    period: string;
    period_start: string;
    value: number;
    delta_pct: number | null;
    target_value: number | null;
    metric: { name: string; category: string; unit: string; better_is: "higher" | "lower" } | null;
  };

  // Take latest per metric_slug.
  const latest = new Map<string, MetricSnapshotRow>();
  for (const r of ((data ?? []) as unknown as Row[])) {
    if (latest.has(r.metric_slug)) continue;
    latest.set(r.metric_slug, {
      metric_slug: r.metric_slug,
      metric_name: r.metric?.name ?? r.metric_slug,
      category: r.metric?.category ?? "other",
      unit: r.metric?.unit ?? "",
      better_is: r.metric?.better_is ?? "higher",
      period: r.period,
      period_start: r.period_start,
      value: Number(r.value),
      delta_pct: r.delta_pct != null ? Number(r.delta_pct) : null,
      target_value: r.target_value != null ? Number(r.target_value) : null,
    });
  }
  return Array.from(latest.values());
}
