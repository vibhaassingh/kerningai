import "server-only";

import { createClient } from "@/lib/supabase/server";

export interface CommandCenterMetrics {
  totalClients: number;
  activeClients: number;
  sitesMonitored: number;
  peopleWithAccess: number;
  pendingInvites: number;
  totalMrrCents: number;
  currency: string;
  auditEventsLast24h: number;
  recentAuditEvents: RecentAuditEvent[];
  clientHealth: ClientHealthSnapshot[];
  modulesAdoption: { module: string; clientCount: number }[];
}

export interface RecentAuditEvent {
  id: string;
  action: string;
  resource_type: string;
  created_at: string;
  actor_name: string | null;
  organization_name: string | null;
}

export interface ClientHealthSnapshot {
  organization_id: string;
  name: string;
  industry: string | null;
  health_score: number | null;
  region: string;
}

export async function getCommandCenterMetrics(): Promise<CommandCenterMetrics> {
  const supabase = await createClient();

  const [
    { data: clients },
    sitesRes,
    membersRes,
    pendingInvitesRes,
    auditRes,
    auditCountRes,
  ] = await Promise.all([
    supabase
      .from("organizations")
      .select(
        `id, name, status, region,
         client_settings!inner(industry, health_score, mrr_cents, currency, modules_enabled)`,
      )
      .eq("type", "client")
      .order("name", { ascending: true }),
    supabase
      .from("sites")
      .select("organization_id", { count: "exact", head: true }),
    supabase
      .from("organization_memberships")
      .select("organization_id", { count: "exact", head: true })
      .eq("status", "active"),
    supabase
      .from("invites")
      .select("id", { count: "exact", head: true })
      .eq("status", "pending"),
    supabase
      .from("audit_logs")
      .select(
        "id, action, resource_type, created_at, actor:app_users(full_name, email), organization:organizations(name)",
      )
      .order("created_at", { ascending: false })
      .limit(8),
    supabase
      .from("audit_logs")
      .select("id", { count: "exact", head: true })
      .gte("created_at", new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString()),
  ]);

  type ClientRow = {
    id: string;
    name: string;
    status: "active" | "suspended" | "archived";
    region: string;
    client_settings: {
      industry: string | null;
      health_score: number | null;
      mrr_cents: number;
      currency: string;
      modules_enabled: string[];
    };
  };

  type AuditRow = {
    id: string;
    action: string;
    resource_type: string;
    created_at: string;
    actor: { full_name: string | null; email: string } | null;
    organization: { name: string } | null;
  };

  const clientRows = (clients ?? []) as unknown as ClientRow[];
  const auditRows = ((auditRes.data ?? []) as unknown as AuditRow[]) ?? [];

  const totalMrr = clientRows.reduce(
    (acc, r) => acc + (r.client_settings.mrr_cents ?? 0),
    0,
  );

  const adoption = new Map<string, number>();
  for (const c of clientRows) {
    for (const m of c.client_settings.modules_enabled ?? []) {
      adoption.set(m, (adoption.get(m) ?? 0) + 1);
    }
  }

  return {
    totalClients: clientRows.length,
    activeClients: clientRows.filter((r) => r.status === "active").length,
    sitesMonitored: sitesRes.count ?? 0,
    peopleWithAccess: membersRes.count ?? 0,
    pendingInvites: pendingInvitesRes.count ?? 0,
    totalMrrCents: totalMrr,
    currency: clientRows[0]?.client_settings.currency ?? "EUR",
    auditEventsLast24h: auditCountRes.count ?? 0,
    recentAuditEvents: auditRows.map((r) => ({
      id: r.id,
      action: r.action,
      resource_type: r.resource_type,
      created_at: r.created_at,
      actor_name: r.actor?.full_name ?? r.actor?.email ?? null,
      organization_name: r.organization?.name ?? null,
    })),
    clientHealth: clientRows.map((r) => ({
      organization_id: r.id,
      name: r.name,
      industry: r.client_settings.industry,
      health_score: r.client_settings.health_score,
      region: r.region,
    })),
    modulesAdoption: Array.from(adoption.entries())
      .map(([module, clientCount]) => ({ module, clientCount }))
      .sort((a, b) => b.clientCount - a.clientCount),
  };
}
