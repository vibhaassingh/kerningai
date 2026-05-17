"use server";

import { revalidatePath } from "next/cache";
import { z } from "zod";

import type { ActionResult } from "@/lib/auth/actions";
import { hasPermissionAny, requireUser } from "@/lib/auth/require";
import { withAudit } from "@/lib/audit/with-audit";
import { createServiceClient } from "@/lib/supabase/service";
import { getUserMemberships } from "@/lib/tenancy/current-org";
import { deriveProposalFromCanvas } from "@/lib/proposal/derive";
import type { WorkflowCanvasNode } from "@/lib/workflow-canvas/types";

function round2(n: number): number {
  return Math.round((n + Number.EPSILON) * 100) / 100;
}

function revalidateProposal(
  clientOrgId: string | null,
  projectId: string,
  proposalId: string,
) {
  if (clientOrgId) {
    revalidatePath(
      `/admin/clients/${clientOrgId}/projects/${projectId}/proposal/workflow`,
    );
    revalidatePath(`/admin/clients/${clientOrgId}/projects/${projectId}/overview`);
  }
  revalidatePath(`/portal/proposals/${proposalId}`);
}

// ---------------------------------------------------------------------------
// Generate a fresh proposal version from the project's combined canvas.
// ---------------------------------------------------------------------------
const generateSchema = z.object({ projectId: z.string().uuid() });

export async function generateProposalForProject(
  _prev: ActionResult<{ proposalId: string }> | undefined,
  formData: FormData,
): Promise<ActionResult<{ proposalId: string }>> {
  const parsed = generateSchema.safeParse({
    projectId: formData.get("projectId"),
  });
  if (!parsed.success) {
    return { ok: false, error: parsed.error.issues[0].message };
  }
  if (!(await hasPermissionAny("manage_proposals"))) {
    return { ok: false, error: "Not permitted to manage proposals." };
  }

  const user = await requireUser();
  const service = createServiceClient();

  const { data: project } = await service
    .from("projects")
    .select("id, name, organization_id, industry_label")
    .eq("id", parsed.data.projectId)
    .maybeSingle();
  if (!project) return { ok: false, error: "Project not found." };

  const { data: settings } = await service
    .from("client_settings")
    .select("industry, currency")
    .eq("organization_id", project.organization_id)
    .maybeSingle();

  const { data: canvas } = await service
    .from("workflow_canvases")
    .select("id")
    .eq("project_id", parsed.data.projectId)
    .eq("canvas_type", "combined")
    .maybeSingle();
  if (!canvas) {
    return {
      ok: false,
      error: "No combined workflow canvas exists for this project.",
    };
  }

  const { data: nodeRows } = await service
    .from("workflow_canvas_nodes")
    .select("*")
    .eq("canvas_id", canvas.id);
  const nodes = (nodeRows ?? []) as unknown as WorkflowCanvasNode[];
  if (nodes.length === 0) {
    return { ok: false, error: "The combined canvas has no nodes to derive from." };
  }

  const draft = deriveProposalFromCanvas({
    nodes,
    projectName: project.name as string,
    industry:
      (settings?.industry as string | undefined) ??
      (project.industry_label as string | undefined) ??
      null,
  });

  const { data: priorVersions } = await service
    .from("proposals")
    .select("version")
    .eq("project_id", parsed.data.projectId)
    .order("version", { ascending: false })
    .limit(1);
  const nextVersion =
    ((priorVersions ?? [])[0] as { version?: number })?.version
      ? ((priorVersions ?? [])[0] as { version: number }).version + 1
      : 1;

  const { data: created, error: createError } = await service
    .from("proposals")
    .insert({
      project_id: parsed.data.projectId,
      organization_id: project.organization_id,
      source_canvas_id: canvas.id,
      version: nextVersion,
      status: "draft",
      title: draft.title,
      summary: draft.summary,
      executive_brief: draft.executiveBrief,
      currency: (settings?.currency as string | undefined) ?? "INR",
      total_amount: 0,
      generated_by: "canvas_derived",
      prepared_by_id: user.id,
    })
    .select("id")
    .single();
  if (createError || !created) {
    return {
      ok: false,
      error: createError?.message ?? "Could not create proposal.",
    };
  }

  await Promise.all([
    service.from("proposal_phases").insert(
      draft.phases.map((p, idx) => ({
        proposal_id: created.id,
        position: idx,
        name: p.name,
        description: p.description,
        duration_weeks: p.duration_weeks,
        owners: p.owners,
        deliverables: p.deliverables,
        price: p.price,
      })),
    ),
    draft.modules.length > 0 &&
      service.from("proposal_modules").insert(
        draft.modules.map((m, idx) => ({
          proposal_id: created.id,
          module_slug: m.slug,
          module_name: m.name,
          rationale: m.rationale,
          emphasis: m.emphasis,
          position: idx,
        })),
      ),
    service.from("proposal_scope_items").insert(
      draft.scopeItems.map((s, idx) => ({
        proposal_id: created.id,
        kind: s.kind,
        description: s.description,
        position: idx,
      })),
    ),
    service.from("proposal_risks").insert(
      draft.risks.map((r, idx) => ({
        proposal_id: created.id,
        category: r.category,
        description: r.description,
        severity: r.severity,
        mitigation: r.mitigation,
        position: idx,
      })),
    ),
    service.from("proposal_commercials").insert(
      draft.commercials.map((c, idx) => ({
        proposal_id: created.id,
        label: c.label,
        basis: c.basis,
        quantity: c.quantity,
        unit_rate: c.unit_rate,
        amount: c.amount,
        notes: c.notes,
        position: idx,
      })),
    ),
  ]);

  await withAudit(
    {
      action: "proposal.generated",
      resourceType: "proposal",
      resourceId: created.id,
      organizationId: project.organization_id ?? undefined,
      after: { project_id: parsed.data.projectId, version: nextVersion },
    },
    async () => null,
  );

  revalidateProposal(
    project.organization_id as string | null,
    parsed.data.projectId,
    created.id,
  );
  return { ok: true, data: { proposalId: created.id } };
}

// ---------------------------------------------------------------------------
// Edit top-level narrative + commercial header fields (draft / review only).
// ---------------------------------------------------------------------------
const basicsSchema = z.object({
  proposalId: z.string().uuid(),
  title: z.string().min(1, "Title is required."),
  summary: z.string().optional(),
  executive_brief: z.string().optional(),
  currency: z.string().min(1).max(8),
  valid_until: z.string().optional(),
});

export async function saveProposalBasics(
  _prev: ActionResult | undefined,
  formData: FormData,
): Promise<ActionResult> {
  const parsed = basicsSchema.safeParse({
    proposalId: formData.get("proposalId"),
    title: formData.get("title"),
    summary: formData.get("summary") ?? undefined,
    executive_brief: formData.get("executive_brief") ?? undefined,
    currency: formData.get("currency"),
    valid_until: formData.get("valid_until") || undefined,
  });
  if (!parsed.success) {
    return { ok: false, error: parsed.error.issues[0].message };
  }
  if (!(await hasPermissionAny("manage_proposals"))) {
    return { ok: false, error: "Not permitted to manage proposals." };
  }
  await requireUser();
  const service = createServiceClient();

  const { data: existing } = await service
    .from("proposals")
    .select("id, status, project_id, organization_id")
    .eq("id", parsed.data.proposalId)
    .maybeSingle();
  if (!existing) return { ok: false, error: "Proposal not found." };
  if (existing.status !== "draft" && existing.status !== "internal_review") {
    return { ok: false, error: "Only draft or in-review proposals are editable." };
  }

  const { error } = await service
    .from("proposals")
    .update({
      title: parsed.data.title,
      summary: parsed.data.summary ?? null,
      executive_brief: parsed.data.executive_brief ?? null,
      currency: parsed.data.currency,
      valid_until: parsed.data.valid_until ?? null,
    })
    .eq("id", parsed.data.proposalId);
  if (error) return { ok: false, error: error.message };

  await withAudit(
    {
      action: "proposal.updated",
      resourceType: "proposal",
      resourceId: parsed.data.proposalId,
      organizationId: existing.organization_id ?? undefined,
    },
    async () => null,
  );

  revalidateProposal(
    existing.organization_id as string | null,
    existing.project_id as string,
    parsed.data.proposalId,
  );
  return { ok: true };
}

// ---------------------------------------------------------------------------
// Replace the commercial line items + recompute the total.
// ---------------------------------------------------------------------------
const commercialLine = z.object({
  label: z.string().min(1),
  basis: z.enum([
    "fixed",
    "time_and_materials",
    "license",
    "subscription",
    "one_time",
  ]),
  quantity: z.number().nonnegative(),
  unit_rate: z.number().nonnegative(),
  notes: z.string().nullable().optional(),
});

export async function saveProposalCommercials(
  _prev: ActionResult | undefined,
  formData: FormData,
): Promise<ActionResult> {
  const proposalId = formData.get("proposalId");
  if (typeof proposalId !== "string") {
    return { ok: false, error: "Missing proposal." };
  }
  let lines: z.infer<typeof commercialLine>[];
  try {
    lines = z
      .array(commercialLine)
      .parse(JSON.parse(String(formData.get("lines") ?? "[]")));
  } catch {
    return { ok: false, error: "Commercial lines are malformed." };
  }
  if (!(await hasPermissionAny("manage_proposals"))) {
    return { ok: false, error: "Not permitted to manage proposals." };
  }
  await requireUser();
  const service = createServiceClient();

  const { data: existing } = await service
    .from("proposals")
    .select("id, status, project_id, organization_id")
    .eq("id", proposalId)
    .maybeSingle();
  if (!existing) return { ok: false, error: "Proposal not found." };
  if (existing.status !== "draft" && existing.status !== "internal_review") {
    return { ok: false, error: "Only draft or in-review proposals are editable." };
  }

  const priced = lines.map((l, idx) => ({
    proposal_id: proposalId,
    label: l.label,
    basis: l.basis,
    quantity: l.quantity,
    unit_rate: l.unit_rate,
    amount: round2(l.quantity * l.unit_rate),
    notes: l.notes ?? null,
    position: idx,
  }));
  const total = round2(priced.reduce((acc, l) => acc + l.amount, 0));

  await service
    .from("proposal_commercials")
    .delete()
    .eq("proposal_id", proposalId);
  if (priced.length > 0) {
    const { error } = await service.from("proposal_commercials").insert(priced);
    if (error) return { ok: false, error: error.message };
  }
  await service
    .from("proposals")
    .update({ total_amount: total })
    .eq("id", proposalId);

  await withAudit(
    {
      action: "proposal.commercials_updated",
      resourceType: "proposal",
      resourceId: proposalId,
      organizationId: existing.organization_id ?? undefined,
      after: { total_amount: total, lines: priced.length },
    },
    async () => null,
  );

  revalidateProposal(
    existing.organization_id as string | null,
    existing.project_id as string,
    proposalId,
  );
  return { ok: true };
}

// ---------------------------------------------------------------------------
// Replace the delivery phases.
// ---------------------------------------------------------------------------
const phaseRow = z.object({
  name: z.string().min(1),
  description: z.string().nullable().optional(),
  duration_weeks: z.number().int().nonnegative(),
  owners: z.array(z.string()),
  deliverables: z.array(z.string()),
  price: z.number().nonnegative().nullable().optional(),
});

const scopeRow = z.object({
  kind: z.enum(["in_scope", "out_of_scope", "assumption", "dependency"]),
  description: z.string().min(1),
});

const riskRow = z.object({
  category: z.string().min(1),
  description: z.string().min(1),
  severity: z.enum(["low", "medium", "high", "critical"]),
  mitigation: z.string().nullable().optional(),
});

async function loadEditable(
  proposalId: string,
): Promise<
  | { ok: false; error: string }
  | {
      ok: true;
      project_id: string;
      organization_id: string | null;
      service: ReturnType<typeof createServiceClient>;
    }
> {
  if (!(await hasPermissionAny("manage_proposals"))) {
    return { ok: false, error: "Not permitted to manage proposals." };
  }
  await requireUser();
  const service = createServiceClient();
  const { data: existing } = await service
    .from("proposals")
    .select("id, status, project_id, organization_id")
    .eq("id", proposalId)
    .maybeSingle();
  if (!existing) return { ok: false, error: "Proposal not found." };
  if (existing.status !== "draft" && existing.status !== "internal_review") {
    return { ok: false, error: "Only draft or in-review proposals are editable." };
  }
  return {
    ok: true,
    project_id: existing.project_id as string,
    organization_id: existing.organization_id as string | null,
    service,
  };
}

function parseRows<T>(
  formData: FormData,
  schema: z.ZodType<T[]>,
): { ok: true; rows: T[] } | { ok: false } {
  try {
    return {
      ok: true,
      rows: schema.parse(JSON.parse(String(formData.get("rows") ?? "[]"))),
    };
  } catch {
    return { ok: false };
  }
}

export async function saveProposalPhases(
  _prev: ActionResult | undefined,
  formData: FormData,
): Promise<ActionResult> {
  const proposalId = formData.get("proposalId");
  if (typeof proposalId !== "string") return { ok: false, error: "Missing proposal." };
  const parsed = parseRows(formData, z.array(phaseRow));
  if (!parsed.ok) return { ok: false, error: "Phases are malformed." };

  const ctx = await loadEditable(proposalId);
  if (!ctx.ok) return ctx;

  await ctx.service.from("proposal_phases").delete().eq("proposal_id", proposalId);
  if (parsed.rows.length > 0) {
    const { error } = await ctx.service.from("proposal_phases").insert(
      parsed.rows.map((p, idx) => ({
        proposal_id: proposalId,
        position: idx,
        name: p.name,
        description: p.description ?? null,
        duration_weeks: p.duration_weeks,
        owners: p.owners.filter(Boolean),
        deliverables: p.deliverables.filter(Boolean),
        price: p.price ?? null,
      })),
    );
    if (error) return { ok: false, error: error.message };
  }

  await withAudit(
    {
      action: "proposal.phases_updated",
      resourceType: "proposal",
      resourceId: proposalId,
      organizationId: ctx.organization_id ?? undefined,
      after: { phases: parsed.rows.length },
    },
    async () => null,
  );
  revalidateProposal(ctx.organization_id, ctx.project_id, proposalId);
  return { ok: true };
}

export async function saveProposalScope(
  _prev: ActionResult | undefined,
  formData: FormData,
): Promise<ActionResult> {
  const proposalId = formData.get("proposalId");
  if (typeof proposalId !== "string") return { ok: false, error: "Missing proposal." };
  const parsed = parseRows(formData, z.array(scopeRow));
  if (!parsed.ok) return { ok: false, error: "Scope items are malformed." };

  const ctx = await loadEditable(proposalId);
  if (!ctx.ok) return ctx;

  await ctx.service
    .from("proposal_scope_items")
    .delete()
    .eq("proposal_id", proposalId);
  if (parsed.rows.length > 0) {
    const { error } = await ctx.service.from("proposal_scope_items").insert(
      parsed.rows.map((s, idx) => ({
        proposal_id: proposalId,
        kind: s.kind,
        description: s.description,
        position: idx,
      })),
    );
    if (error) return { ok: false, error: error.message };
  }

  await withAudit(
    {
      action: "proposal.scope_updated",
      resourceType: "proposal",
      resourceId: proposalId,
      organizationId: ctx.organization_id ?? undefined,
      after: { items: parsed.rows.length },
    },
    async () => null,
  );
  revalidateProposal(ctx.organization_id, ctx.project_id, proposalId);
  return { ok: true };
}

export async function saveProposalRisks(
  _prev: ActionResult | undefined,
  formData: FormData,
): Promise<ActionResult> {
  const proposalId = formData.get("proposalId");
  if (typeof proposalId !== "string") return { ok: false, error: "Missing proposal." };
  const parsed = parseRows(formData, z.array(riskRow));
  if (!parsed.ok) return { ok: false, error: "Risks are malformed." };

  const ctx = await loadEditable(proposalId);
  if (!ctx.ok) return ctx;

  await ctx.service.from("proposal_risks").delete().eq("proposal_id", proposalId);
  if (parsed.rows.length > 0) {
    const { error } = await ctx.service.from("proposal_risks").insert(
      parsed.rows.map((r, idx) => ({
        proposal_id: proposalId,
        category: r.category,
        description: r.description,
        severity: r.severity,
        mitigation: r.mitigation ?? null,
        position: idx,
      })),
    );
    if (error) return { ok: false, error: error.message };
  }

  await withAudit(
    {
      action: "proposal.risks_updated",
      resourceType: "proposal",
      resourceId: proposalId,
      organizationId: ctx.organization_id ?? undefined,
      after: { risks: parsed.rows.length },
    },
    async () => null,
  );
  revalidateProposal(ctx.organization_id, ctx.project_id, proposalId);
  return { ok: true };
}

// ---------------------------------------------------------------------------
// Internal status transitions (draft → internal_review → sent / archived).
// ---------------------------------------------------------------------------
const ALLOWED: Record<string, string[]> = {
  draft: ["internal_review", "archived"],
  internal_review: ["draft", "sent", "archived"],
  sent: ["archived"],
  accepted: ["archived"],
  declined: ["draft", "archived"],
  expired: ["draft", "archived"],
};

const transitionSchema = z.object({
  proposalId: z.string().uuid(),
  target: z.enum(["draft", "internal_review", "sent", "archived"]),
});

export async function transitionProposalStatus(
  _prev: ActionResult | undefined,
  formData: FormData,
): Promise<ActionResult> {
  const parsed = transitionSchema.safeParse({
    proposalId: formData.get("proposalId"),
    target: formData.get("target"),
  });
  if (!parsed.success) {
    return { ok: false, error: parsed.error.issues[0].message };
  }
  if (!(await hasPermissionAny("manage_proposals"))) {
    return { ok: false, error: "Not permitted to manage proposals." };
  }
  await requireUser();
  const service = createServiceClient();

  const { data: bp } = await service
    .from("proposals")
    .select("id, status, project_id, organization_id")
    .eq("id", parsed.data.proposalId)
    .maybeSingle();
  if (!bp) return { ok: false, error: "Proposal not found." };
  if (bp.status === parsed.data.target) return { ok: true };
  if (!(ALLOWED[bp.status] ?? []).includes(parsed.data.target)) {
    return {
      ok: false,
      error: `Cannot move a ${bp.status} proposal to ${parsed.data.target}.`,
    };
  }

  const patch: Record<string, unknown> = { status: parsed.data.target };
  if (parsed.data.target === "sent") patch.sent_at = new Date().toISOString();

  const { error } = await service
    .from("proposals")
    .update(patch)
    .eq("id", parsed.data.proposalId);
  if (error) return { ok: false, error: error.message };

  // When a proposal is sent, nudge the project into the proposal stage.
  if (parsed.data.target === "sent") {
    await service
      .from("projects")
      .update({ status: "proposal" })
      .eq("id", bp.project_id)
      .in("status", ["discovery"]);
  }

  await withAudit(
    {
      action: "proposal.status_changed",
      resourceType: "proposal",
      resourceId: parsed.data.proposalId,
      organizationId: bp.organization_id ?? undefined,
      before: { status: bp.status },
      after: { status: parsed.data.target },
    },
    async () => null,
  );

  revalidateProposal(
    bp.organization_id as string | null,
    bp.project_id as string,
    parsed.data.proposalId,
  );
  return { ok: true };
}

// ---------------------------------------------------------------------------
// Client decision — accept or decline a sent proposal.
// ---------------------------------------------------------------------------
const decideSchema = z.object({
  proposalId: z.string().uuid(),
  decision: z.enum(["accepted", "declined"]),
});

export async function decideProposal(
  _prev: ActionResult | undefined,
  formData: FormData,
): Promise<ActionResult> {
  const parsed = decideSchema.safeParse({
    proposalId: formData.get("proposalId"),
    decision: formData.get("decision"),
  });
  if (!parsed.success) {
    return { ok: false, error: parsed.error.issues[0].message };
  }
  const user = await requireUser();
  const service = createServiceClient();

  const { data: prop } = await service
    .from("proposals")
    .select("id, status, project_id, organization_id")
    .eq("id", parsed.data.proposalId)
    .maybeSingle();
  if (!prop) return { ok: false, error: "Proposal not found." };
  if (prop.status !== "sent") {
    return { ok: false, error: "This proposal is not awaiting a decision." };
  }

  // The client member must belong to the proposal's organization.
  const memberships = await getUserMemberships();
  const isMember = memberships.some(
    (m) => m.organizationId === prop.organization_id,
  );
  if (!isMember) {
    return { ok: false, error: "Not permitted to decide this proposal." };
  }

  const { error } = await service
    .from("proposals")
    .update({
      status: parsed.data.decision,
      decided_at: new Date().toISOString(),
      decided_by_id: user.id,
    })
    .eq("id", parsed.data.proposalId);
  if (error) return { ok: false, error: error.message };

  if (parsed.data.decision === "accepted") {
    await service
      .from("projects")
      .update({ status: "implementation" })
      .eq("id", prop.project_id)
      .in("status", ["discovery", "proposal"]);
  }

  await withAudit(
    {
      action: "proposal.decided",
      resourceType: "proposal",
      resourceId: parsed.data.proposalId,
      organizationId: prop.organization_id ?? undefined,
      after: { decision: parsed.data.decision },
    },
    async () => null,
  );

  revalidateProposal(
    prop.organization_id as string | null,
    prop.project_id as string,
    parsed.data.proposalId,
  );
  return { ok: true };
}
