import "server-only";

import { createClient } from "@/lib/supabase/server";

export interface AgentRecommendation {
  id: string;
  template_slug: string;
  template_name: string | null;
  title: string;
  summary: string;
  reasoning: string | null;
  risk_level: string;
  confidence: number | null;
  expected_impact: string | null;
  evidence: { label: string; value: string }[];
  proposed_action: string;
  status: "pending" | "approved" | "rejected" | "expired" | "superseded";
  expires_at: string | null;
  decided_at: string | null;
  decided_by_name: string | null;
  decision_reason: string | null;
  created_at: string;
  asset_id: string | null;
  asset_name: string | null;
  site_id: string | null;
  site_name: string | null;
}

const RECOMMENDATION_COLUMNS = `
  id, template_slug, title, summary, reasoning, risk_level, confidence,
  expected_impact, evidence, proposed_action, status, expires_at,
  decided_at, decision_reason, created_at, asset_id, site_id,
  template:agent_templates(name),
  asset:assets(name),
  site:sites(name),
  decided_by:app_users!agent_recommendations_decided_by_id_fkey(full_name, email)
`;

type Row = {
  id: string;
  template_slug: string;
  title: string;
  summary: string;
  reasoning: string | null;
  risk_level: string;
  confidence: number | null;
  expected_impact: string | null;
  evidence: { label: string; value: string }[] | null;
  proposed_action: string;
  status: AgentRecommendation["status"];
  expires_at: string | null;
  decided_at: string | null;
  decision_reason: string | null;
  created_at: string;
  asset_id: string | null;
  site_id: string | null;
  template: { name: string } | null;
  asset: { name: string } | null;
  site: { name: string } | null;
  decided_by: { full_name: string | null; email: string } | null;
};

function hydrate(r: Row): AgentRecommendation {
  return {
    id: r.id,
    template_slug: r.template_slug,
    template_name: r.template?.name ?? null,
    title: r.title,
    summary: r.summary,
    reasoning: r.reasoning,
    risk_level: r.risk_level,
    confidence: r.confidence,
    expected_impact: r.expected_impact,
    evidence: Array.isArray(r.evidence) ? r.evidence : [],
    proposed_action: r.proposed_action,
    status: r.status,
    expires_at: r.expires_at,
    decided_at: r.decided_at,
    decided_by_name: r.decided_by?.full_name ?? r.decided_by?.email ?? null,
    decision_reason: r.decision_reason,
    created_at: r.created_at,
    asset_id: r.asset_id,
    asset_name: r.asset?.name ?? null,
    site_id: r.site_id,
    site_name: r.site?.name ?? null,
  };
}

export async function listPendingRecommendations(
  organizationId: string,
): Promise<AgentRecommendation[]> {
  const supabase = await createClient();
  const { data } = await supabase
    .from("agent_recommendations")
    .select(RECOMMENDATION_COLUMNS)
    .eq("organization_id", organizationId)
    .eq("status", "pending")
    .order("created_at", { ascending: false });
  return ((data ?? []) as unknown as Row[]).map(hydrate);
}

export async function listDecidedRecommendations(
  organizationId: string,
): Promise<AgentRecommendation[]> {
  const supabase = await createClient();
  const { data } = await supabase
    .from("agent_recommendations")
    .select(RECOMMENDATION_COLUMNS)
    .eq("organization_id", organizationId)
    .in("status", ["approved", "rejected", "superseded", "expired"])
    .order("decided_at", { ascending: false, nullsFirst: false })
    .order("created_at", { ascending: false })
    .limit(50);
  return ((data ?? []) as unknown as Row[]).map(hydrate);
}

export async function getRecommendationDetail(
  id: string,
): Promise<AgentRecommendation | null> {
  const supabase = await createClient();
  const { data } = await supabase
    .from("agent_recommendations")
    .select(RECOMMENDATION_COLUMNS)
    .eq("id", id)
    .maybeSingle();
  if (!data) return null;
  return hydrate(data as unknown as Row);
}
