import "server-only";

import { createClient } from "@/lib/supabase/server";

export type ProposalStatus =
  | "draft"
  | "internal_review"
  | "sent"
  | "accepted"
  | "declined"
  | "expired"
  | "archived";

export interface ProposalListRow {
  id: string;
  project_id: string;
  organization_id: string | null;
  version: number;
  status: ProposalStatus;
  title: string;
  currency: string;
  total_amount: number;
  valid_until: string | null;
  generated_by: string;
  created_at: string;
  updated_at: string;
}

export interface ProposalIndexRow {
  id: string;
  project_id: string;
  client_org_id: string | null;
  client_name: string;
  project_name: string;
  version: number;
  status: ProposalStatus;
  title: string;
  currency: string;
  total_amount: number;
  updated_at: string;
}

/**
 * Every proposal across all clients/projects — the admin index. RLS
 * (`proposals_internal_read`) already scopes this to internal staff.
 */
export async function listAllProposals(): Promise<ProposalIndexRow[]> {
  const supabase = await createClient();
  const { data } = await supabase
    .from("proposals")
    .select(
      "id, project_id, organization_id, version, status, title, currency, total_amount, updated_at, project:projects(name), client:organizations(name)",
    )
    .order("updated_at", { ascending: false })
    .limit(300);

  type Row = {
    id: string;
    project_id: string;
    organization_id: string | null;
    version: number;
    status: ProposalStatus;
    title: string;
    currency: string;
    total_amount: number;
    updated_at: string;
    project: { name: string } | null;
    client: { name: string } | null;
  };

  return ((data ?? []) as unknown as Row[]).map((r) => ({
    id: r.id,
    project_id: r.project_id,
    client_org_id: r.organization_id,
    client_name: r.client?.name ?? "—",
    project_name: r.project?.name ?? "—",
    version: r.version,
    status: r.status,
    title: r.title,
    currency: r.currency,
    total_amount: r.total_amount,
    updated_at: r.updated_at,
  }));
}

export async function listProposalsForProject(
  projectId: string,
): Promise<ProposalListRow[]> {
  const supabase = await createClient();
  const { data } = await supabase
    .from("proposals")
    .select(
      "id, project_id, organization_id, version, status, title, currency, total_amount, valid_until, generated_by, created_at, updated_at",
    )
    .eq("project_id", projectId)
    .order("version", { ascending: false });
  return (data ?? []) as ProposalListRow[];
}

export interface ProposalDetail extends ProposalListRow {
  blueprint_id: string | null;
  source_canvas_id: string | null;
  summary: string | null;
  executive_brief: string | null;
  sent_at: string | null;
  decided_at: string | null;
  phases: {
    id: string;
    position: number;
    name: string;
    description: string | null;
    duration_weeks: number;
    owners: string[];
    deliverables: string[];
    price: number | null;
  }[];
  modules: {
    id: string;
    module_slug: string;
    module_name: string;
    rationale: string;
    emphasis: string;
  }[];
  scope_items: {
    id: string;
    kind: "in_scope" | "out_of_scope" | "assumption" | "dependency";
    description: string;
  }[];
  risks: {
    id: string;
    category: string;
    description: string;
    severity: string;
    mitigation: string | null;
  }[];
  commercials: {
    id: string;
    label: string;
    basis: string;
    quantity: number;
    unit_rate: number;
    amount: number;
    notes: string | null;
  }[];
}

export async function getProposalDetail(
  proposalId: string,
): Promise<ProposalDetail | null> {
  const supabase = await createClient();

  const { data: p } = await supabase
    .from("proposals")
    .select(
      "id, project_id, organization_id, blueprint_id, source_canvas_id, version, status, title, summary, executive_brief, currency, total_amount, valid_until, generated_by, sent_at, decided_at, created_at, updated_at",
    )
    .eq("id", proposalId)
    .maybeSingle();
  if (!p) return null;

  const [phases, modules, scope, risks, commercials] = await Promise.all([
    supabase
      .from("proposal_phases")
      .select(
        "id, position, name, description, duration_weeks, owners, deliverables, price",
      )
      .eq("proposal_id", proposalId)
      .order("position", { ascending: true }),
    supabase
      .from("proposal_modules")
      .select("id, module_slug, module_name, rationale, emphasis, position")
      .eq("proposal_id", proposalId)
      .order("position", { ascending: true }),
    supabase
      .from("proposal_scope_items")
      .select("id, kind, description, position")
      .eq("proposal_id", proposalId)
      .order("position", { ascending: true }),
    supabase
      .from("proposal_risks")
      .select("id, category, description, severity, mitigation, position")
      .eq("proposal_id", proposalId)
      .order("position", { ascending: true }),
    supabase
      .from("proposal_commercials")
      .select("id, label, basis, quantity, unit_rate, amount, notes, position")
      .eq("proposal_id", proposalId)
      .order("position", { ascending: true }),
  ]);

  const row = p as unknown as ProposalDetail;
  return {
    ...row,
    phases: (phases.data ?? []) as ProposalDetail["phases"],
    modules: (modules.data ?? []) as ProposalDetail["modules"],
    scope_items: (scope.data ?? []) as ProposalDetail["scope_items"],
    risks: (risks.data ?? []) as ProposalDetail["risks"],
    commercials: (commercials.data ?? []) as ProposalDetail["commercials"],
  };
}

export interface ProposalComment {
  id: string;
  body: string;
  created_at: string;
  author_name: string;
}

/**
 * The shared comment thread for a proposal. RLS
 * (`proposal_comments_read` → `app.proposal_visible`) scopes this to
 * internal staff, the client members, and the referring partner.
 */
export async function listProposalComments(
  proposalId: string,
): Promise<ProposalComment[]> {
  const supabase = await createClient();
  const { data } = await supabase
    .from("proposal_comments")
    .select("id, body, created_at, author:app_users(full_name, email)")
    .eq("proposal_id", proposalId)
    .order("created_at", { ascending: true });

  type Row = {
    id: string;
    body: string;
    created_at: string;
    author: { full_name: string | null; email: string } | null;
  };
  return ((data ?? []) as unknown as Row[]).map((r) => ({
    id: r.id,
    body: r.body,
    created_at: r.created_at,
    author_name: r.author?.full_name ?? r.author?.email ?? "Someone",
  }));
}

export async function getLatestProposalForProject(
  projectId: string,
): Promise<{ id: string; version: number; status: ProposalStatus } | null> {
  const supabase = await createClient();
  const { data } = await supabase
    .from("proposals")
    .select("id, version, status")
    .eq("project_id", projectId)
    .order("version", { ascending: false })
    .limit(1)
    .maybeSingle();
  return (
    (data as { id: string; version: number; status: ProposalStatus } | null) ??
    null
  );
}
