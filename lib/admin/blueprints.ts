import "server-only";

import { createClient } from "@/lib/supabase/server";

export interface BlueprintListRow {
  id: string;
  submission_id: string;
  organization_id: string | null;
  version: number;
  status: "draft" | "needs_internal_review" | "approved_for_client" | "archived";
  complexity_score: number;
  complexity_band: string;
  summary: string | null;
  generated_by: string;
  generated_at: string;
  approved_at: string | null;
  submitter_name: string | null;
  submitter_company: string | null;
  template_name: string | null;
}

export async function listBlueprints(): Promise<BlueprintListRow[]> {
  const supabase = await createClient();
  const { data } = await supabase
    .from("solution_blueprints")
    .select(
      "id, submission_id, organization_id, version, status, complexity_score, complexity_band, summary, generated_by, generated_at, approved_at, submission:questionnaire_submissions(submitter_name, submitter_company, template:questionnaire_templates(name))",
    )
    .order("generated_at", { ascending: false })
    .limit(200);

  type Row = {
    id: string;
    submission_id: string;
    organization_id: string | null;
    version: number;
    status: BlueprintListRow["status"];
    complexity_score: number;
    complexity_band: string;
    summary: string | null;
    generated_by: string;
    generated_at: string;
    approved_at: string | null;
    submission: {
      submitter_name: string | null;
      submitter_company: string | null;
      template: { name: string } | null;
    } | null;
  };

  return ((data ?? []) as unknown as Row[]).map((r) => ({
    id: r.id,
    submission_id: r.submission_id,
    organization_id: r.organization_id,
    version: r.version,
    status: r.status,
    complexity_score: r.complexity_score,
    complexity_band: r.complexity_band,
    summary: r.summary,
    generated_by: r.generated_by,
    generated_at: r.generated_at,
    approved_at: r.approved_at,
    submitter_name: r.submission?.submitter_name ?? null,
    submitter_company: r.submission?.submitter_company ?? null,
    template_name: r.submission?.template?.name ?? null,
  }));
}

export interface BlueprintDetail {
  id: string;
  submission_id: string;
  organization_id: string | null;
  version: number;
  status: BlueprintListRow["status"];
  complexity_score: number;
  complexity_band: string;
  summary: string | null;
  executive_brief: string | null;
  generated_by: string;
  generated_at: string;
  approved_at: string | null;
  approved_by_name: string | null;
  submitter_name: string | null;
  submitter_email: string | null;
  submitter_company: string | null;
  template_name: string | null;
  template_slug: string | null;
  modules: { id: string; module_slug: string; module_name: string; rationale: string; emphasis: string }[];
  integrations: { id: string; system: string; direction: string; frequency: string; risk: string; notes: string | null }[];
  risks: { id: string; category: string; description: string; severity: string; mitigation: string | null }[];
  phases: {
    id: string;
    position: number;
    name: string;
    description: string | null;
    duration_weeks: number;
    owners: string[];
    deliverables: string[];
  }[];
  checklist: { id: string; category: string; description: string; owner: "kerning" | "client" | "joint" }[];
}

export async function getBlueprintDetail(blueprintId: string): Promise<BlueprintDetail | null> {
  const supabase = await createClient();

  const { data: bp } = await supabase
    .from("solution_blueprints")
    .select(
      "id, submission_id, organization_id, version, status, complexity_score, complexity_band, summary, executive_brief, generated_by, generated_at, approved_at, approved_by:app_users!solution_blueprints_approved_by_id_fkey(full_name, email), submission:questionnaire_submissions(submitter_name, submitter_email, submitter_company, template:questionnaire_templates(name, slug))",
    )
    .eq("id", blueprintId)
    .maybeSingle();
  if (!bp) return null;

  type BPRow = {
    id: string;
    submission_id: string;
    organization_id: string | null;
    version: number;
    status: BlueprintListRow["status"];
    complexity_score: number;
    complexity_band: string;
    summary: string | null;
    executive_brief: string | null;
    generated_by: string;
    generated_at: string;
    approved_at: string | null;
    approved_by: { full_name: string | null; email: string } | null;
    submission: {
      submitter_name: string | null;
      submitter_email: string | null;
      submitter_company: string | null;
      template: { name: string; slug: string } | null;
    } | null;
  };
  const r = bp as unknown as BPRow;

  const [mods, integs, risks, phases, checklist] = await Promise.all([
    supabase
      .from("blueprint_modules")
      .select("id, module_slug, module_name, rationale, emphasis, position")
      .eq("blueprint_id", blueprintId)
      .order("position", { ascending: true }),
    supabase
      .from("blueprint_integrations")
      .select("id, system, direction, frequency, risk, notes, position")
      .eq("blueprint_id", blueprintId)
      .order("position", { ascending: true }),
    supabase
      .from("blueprint_risks")
      .select("id, category, description, severity, mitigation, position")
      .eq("blueprint_id", blueprintId)
      .order("position", { ascending: true }),
    supabase
      .from("blueprint_phases")
      .select("id, position, name, description, duration_weeks, owners, deliverables")
      .eq("blueprint_id", blueprintId)
      .order("position", { ascending: true }),
    supabase
      .from("blueprint_checklist_items")
      .select("id, category, description, owner, position")
      .eq("blueprint_id", blueprintId)
      .order("position", { ascending: true }),
  ]);

  return {
    id: r.id,
    submission_id: r.submission_id,
    organization_id: r.organization_id,
    version: r.version,
    status: r.status,
    complexity_score: r.complexity_score,
    complexity_band: r.complexity_band,
    summary: r.summary,
    executive_brief: r.executive_brief,
    generated_by: r.generated_by,
    generated_at: r.generated_at,
    approved_at: r.approved_at,
    approved_by_name: r.approved_by?.full_name ?? r.approved_by?.email ?? null,
    submitter_name: r.submission?.submitter_name ?? null,
    submitter_email: r.submission?.submitter_email ?? null,
    submitter_company: r.submission?.submitter_company ?? null,
    template_name: r.submission?.template?.name ?? null,
    template_slug: r.submission?.template?.slug ?? null,
    modules: (mods.data ?? []) as BlueprintDetail["modules"],
    integrations: (integs.data ?? []) as BlueprintDetail["integrations"],
    risks: (risks.data ?? []) as BlueprintDetail["risks"],
    phases: (phases.data ?? []) as BlueprintDetail["phases"],
    checklist: (checklist.data ?? []) as BlueprintDetail["checklist"],
  };
}

export async function getLatestBlueprintForSubmission(
  submissionId: string,
): Promise<{ id: string; version: number; status: string } | null> {
  const supabase = await createClient();
  const { data } = await supabase
    .from("solution_blueprints")
    .select("id, version, status")
    .eq("submission_id", submissionId)
    .order("version", { ascending: false })
    .limit(1)
    .maybeSingle();
  return (data as { id: string; version: number; status: string } | null) ?? null;
}
