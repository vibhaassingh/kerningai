import "server-only";

import { createClient } from "@/lib/supabase/server";

export interface OntologyOverview {
  siteCount: number;
  assetCount: number;
  meterCount: number;
  memberCount: number;
  templateCount: number;
  recentLineage: { id: string; label: string; subtitle: string; observed_at: string }[];
}

/**
 * Aggregates the in-graph entity counts + a short "what changed lately"
 * stream pulled from agent runs and audit log. Phase 4d will swap this
 * for a real lineage subscription.
 */
export async function getOntologyOverview(
  organizationId: string,
): Promise<OntologyOverview> {
  const supabase = await createClient();

  const [
    { count: siteCount },
    { count: assetCount },
    { count: meterCount },
    { count: memberCount },
    { data: templates },
    { data: recentRuns },
  ] = await Promise.all([
    supabase.from("sites").select("id", { count: "exact", head: true }).eq("organization_id", organizationId),
    supabase.from("assets").select("id", { count: "exact", head: true }).eq("organization_id", organizationId),
    supabase.from("utility_meters").select("id", { count: "exact", head: true }).eq("organization_id", organizationId),
    supabase
      .from("organization_memberships")
      .select("id", { count: "exact", head: true })
      .eq("organization_id", organizationId)
      .eq("status", "active"),
    supabase.from("agent_templates").select("slug, name"),
    supabase
      .from("agent_runs")
      .select("id, started_at, status, template:agent_templates(name)")
      .eq("organization_id", organizationId)
      .order("started_at", { ascending: false })
      .limit(8),
  ]);

  type RunRow = {
    id: string;
    started_at: string;
    status: string;
    template: { name: string } | null;
  };

  return {
    siteCount: siteCount ?? 0,
    assetCount: assetCount ?? 0,
    meterCount: meterCount ?? 0,
    memberCount: memberCount ?? 0,
    templateCount: (templates ?? []).length,
    recentLineage: ((recentRuns ?? []) as unknown as RunRow[]).map((r) => ({
      id: r.id,
      label: r.template?.name ?? "Agent run",
      subtitle: r.status,
      observed_at: r.started_at,
    })),
  };
}
