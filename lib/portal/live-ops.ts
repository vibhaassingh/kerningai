import "server-only";

import { createClient } from "@/lib/supabase/server";

export interface SignalEvent {
  id: string;
  kind: "agent_recommendation" | "energy_anomaly" | "incident" | "corrective_action" | "audit";
  occurred_at: string;
  severity: string;
  title: string;
  detail: string | null;
  site_name: string | null;
  href: string | null;
}

/**
 * Aggregates the latest operational signal across modules into a single
 * ticker. Phase 4b uses pull-on-load; Phase 4c will switch the surface
 * to a Supabase Realtime subscription.
 */
export async function getLiveSignal(
  organizationId: string,
  limit = 40,
): Promise<SignalEvent[]> {
  const supabase = await createClient();

  const [{ data: recs }, { data: anomalies }, { data: incidents }, { data: actions }, { data: audits }] =
    await Promise.all([
      supabase
        .from("agent_recommendations")
        .select("id, created_at, title, summary, risk_level, status, site:sites(name)")
        .eq("organization_id", organizationId)
        .order("created_at", { ascending: false })
        .limit(20),
      supabase
        .from("energy_anomalies")
        .select("id, detected_at, severity, description, site:sites(name)")
        .eq("organization_id", organizationId)
        .order("detected_at", { ascending: false })
        .limit(20),
      supabase
        .from("incidents")
        .select("id, occurred_at, severity, title, description, status, site:sites(name)")
        .eq("organization_id", organizationId)
        .order("occurred_at", { ascending: false })
        .limit(20),
      supabase
        .from("corrective_actions")
        .select("id, title, description, status, due_at, created_at, site:sites(name)")
        .eq("organization_id", organizationId)
        .order("created_at", { ascending: false })
        .limit(20),
      supabase
        .from("audit_runs")
        .select("id, name, status, scheduled_for, completed_at, score, site:sites(name)")
        .eq("organization_id", organizationId)
        .order("scheduled_for", { ascending: false })
        .limit(15),
    ]);

  type SiteWrap = { name: string } | null;

  type RecRow = {
    id: string;
    created_at: string;
    title: string;
    summary: string;
    risk_level: string;
    status: string;
    site: SiteWrap;
  };
  type AnomRow = {
    id: string;
    detected_at: string;
    severity: string;
    description: string;
    site: SiteWrap;
  };
  type IncRow = {
    id: string;
    occurred_at: string;
    severity: string;
    title: string;
    description: string | null;
    status: string;
    site: SiteWrap;
  };
  type CARow = {
    id: string;
    title: string;
    description: string | null;
    status: string;
    due_at: string | null;
    created_at: string;
    site: SiteWrap;
  };
  type AuditRow = {
    id: string;
    name: string;
    status: string;
    scheduled_for: string;
    completed_at: string | null;
    score: number | null;
    site: SiteWrap;
  };

  const events: SignalEvent[] = [];

  for (const r of ((recs ?? []) as unknown as RecRow[])) {
    events.push({
      id: `rec:${r.id}`,
      kind: "agent_recommendation",
      occurred_at: r.created_at,
      severity: r.risk_level,
      title: r.title,
      detail: r.summary,
      site_name: r.site?.name ?? null,
      href: `/portal/agents/${r.id}`,
    });
  }
  for (const a of ((anomalies ?? []) as unknown as AnomRow[])) {
    events.push({
      id: `energy:${a.id}`,
      kind: "energy_anomaly",
      occurred_at: a.detected_at,
      severity: a.severity,
      title: a.description.split(".")[0] ?? "Energy anomaly",
      detail: a.description,
      site_name: a.site?.name ?? null,
      href: "/portal/energy",
    });
  }
  for (const i of ((incidents ?? []) as unknown as IncRow[])) {
    events.push({
      id: `incident:${i.id}`,
      kind: "incident",
      occurred_at: i.occurred_at,
      severity: i.severity,
      title: i.title,
      detail: i.description,
      site_name: i.site?.name ?? null,
      href: "/portal/compliance",
    });
  }
  for (const c of ((actions ?? []) as unknown as CARow[])) {
    events.push({
      id: `ca:${c.id}`,
      kind: "corrective_action",
      occurred_at: c.created_at,
      severity: c.status === "open" ? "medium" : "low",
      title: `Corrective: ${c.title}`,
      detail: c.description,
      site_name: c.site?.name ?? null,
      href: "/portal/compliance",
    });
  }
  for (const a of ((audits ?? []) as unknown as AuditRow[])) {
    events.push({
      id: `audit:${a.id}`,
      kind: "audit",
      occurred_at: a.completed_at ?? `${a.scheduled_for}T00:00:00Z`,
      severity: a.status === "flagged" ? "high" : "low",
      title: `${a.name} · ${a.status}`,
      detail: a.score != null ? `Score ${a.score}` : null,
      site_name: a.site?.name ?? null,
      href: "/portal/compliance",
    });
  }

  events.sort((a, b) => (a.occurred_at < b.occurred_at ? 1 : -1));
  return events.slice(0, limit);
}
