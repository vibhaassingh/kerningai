import "server-only";

import { createServiceClient } from "@/lib/supabase/service";

/**
 * Read-only system-health rollup. Everything here is DB-derived (no
 * external probes) so it works the moment Supabase is wired. Surfaces
 * the operational backlog the cron jobs + agents are responsible for.
 */

export interface SystemHealth {
  agentRunsLast24h: number;
  agentRunsFailedLast24h: number;
  pendingRecommendations: number;
  expiredRecommendations: number;
  staleInvites: number;
  openCorrectiveActions: number;
  unresolvedEnergyAnomalies: number;
  auditEventsLast24h: number;
  securityEventsLast24h: number;
  lastAgentRunAt: string | null;
  lastCronAuditAt: string | null;
  cronConfigured: boolean;
}

export async function getSystemHealth(): Promise<SystemHealth> {
  const service = createServiceClient();
  const since = new Date(Date.now() - 86_400_000).toISOString();

  const [
    agentRuns,
    agentRunsFailed,
    pendingRecs,
    expiredRecs,
    staleInvites,
    openCorrective,
    energyAnoms,
    auditEvents,
    securityEvents,
    lastRun,
    lastCron,
  ] = await Promise.all([
    service
      .from("agent_runs")
      .select("id", { count: "exact", head: true })
      .gte("started_at", since),
    service
      .from("agent_runs")
      .select("id", { count: "exact", head: true })
      .eq("status", "failed")
      .gte("started_at", since),
    service
      .from("agent_recommendations")
      .select("id", { count: "exact", head: true })
      .eq("status", "pending"),
    service
      .from("agent_recommendations")
      .select("id", { count: "exact", head: true })
      .eq("status", "expired"),
    service
      .from("invites")
      .select("id", { count: "exact", head: true })
      .eq("status", "pending")
      .lt("expires_at", new Date().toISOString()),
    service
      .from("corrective_actions")
      .select("id", { count: "exact", head: true })
      .neq("status", "closed"),
    service
      .from("energy_anomalies")
      .select("id", { count: "exact", head: true })
      .is("resolved_at", null),
    service
      .from("audit_logs")
      .select("id", { count: "exact", head: true })
      .gte("created_at", since),
    service
      .from("security_events")
      .select("id", { count: "exact", head: true })
      .gte("created_at", since),
    service
      .from("agent_runs")
      .select("started_at")
      .order("started_at", { ascending: false })
      .limit(1)
      .maybeSingle(),
    service
      .from("audit_logs")
      .select("created_at")
      .like("action", "cron.%")
      .order("created_at", { ascending: false })
      .limit(1)
      .maybeSingle(),
  ]);

  return {
    agentRunsLast24h: agentRuns.count ?? 0,
    agentRunsFailedLast24h: agentRunsFailed.count ?? 0,
    pendingRecommendations: pendingRecs.count ?? 0,
    expiredRecommendations: expiredRecs.count ?? 0,
    staleInvites: staleInvites.count ?? 0,
    openCorrectiveActions: openCorrective.count ?? 0,
    unresolvedEnergyAnomalies: energyAnoms.count ?? 0,
    auditEventsLast24h: auditEvents.count ?? 0,
    securityEventsLast24h: securityEvents.count ?? 0,
    lastAgentRunAt:
      (lastRun.data as { started_at: string } | null)?.started_at ?? null,
    lastCronAuditAt:
      (lastCron.data as { created_at: string } | null)?.created_at ?? null,
    cronConfigured: Boolean(process.env.CRON_SECRET),
  };
}
