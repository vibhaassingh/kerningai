"use server";

import { revalidatePath } from "next/cache";
import { z } from "zod";

import type { ActionResult } from "@/lib/auth/actions";
import { hasPermissionAny, requireUser } from "@/lib/auth/require";
import { withAudit } from "@/lib/audit/with-audit";
import { createServiceClient } from "@/lib/supabase/service";

const visibilityEnum = z.enum([
  "internal_only",
  "partner_visible",
  "client_visible",
  "shared_all",
]);

const addCommentSchema = z.object({
  canvasId: z.string().uuid(),
  organizationId: z.string().uuid(),
  projectId: z.string().uuid(),
  nodeKey: z.string().optional(),
  edgeKey: z.string().optional(),
  body: z.string().min(1).max(2000),
  visibility: visibilityEnum,
});

export async function addCanvasComment(
  _prev: ActionResult | undefined,
  formData: FormData,
): Promise<ActionResult> {
  const parsed = addCommentSchema.safeParse({
    canvasId: formData.get("canvasId"),
    organizationId: formData.get("organizationId"),
    projectId: formData.get("projectId"),
    nodeKey: formData.get("nodeKey") || undefined,
    edgeKey: formData.get("edgeKey") || undefined,
    body: formData.get("body"),
    visibility: formData.get("visibility"),
  });
  if (!parsed.success) {
    return { ok: false, error: parsed.error.issues[0].message };
  }

  if (!(await hasPermissionAny("comment_on_workflow_canvas"))) {
    return { ok: false, error: "Not permitted to comment." };
  }
  const user = await requireUser();
  const service = createServiceClient();

  const { data, error } = await service
    .from("workflow_canvas_comments")
    .insert({
      canvas_id: parsed.data.canvasId,
      node_key: parsed.data.nodeKey ?? null,
      edge_key: parsed.data.edgeKey ?? null,
      user_id: user.id,
      body: parsed.data.body,
      visibility: parsed.data.visibility,
    })
    .select("id")
    .single();
  if (error || !data) {
    return { ok: false, error: error?.message ?? "Could not save comment." };
  }

  await withAudit(
    {
      action: "canvas_comment.added",
      resourceType: "workflow_canvas_comment",
      resourceId: data.id,
      organizationId: parsed.data.organizationId,
      after: {
        canvas_id: parsed.data.canvasId,
        node_key: parsed.data.nodeKey,
        visibility: parsed.data.visibility,
      },
    },
    async () => null,
  );

  revalidatePath(
    `/admin/clients/${parsed.data.organizationId}/projects/${parsed.data.projectId}/workflow-canvas/${parsed.data.canvasId}`,
  );
  revalidatePath(
    `/portal/projects/${parsed.data.projectId}/workflow-canvas/${parsed.data.canvasId}`,
  );
  return { ok: true };
}

const resolveCommentSchema = z.object({
  commentId: z.string().uuid(),
  canvasId: z.string().uuid(),
  organizationId: z.string().uuid(),
});

export async function resolveCanvasComment(
  _prev: ActionResult | undefined,
  formData: FormData,
): Promise<ActionResult> {
  const parsed = resolveCommentSchema.safeParse({
    commentId: formData.get("commentId"),
    canvasId: formData.get("canvasId"),
    organizationId: formData.get("organizationId"),
  });
  if (!parsed.success) return { ok: false, error: parsed.error.issues[0].message };

  if (!(await hasPermissionAny("comment_on_workflow_canvas"))) {
    return { ok: false, error: "Not permitted." };
  }
  const service = createServiceClient();

  const { error } = await service
    .from("workflow_canvas_comments")
    .update({ status: "resolved" })
    .eq("id", parsed.data.commentId);
  if (error) return { ok: false, error: error.message };

  await withAudit(
    {
      action: "canvas_comment.resolved",
      resourceType: "workflow_canvas_comment",
      resourceId: parsed.data.commentId,
      organizationId: parsed.data.organizationId,
      after: { status: "resolved" },
    },
    async () => null,
  );

  return { ok: true };
}
