import "server-only";

import { createClient } from "@/lib/supabase/server";

export interface LeadListRow {
  id: string;
  source: string;
  status: string;
  company_name: string | null;
  contact_name: string;
  contact_email: string;
  contact_role: string | null;
  score: number | null;
  owner_id: string | null;
  owner_name: string | null;
  client_id: string | null;
  client_name: string | null;
  created_at: string;
}

export async function listLeads(): Promise<LeadListRow[]> {
  const supabase = await createClient();
  const { data } = await supabase
    .from("leads")
    .select(
      "id, source, status, company_name, contact_name, contact_email, contact_role, score, owner_id, client_id, created_at, owner:app_users!leads_owner_id_fkey(full_name, email), client:organizations!leads_client_id_fkey(name)",
    )
    .order("created_at", { ascending: false })
    .limit(200);

  type Row = {
    id: string;
    source: string;
    status: string;
    company_name: string | null;
    contact_name: string;
    contact_email: string;
    contact_role: string | null;
    score: number | null;
    owner_id: string | null;
    client_id: string | null;
    created_at: string;
    owner: { full_name: string | null; email: string } | null;
    client: { name: string } | null;
  };

  return ((data ?? []) as unknown as Row[]).map((r) => ({
    id: r.id,
    source: r.source,
    status: r.status,
    company_name: r.company_name,
    contact_name: r.contact_name,
    contact_email: r.contact_email,
    contact_role: r.contact_role,
    score: r.score,
    owner_id: r.owner_id,
    owner_name: r.owner?.full_name ?? r.owner?.email ?? null,
    client_id: r.client_id,
    client_name: r.client?.name ?? null,
    created_at: r.created_at,
  }));
}

export interface LeadDetail extends LeadListRow {
  intent_summary: string | null;
  interested_in: string[];
  raw_payload: Record<string, unknown>;
  updated_at: string;
  /** Org type of the converted org (client | partner | internal), if any. */
  client_type: string | null;
}

export async function getLeadDetail(leadId: string): Promise<LeadDetail | null> {
  const supabase = await createClient();
  const { data } = await supabase
    .from("leads")
    .select(
      "id, source, status, company_name, contact_name, contact_email, contact_role, intent_summary, interested_in, score, owner_id, client_id, raw_payload, created_at, updated_at, owner:app_users!leads_owner_id_fkey(full_name, email), client:organizations!leads_client_id_fkey(name, type)",
    )
    .eq("id", leadId)
    .maybeSingle();

  if (!data) return null;

  type Row = {
    id: string;
    source: string;
    status: string;
    company_name: string | null;
    contact_name: string;
    contact_email: string;
    contact_role: string | null;
    intent_summary: string | null;
    interested_in: string[] | null;
    score: number | null;
    owner_id: string | null;
    client_id: string | null;
    raw_payload: Record<string, unknown>;
    created_at: string;
    updated_at: string;
    owner: { full_name: string | null; email: string } | null;
    client: { name: string; type: string } | null;
  };
  const r = data as unknown as Row;

  return {
    id: r.id,
    source: r.source,
    status: r.status,
    company_name: r.company_name,
    contact_name: r.contact_name,
    contact_email: r.contact_email,
    contact_role: r.contact_role,
    intent_summary: r.intent_summary,
    interested_in: r.interested_in ?? [],
    score: r.score,
    owner_id: r.owner_id,
    owner_name: r.owner?.full_name ?? r.owner?.email ?? null,
    client_id: r.client_id,
    client_name: r.client?.name ?? null,
    client_type: r.client?.type ?? null,
    created_at: r.created_at,
    updated_at: r.updated_at,
    raw_payload: r.raw_payload,
  };
}

export interface LeadActivity {
  id: string;
  kind: string;
  body: string | null;
  payload: Record<string, unknown>;
  created_at: string;
  actor_name: string | null;
}

export async function listLeadActivities(leadId: string): Promise<LeadActivity[]> {
  const supabase = await createClient();
  const { data } = await supabase
    .from("lead_activities")
    .select(
      "id, kind, body, payload, created_at, actor:app_users(full_name, email)",
    )
    .eq("lead_id", leadId)
    .order("created_at", { ascending: false });

  type Row = {
    id: string;
    kind: string;
    body: string | null;
    payload: Record<string, unknown>;
    created_at: string;
    actor: { full_name: string | null; email: string } | null;
  };

  return ((data ?? []) as unknown as Row[]).map((r) => ({
    id: r.id,
    kind: r.kind,
    body: r.body,
    payload: r.payload,
    created_at: r.created_at,
    actor_name: r.actor?.full_name ?? r.actor?.email ?? null,
  }));
}

export interface PipelineStage {
  slug: string;
  name: string;
  position: number;
  is_won: boolean;
  is_lost: boolean;
  is_dormant: boolean;
}

export async function listPipelineStages(): Promise<PipelineStage[]> {
  const supabase = await createClient();
  const { data } = await supabase
    .from("pipeline_stages")
    .select("slug, name, position, is_won, is_lost, is_dormant")
    .order("position", { ascending: true });
  return (data ?? []) as PipelineStage[];
}
