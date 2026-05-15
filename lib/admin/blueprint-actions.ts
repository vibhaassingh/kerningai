"use server";

import { revalidatePath } from "next/cache";
import { z } from "zod";

import type { ActionResult } from "@/lib/auth/actions";
import { hasPermissionAny, requireUser } from "@/lib/auth/require";
import { withAudit } from "@/lib/audit/with-audit";
import { generateBlueprint } from "@/lib/blueprint/generate";
import { createServiceClient } from "@/lib/supabase/service";

const generateSchema = z.object({
  submissionId: z.string().uuid(),
});

/**
 * Builds a fresh blueprint version from the latest answers of the given
 * submission. Always creates a NEW row (with version = max+1) so prior
 * versions stay reviewable.
 */
export async function generateBlueprintForSubmission(
  _prev: ActionResult<{ blueprintId: string }> | undefined,
  formData: FormData,
): Promise<ActionResult<{ blueprintId: string }>> {
  const parsed = generateSchema.safeParse({ submissionId: formData.get("submissionId") });
  if (!parsed.success) {
    return { ok: false, error: parsed.error.issues[0].message };
  }

  if (
    !(await hasPermissionAny("manage_questionnaires")) &&
    !(await hasPermissionAny("approve_solution_blueprints"))
  ) {
    return { ok: false, error: "Not permitted." };
  }

  const user = await requireUser();
  const service = createServiceClient();

  // Load the submission + template metadata + answers we need.
  const { data: submission } = await service
    .from("questionnaire_submissions")
    .select(
      "id, status, template:questionnaire_templates(name, slug, service)",
    )
    .eq("id", parsed.data.submissionId)
    .maybeSingle();
  if (!submission) return { ok: false, error: "Submission not found." };
  if (submission.status === "draft") {
    return { ok: false, error: "Wait for the prospect to submit before generating." };
  }

  type SubRow = {
    id: string;
    template: { name: string; slug: string; service: string } | null;
  };
  const s = submission as unknown as SubRow;

  // Pull answers as { slug: value } so the rule engine can read by slug.
  const { data: answerRows } = await service
    .from("questionnaire_answers")
    .select("value, question:questionnaire_questions(slug)")
    .eq("submission_id", parsed.data.submissionId);

  type AnswerRow = { value: unknown; question: { slug: string } | null };
  const answers: Record<string, unknown> = {};
  for (const a of ((answerRows ?? []) as unknown as AnswerRow[])) {
    if (a.question?.slug) answers[a.question.slug] = a.value;
  }

  const industry =
    (answers["context.industry"] as string | undefined) ??
    (answers["ctx.industry"] as string | undefined) ??
    null;

  const blueprint = generateBlueprint({
    templateSlug: s.template?.slug ?? "unknown",
    templateName: s.template?.name ?? "Discovery",
    service: s.template?.service ?? "unknown",
    industry,
    answers,
  });

  // Compute next version.
  const { data: priorVersions } = await service
    .from("solution_blueprints")
    .select("version")
    .eq("submission_id", parsed.data.submissionId)
    .order("version", { ascending: false })
    .limit(1);
  const nextVersion =
    ((priorVersions ?? [])[0] as { version?: number })?.version
      ? ((priorVersions ?? [])[0] as { version: number }).version + 1
      : 1;

  // Insert blueprint row.
  const { data: created, error: createError } = await service
    .from("solution_blueprints")
    .insert({
      submission_id: parsed.data.submissionId,
      version: nextVersion,
      status: "needs_internal_review",
      complexity_score: blueprint.score.score,
      complexity_band: blueprint.score.band,
      summary: blueprint.summary,
      executive_brief: blueprint.executiveBrief,
      generated_by: "rule_based",
      metadata: { drivers: blueprint.score.drivers },
    })
    .select("id")
    .single();
  if (createError || !created) {
    return { ok: false, error: createError?.message ?? "Could not create blueprint." };
  }

  // Insert child rows in parallel.
  await Promise.all([
    service.from("blueprint_modules").insert(
      blueprint.modules.map((m, idx) => ({
        blueprint_id: created.id,
        module_slug: m.slug,
        module_name: m.name,
        rationale: m.rationale,
        emphasis: m.emphasis,
        position: idx,
      })),
    ),
    blueprint.integrations.length > 0 &&
      service.from("blueprint_integrations").insert(
        blueprint.integrations.map((i, idx) => ({
          blueprint_id: created.id,
          system: i.system,
          direction: i.direction,
          frequency: i.frequency,
          risk: i.risk,
          notes: i.notes,
          position: idx,
        })),
      ),
    service.from("blueprint_risks").insert(
      blueprint.risks.map((r, idx) => ({
        blueprint_id: created.id,
        category: r.category,
        description: r.description,
        severity: r.severity,
        mitigation: r.mitigation,
        position: idx,
      })),
    ),
    service.from("blueprint_phases").insert(
      blueprint.phases.map((p, idx) => ({
        blueprint_id: created.id,
        position: idx,
        name: p.name,
        description: p.description,
        duration_weeks: p.duration_weeks,
        owners: p.owners,
        deliverables: p.deliverables,
      })),
    ),
    service.from("blueprint_checklist_items").insert(
      blueprint.checklist.map((c, idx) => ({
        blueprint_id: created.id,
        category: c.category,
        description: c.description,
        owner: c.owner,
        position: idx,
      })),
    ),
  ]);

  await withAudit(
    {
      action: "blueprint.generated",
      resourceType: "solution_blueprint",
      resourceId: created.id,
      after: {
        submission_id: parsed.data.submissionId,
        version: nextVersion,
        complexity: blueprint.score.score,
      },
    },
    async () => null,
  );

  // Best-effort: attach a note to the lead.
  const { data: lead } = await service
    .from("leads")
    .select("id")
    .eq("submission_id", parsed.data.submissionId)
    .maybeSingle();
  if (lead) {
    await service.from("lead_activities").insert({
      lead_id: lead.id,
      kind: "note",
      actor_id: user.id,
      body: `Generated blueprint v${nextVersion} (complexity ${blueprint.score.score}/100, ${blueprint.score.band}).`,
      payload: { blueprint_id: created.id, version: nextVersion },
    });
  }

  revalidatePath(`/admin/questionnaires/submissions/${parsed.data.submissionId}`);
  revalidatePath("/admin/solution-blueprints");
  return { ok: true, data: { blueprintId: created.id } };
}

const approveSchema = z.object({
  blueprintId: z.string().uuid(),
});

export async function approveBlueprint(
  _prev: ActionResult | undefined,
  formData: FormData,
): Promise<ActionResult> {
  const parsed = approveSchema.safeParse({ blueprintId: formData.get("blueprintId") });
  if (!parsed.success) return { ok: false, error: parsed.error.issues[0].message };

  if (!(await hasPermissionAny("approve_solution_blueprints"))) {
    return { ok: false, error: "Not permitted to approve blueprints." };
  }
  const user = await requireUser();
  const service = createServiceClient();

  const { data: bp } = await service
    .from("solution_blueprints")
    .select("id, submission_id, status, organization_id")
    .eq("id", parsed.data.blueprintId)
    .maybeSingle();
  if (!bp) return { ok: false, error: "Blueprint not found." };
  if (bp.status === "approved_for_client") {
    return { ok: true };
  }

  // Resolve the organisation by following the submission → lead → client_id.
  let orgId: string | null = bp.organization_id;
  if (!orgId) {
    const { data: lead } = await service
      .from("leads")
      .select("client_id")
      .eq("submission_id", bp.submission_id)
      .maybeSingle();
    orgId = lead?.client_id ?? null;
  }

  // Archive any prior approved blueprint for this submission so only one
  // version is "live" to the client at a time.
  await service
    .from("solution_blueprints")
    .update({ status: "archived" })
    .eq("submission_id", bp.submission_id)
    .eq("status", "approved_for_client");

  const { error } = await service
    .from("solution_blueprints")
    .update({
      status: "approved_for_client",
      approved_at: new Date().toISOString(),
      approved_by_id: user.id,
      organization_id: orgId,
    })
    .eq("id", parsed.data.blueprintId);
  if (error) return { ok: false, error: error.message };

  await withAudit(
    {
      action: "blueprint.approved",
      resourceType: "solution_blueprint",
      resourceId: parsed.data.blueprintId,
      organizationId: orgId ?? undefined,
      after: { organization_id: orgId },
    },
    async () => null,
  );

  revalidatePath(`/admin/solution-blueprints/${parsed.data.blueprintId}`);
  revalidatePath("/admin/solution-blueprints");
  if (orgId) revalidatePath(`/portal/blueprint/${parsed.data.blueprintId}`);
  return { ok: true };
}
