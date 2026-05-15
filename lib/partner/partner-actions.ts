"use server";

import { revalidatePath } from "next/cache";
import { z } from "zod";

import type { ActionResult } from "@/lib/auth/actions";
import { hasPermissionAny, requireUser } from "@/lib/auth/require";
import { withAudit } from "@/lib/audit/with-audit";
import { createServiceClient } from "@/lib/supabase/service";
import { getCurrentPartnerOrgId } from "@/lib/partner/partner";
import { assertPartnerForProject } from "@/lib/partner/partner-canvas";

const submitLeadSchema = z.object({
  contactName: z.string().min(2).max(120),
  companyName: z.string().min(2).max(200),
  contactEmail: z.string().email(),
  phone: z.string().optional(),
  notes: z.string().max(2000).optional(),
});

export async function submitPartnerLead(
  _prev: ActionResult<{ leadId: string }> | undefined,
  formData: FormData,
): Promise<ActionResult<{ leadId: string }>> {
  const parsed = submitLeadSchema.safeParse({
    contactName: formData.get("contactName"),
    companyName: formData.get("companyName"),
    contactEmail: formData.get("contactEmail"),
    phone: formData.get("phone") || undefined,
    notes: formData.get("notes") || undefined,
  });
  if (!parsed.success) {
    return { ok: false, error: parsed.error.issues[0].message };
  }

  if (!(await hasPermissionAny("submit_partner_lead"))) {
    return { ok: false, error: "Not permitted to submit leads." };
  }

  const partnerOrgId = await getCurrentPartnerOrgId();
  if (!partnerOrgId) {
    return { ok: false, error: "Not signed in as a partner." };
  }

  const user = await requireUser();
  const service = createServiceClient();

  const { data, error } = await service
    .from("leads")
    .insert({
      source: "partner",
      status: "new",
      contact_name: parsed.data.contactName,
      company_name: parsed.data.companyName,
      contact_email: parsed.data.contactEmail,
      intent_summary: parsed.data.notes ?? null,
      created_by_id: user.id,
      metadata: {
        partner_org_id: partnerOrgId,
        submitted_via: "partner_portal",
        phone: parsed.data.phone ?? null,
      },
    })
    .select("id")
    .single();
  if (error || !data) {
    return { ok: false, error: error?.message ?? "Could not submit lead." };
  }

  await withAudit(
    {
      action: "lead.partner_submitted",
      resourceType: "lead",
      resourceId: data.id,
      organizationId: partnerOrgId,
      after: {
        company_name: parsed.data.companyName,
        partner_org_id: partnerOrgId,
      },
    },
    async () => null,
  );

  revalidatePath("/partner/leads");
  revalidatePath("/partner/dashboard");
  return { ok: true, data: { leadId: data.id } };
}

// ---------------------------------------------------------------------------
// addPartnerCanvasRemark
// ---------------------------------------------------------------------------
// A partner leaves a remark on a referred project's canvas. Visibility is
// HARD-CODED to 'partner_visible' so the remark is seen by the partner +
// internal staff only — never the client. The partner-for-project check
// is done server-side from the session (assertPartnerForProject), so a
// forged projectId/canvasId in the form can't grant access.
// ---------------------------------------------------------------------------
const remarkSchema = z.object({
  projectId: z.string().uuid(),
  canvasId: z.string().uuid(),
  nodeKey: z.string().max(200).optional(),
  body: z.string().min(1, "Write a remark.").max(2000),
});

export async function addPartnerCanvasRemark(
  _prev: ActionResult | undefined,
  formData: FormData,
): Promise<ActionResult> {
  const parsed = remarkSchema.safeParse({
    projectId: formData.get("projectId"),
    canvasId: formData.get("canvasId"),
    nodeKey: formData.get("nodeKey") || undefined,
    body: formData.get("body"),
  });
  if (!parsed.success) {
    return { ok: false, error: parsed.error.issues[0].message, field: "body" };
  }

  if (!(await hasPermissionAny("comment_on_workflow_canvas"))) {
    return { ok: false, error: "Your role can view but not comment." };
  }

  // Authoritative gate: the session must be an active member of the
  // partner org that referred THIS project.
  const ctx = await assertPartnerForProject(parsed.data.projectId);
  if (!ctx) {
    return { ok: false, error: "Not a partner for this project." };
  }

  const user = await requireUser();
  const service = createServiceClient();

  // Defence-in-depth: the canvas must belong to the asserted project.
  const { data: canvas } = await service
    .from("workflow_canvases")
    .select("id, project_id, organization_id")
    .eq("id", parsed.data.canvasId)
    .eq("project_id", parsed.data.projectId)
    .maybeSingle();
  if (!canvas) {
    return { ok: false, error: "Canvas not found for this project." };
  }

  const { data, error } = await service
    .from("workflow_canvas_comments")
    .insert({
      canvas_id: parsed.data.canvasId,
      node_key: parsed.data.nodeKey ?? null,
      edge_key: null,
      user_id: user.id,
      body: parsed.data.body,
      // NEVER client_visible/shared_all — partner remarks stay internal.
      visibility: "partner_visible",
    })
    .select("id")
    .single();
  if (error || !data) {
    return { ok: false, error: error?.message ?? "Could not save remark." };
  }

  await withAudit(
    {
      action: "canvas_comment.partner_added",
      resourceType: "workflow_canvas_comment",
      resourceId: data.id,
      organizationId: ctx.organizationId,
      after: {
        canvas_id: parsed.data.canvasId,
        project_id: parsed.data.projectId,
        partner_org_id: ctx.partnerOrgId,
        visibility: "partner_visible",
      },
    },
    async () => null,
  );

  revalidatePath(`/partner/projects/${parsed.data.projectId}/workflow-summary`);
  return { ok: true };
}
