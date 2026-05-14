import "server-only";

import { createClient } from "@/lib/supabase/server";

export interface MeterSnapshot {
  id: string;
  name: string;
  kind: string;
  unit: string;
  site_name: string | null;
  consumption_7d: number;
  cost_7d: number;
}

export interface TariffWindow {
  id: string;
  name: string;
  start_local: string;
  end_local: string;
  rate_per_unit: number;
  currency: string;
}

export interface EnergyAnomaly {
  id: string;
  detected_at: string;
  kind: string;
  severity: string;
  description: string;
  meter_name: string | null;
  site_name: string | null;
}

export async function getEnergyOverview(organizationId: string): Promise<{
  meters: MeterSnapshot[];
  tariffs: TariffWindow[];
  anomalies: EnergyAnomaly[];
  totalConsumption: number;
  totalCost: number;
  currency: string;
}> {
  const supabase = await createClient();

  const [{ data: meterRows }, { data: tariffRows }, { data: anomalyRows }] =
    await Promise.all([
      supabase
        .from("utility_meters")
        .select("id, name, kind, unit, site:sites(name)")
        .eq("organization_id", organizationId)
        .order("name"),
      supabase
        .from("tariff_windows")
        .select("id, name, start_local, end_local, rate_per_unit, currency")
        .eq("organization_id", organizationId)
        .order("start_local"),
      supabase
        .from("energy_anomalies")
        .select(
          "id, detected_at, kind, severity, description, meter:utility_meters(name), site:sites(name)",
        )
        .eq("organization_id", organizationId)
        .order("detected_at", { ascending: false })
        .limit(50),
    ]);

  type MeterRow = {
    id: string;
    name: string;
    kind: string;
    unit: string;
    site: { name: string } | null;
  };
  type AnomalyRow = {
    id: string;
    detected_at: string;
    kind: string;
    severity: string;
    description: string;
    meter: { name: string } | null;
    site: { name: string } | null;
  };

  const meterRowsTyped = ((meterRows ?? []) as unknown as MeterRow[]) ?? [];
  const meterIds = meterRowsTyped.map((m) => m.id);
  let readingsByMeter = new Map<string, { consumption: number; cost: number }>();
  if (meterIds.length > 0) {
    const sevenDaysAgo = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString();
    const { data: readings } = await supabase
      .from("utility_readings")
      .select("meter_id, consumption, cost")
      .in("meter_id", meterIds)
      .gte("period_start", sevenDaysAgo);
    type R = { meter_id: string; consumption: number; cost: number | null };
    for (const r of (readings ?? []) as R[]) {
      const cur = readingsByMeter.get(r.meter_id) ?? { consumption: 0, cost: 0 };
      cur.consumption += Number(r.consumption);
      cur.cost += Number(r.cost ?? 0);
      readingsByMeter.set(r.meter_id, cur);
    }
  }

  let totalConsumption = 0;
  let totalCost = 0;
  const meters: MeterSnapshot[] = meterRowsTyped.map((m) => {
    const stats = readingsByMeter.get(m.id) ?? { consumption: 0, cost: 0 };
    totalConsumption += stats.consumption;
    totalCost += stats.cost;
    return {
      id: m.id,
      name: m.name,
      kind: m.kind,
      unit: m.unit,
      site_name: m.site?.name ?? null,
      consumption_7d: stats.consumption,
      cost_7d: stats.cost,
    };
  });

  const tariffs: TariffWindow[] = (tariffRows ?? []) as TariffWindow[];
  const currency = tariffs[0]?.currency ?? "EUR";

  const anomalies: EnergyAnomaly[] = ((anomalyRows ?? []) as unknown as AnomalyRow[]).map(
    (a) => ({
      id: a.id,
      detected_at: a.detected_at,
      kind: a.kind,
      severity: a.severity,
      description: a.description,
      meter_name: a.meter?.name ?? null,
      site_name: a.site?.name ?? null,
    }),
  );

  return { meters, tariffs, anomalies, totalConsumption, totalCost, currency };
}
