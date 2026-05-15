import "server-only";

import type { SupabaseClient } from "@supabase/supabase-js";

/**
 * Phase 4d-late — rule-based recommendation inference.
 *
 * Reads live signal already in the DB (equipment health, energy
 * anomalies, corrective actions, temperature breaches) and turns it
 * into `agent_recommendations` rows. Deterministic + idempotent: every
 * candidate carries a stable `metadata.signal_key`; a candidate is
 * skipped when a `pending` recommendation with the same key already
 * exists for the org+template, so the cron can run on a schedule
 * without creating duplicates.
 *
 * This is intentionally rule-based (mirrors lib/blueprint/generate.ts).
 * LLM enrichment is a separate, flagged path (blueprint_llm_enrichment)
 * and not wired here.
 */

type Service = SupabaseClient;

export interface RecommendationDraft {
  organization_id: string;
  site_id: string | null;
  asset_id: string | null;
  run_id: string;
  template_slug: string;
  title: string;
  summary: string;
  reasoning: string;
  risk_level: string;
  confidence: number;
  expected_impact: string;
  evidence: unknown[];
  proposed_action: string;
  status: "pending";
  expires_at: string;
  metadata: { signal_key: string; generated_by: "rule_based" };
}

const EXPIRY_DAYS = 14;

function expiresAt(): string {
  return new Date(Date.now() + EXPIRY_DAYS * 86_400_000).toISOString();
}

async function existingPendingKeys(
  service: Service,
  orgId: string,
  templateSlug: string,
): Promise<Set<string>> {
  const { data } = await service
    .from("agent_recommendations")
    .select("metadata")
    .eq("organization_id", orgId)
    .eq("template_slug", templateSlug)
    .eq("status", "pending");
  const keys = new Set<string>();
  for (const r of (data ?? []) as { metadata: { signal_key?: string } }[]) {
    if (r.metadata?.signal_key) keys.add(r.metadata.signal_key);
  }
  return keys;
}

async function maintenanceForecast(
  service: Service,
  orgId: string,
  runId: string,
): Promise<RecommendationDraft[]> {
  // Latest health score per asset (observed_at DESC, dedup in JS).
  const { data } = await service
    .from("equipment_health_scores")
    .select(
      "asset_id, score, band, reason, forecast_event, forecast_days, observed_at, asset:assets(name, site_id)",
    )
    .eq("organization_id", orgId)
    .order("observed_at", { ascending: false })
    .limit(200);

  type Row = {
    asset_id: string;
    score: number;
    band: string;
    reason: string | null;
    forecast_event: string | null;
    forecast_days: number | null;
    asset: { name: string; site_id: string | null } | null;
  };
  const seen = new Set<string>();
  const out: RecommendationDraft[] = [];
  for (const r of (data ?? []) as unknown as Row[]) {
    if (seen.has(r.asset_id)) continue; // keep only the latest per asset
    seen.add(r.asset_id);
    if (r.band !== "at_risk" && r.band !== "critical") continue;

    const critical = r.band === "critical";
    out.push({
      organization_id: orgId,
      site_id: r.asset?.site_id ?? null,
      asset_id: r.asset_id,
      run_id: runId,
      template_slug: "maintenance_forecast",
      title: `${r.asset?.name ?? "Asset"} — ${
        r.forecast_event ?? "elevated failure risk"
      }`,
      summary: r.forecast_days
        ? `${r.asset?.name ?? "This asset"} is forecast for "${
            r.forecast_event ?? "failure"
          }" in ~${r.forecast_days} days (health ${r.score}/100, band ${r.band}).`
        : `${r.asset?.name ?? "This asset"} is at ${r.band} (health ${
            r.score
          }/100).`,
      reasoning:
        r.reason ??
        `Health band ${r.band} at score ${r.score}/100 crossed the maintenance threshold.`,
      risk_level: critical ? "critical_approval" : "requires_approval",
      confidence: critical ? 0.86 : 0.74,
      expected_impact: critical
        ? "Prevents an imminent unplanned outage and the associated production loss."
        : "Reduces the probability of an unplanned failure within the forecast window.",
      evidence: [
        { kind: "health_score", score: r.score, band: r.band },
        r.forecast_event
          ? {
              kind: "forecast",
              event: r.forecast_event,
              days: r.forecast_days,
            }
          : null,
      ].filter(Boolean),
      proposed_action: critical
        ? `Schedule priority maintenance for ${
            r.asset?.name ?? "the asset"
          } and stage spares before the forecast window.`
        : `Open a planned work order for ${
            r.asset?.name ?? "the asset"
          } within the forecast window.`,
      status: "pending",
      expires_at: expiresAt(),
      metadata: {
        signal_key: `health:${r.asset_id}:${r.band}`,
        generated_by: "rule_based",
      },
    });
  }
  return out;
}

async function energyOptimization(
  service: Service,
  orgId: string,
  runId: string,
): Promise<RecommendationDraft[]> {
  const { data } = await service
    .from("energy_anomalies")
    .select("id, site_id, kind, severity, description, detected_at")
    .eq("organization_id", orgId)
    .is("resolved_at", null)
    .in("severity", ["medium", "high"])
    .order("detected_at", { ascending: false })
    .limit(50);

  type Row = {
    id: string;
    site_id: string | null;
    kind: string;
    severity: string;
    description: string;
  };
  return ((data ?? []) as Row[]).map((a) => ({
    organization_id: orgId,
    site_id: a.site_id,
    asset_id: null,
    run_id: runId,
    template_slug: "energy_optimization",
    title: `Energy ${a.kind.replace("_", " ")} (${a.severity})`,
    summary: a.description,
    reasoning: `Unresolved ${a.severity}-severity ${a.kind} on the energy module. Acting during the next tariff window captures the largest saving.`,
    risk_level: "requires_approval",
    confidence: a.severity === "high" ? 0.8 : 0.68,
    expected_impact:
      a.kind === "tariff_overlap"
        ? "Shifting load out of the peak window reduces the demand charge on this meter."
        : "Correcting the baseline drift returns the meter to its expected envelope.",
    evidence: [{ kind: "energy_anomaly", anomaly: a.kind, severity: a.severity }],
    proposed_action:
      a.kind === "tariff_overlap"
        ? "Reschedule the affected load out of the peak tariff window."
        : "Inspect the meter and reset the setpoint/schedule to the expected baseline.",
    status: "pending",
    expires_at: expiresAt(),
    metadata: {
      signal_key: `energy_anomaly:${a.id}`,
      generated_by: "rule_based",
    },
  }));
}

async function complianceVariance(
  service: Service,
  orgId: string,
  runId: string,
): Promise<RecommendationDraft[]> {
  const { data } = await service
    .from("corrective_actions")
    .select("id, site_id, title, description, status, due_at")
    .eq("organization_id", orgId)
    .neq("status", "closed")
    .order("due_at", { ascending: true })
    .limit(50);

  type Row = {
    id: string;
    site_id: string | null;
    title: string;
    description: string | null;
    status: string;
    due_at: string | null;
  };
  return ((data ?? []) as Row[]).map((c) => {
    const overdue = c.due_at ? new Date(c.due_at) < new Date() : false;
    return {
      organization_id: orgId,
      site_id: c.site_id,
      asset_id: null,
      run_id: runId,
      template_slug: "compliance_variance",
      title: `${overdue ? "Overdue" : "Open"} corrective action — ${c.title}`,
      summary:
        c.description ??
        `Corrective action "${c.title}" is ${c.status}${
          overdue ? " and past its due date" : ""
        }.`,
      reasoning: overdue
        ? "Past-due corrective actions are the highest-weighted audit-readiness risk."
        : "Open corrective actions degrade the compliance readiness score until closed.",
      risk_level: overdue ? "critical_approval" : "requires_approval",
      confidence: 0.9,
      expected_impact:
        "Closing this returns the framework to its target readiness score.",
      evidence: [
        { kind: "corrective_action", status: c.status, overdue, due_at: c.due_at },
      ],
      proposed_action: `Assign an owner and close "${c.title}"${
        c.due_at ? ` (due ${c.due_at})` : ""
      }.`,
      status: "pending" as const,
      expires_at: expiresAt(),
      metadata: {
        signal_key: `corrective:${c.id}`,
        generated_by: "rule_based" as const,
      },
    };
  });
}

async function coldChainMonitor(
  service: Service,
  orgId: string,
  runId: string,
): Promise<RecommendationDraft[]> {
  const since = new Date(Date.now() - 7 * 86_400_000).toISOString();
  const { data } = await service
    .from("temperature_logs")
    .select(
      "id, site_id, asset_id, recorded_at, temperature_c, setpoint_c, in_envelope, asset:assets(name)",
    )
    .eq("organization_id", orgId)
    .eq("in_envelope", false)
    .gte("recorded_at", since)
    .order("recorded_at", { ascending: false })
    .limit(40);

  type Row = {
    id: string;
    site_id: string | null;
    asset_id: string | null;
    temperature_c: number;
    setpoint_c: number | null;
    asset: { name: string } | null;
  };
  return ((data ?? []) as unknown as Row[]).map((t) => ({
    organization_id: orgId,
    site_id: t.site_id,
    asset_id: t.asset_id,
    run_id: runId,
    template_slug: "cold_chain_monitor",
    title: `Cold-chain breach — ${t.asset?.name ?? "unit"} at ${t.temperature_c}°C`,
    summary: `${t.asset?.name ?? "A refrigeration unit"} logged ${
      t.temperature_c
    }°C${
      t.setpoint_c != null ? ` against a ${t.setpoint_c}°C setpoint` : ""
    } — outside the safe envelope.`,
    reasoning:
      "Out-of-envelope readings risk product integrity and trigger HACCP corrective-action requirements.",
    risk_level: "critical_approval",
    confidence: 0.88,
    expected_impact:
      "Early intervention prevents product loss and a reportable cold-chain incident.",
    evidence: [
      {
        kind: "temperature_log",
        temperature_c: t.temperature_c,
        setpoint_c: t.setpoint_c,
      },
    ],
    proposed_action: `Dispatch a check on ${
      t.asset?.name ?? "the unit"
    }, quarantine affected stock, and log a corrective action.`,
    status: "pending",
    expires_at: expiresAt(),
    metadata: {
      signal_key: `temp_breach:${t.id}`,
      generated_by: "rule_based",
    },
  }));
}

async function siteTriage(
  service: Service,
  orgId: string,
  runId: string,
): Promise<RecommendationDraft[]> {
  const [{ count: health }, { count: energy }, { count: corrective }] =
    await Promise.all([
      service
        .from("equipment_health_scores")
        .select("id", { count: "exact", head: true })
        .eq("organization_id", orgId)
        .in("band", ["at_risk", "critical"]),
      service
        .from("energy_anomalies")
        .select("id", { count: "exact", head: true })
        .eq("organization_id", orgId)
        .is("resolved_at", null),
      service
        .from("corrective_actions")
        .select("id", { count: "exact", head: true })
        .eq("organization_id", orgId)
        .neq("status", "closed"),
    ]);

  const total = (health ?? 0) + (energy ?? 0) + (corrective ?? 0);
  if (total < 3) return []; // not worth a triage summary below threshold

  // One rolling daily summary; signal_key keyed on the day so it refreshes.
  const day = new Date().toISOString().slice(0, 10);
  return [
    {
      organization_id: orgId,
      site_id: null,
      asset_id: null,
      run_id: runId,
      template_slug: "site_triage",
      title: `Cross-module triage — ${total} open signals`,
      summary: `${health ?? 0} asset-health, ${energy ?? 0} energy, ${
        corrective ?? 0
      } compliance signals are open and unresolved.`,
      reasoning:
        "Volume of concurrent open signals across modules indicates a coordination gap that warrants a single owner.",
      risk_level: "operational",
      confidence: 0.7,
      expected_impact:
        "A single triage owner reduces mean-time-to-resolution across modules.",
      evidence: [
        { kind: "counts", health, energy, corrective },
      ],
      proposed_action:
        "Assign a duty owner to sweep the open signals and route each to the right module owner.",
      status: "pending",
      expires_at: expiresAt(),
      metadata: {
        signal_key: `triage:${day}`,
        generated_by: "rule_based",
      },
    },
  ];
}

const GENERATORS: Record<
  string,
  (s: Service, o: string, r: string) => Promise<RecommendationDraft[]>
> = {
  maintenance_forecast: maintenanceForecast,
  energy_optimization: energyOptimization,
  compliance_variance: complianceVariance,
  cold_chain_monitor: coldChainMonitor,
  site_triage: siteTriage,
  // demand_forecasting intentionally not wired — needs a real forecast
  // model, not a rule. Returns nothing rather than fake numbers.
};

/**
 * Generate + persist recommendations for one org under one template.
 * Idempotent against existing pending recommendations. Returns the
 * number of new recommendations created.
 */
export async function runInference(
  service: Service,
  orgId: string,
  templateSlug: string,
  runId: string,
): Promise<number> {
  const gen = GENERATORS[templateSlug];
  if (!gen) return 0;

  const drafts = await gen(service, orgId, runId);
  if (drafts.length === 0) return 0;

  const existing = await existingPendingKeys(service, orgId, templateSlug);
  const fresh = drafts.filter(
    (d) => !existing.has(d.metadata.signal_key),
  );
  if (fresh.length === 0) return 0;

  const { error } = await service.from("agent_recommendations").insert(fresh);
  if (error) {
    console.error("[inference] insert failed", error.message, {
      orgId,
      templateSlug,
    });
    return 0;
  }
  return fresh.length;
}
