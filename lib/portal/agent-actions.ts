"use server";

import { revalidatePath } from "next/cache";
import { z } from "zod";

import type { ActionResult } from "@/lib/auth/actions";
import { withAudit } from "@/lib/audit/with-audit";
import { hasPermissionAny, requireUser } from "@/lib/auth/require";
import { createServiceClient } from "@/lib/supabase/service";

const decideSchema = z.object({
  recommendationId: z.string().uuid(),
  reason: z.string().optional(),
});

async function decide(
  recommendationId: string,
  kind: "approved" | "rejected",
  reason: string | undefined,
): Promise<ActionResult> {
  if (!(await hasPermissionAny("approve_agent_actions"))) {
    return { ok: false, error: "You don't have permission to decide on agent actions." };
  }
  const user = await requireUser();
  const service = createServiceClient();

  const { data: rec } = await service
    .from("agent_recommendations")
    .select("id, organization_id, status, title")
    .eq("id", recommendationId)
    .maybeSingle();
  if (!rec) return { ok: false, error: "Recommendation not found." };
  if (rec.status !== "pending") {
    return { ok: false, error: `Recommendation is already ${rec.status}.` };
  }

  const newStatus = kind === "approved" ? "approved" : "rejected";

  const { error } = await service
    .from("agent_recommendations")
    .update({
      status: newStatus,
      decided_at: new Date().toISOString(),
      decided_by_id: user.id,
      decision_reason: reason ?? null,
    })
    .eq("id", recommendationId);
  if (error) return { ok: false, error: error.message };

  await service.from("agent_actions").insert({
    organization_id: rec.organization_id,
    recommendation_id: recommendationId,
    kind,
    actor_id: user.id,
    reason: reason ?? null,
  });

  await withAudit(
    {
      action: kind === "approved" ? "agent_recommendation.approved" : "agent_recommendation.rejected",
      resourceType: "agent_recommendation",
      resourceId: recommendationId,
      organizationId: rec.organization_id,
      after: { status: newStatus, reason: reason ?? null },
    },
    async () => null,
  );

  revalidatePath("/portal/agents/inbox");
  revalidatePath("/portal/agents/history");
  revalidatePath(`/portal/agents/${recommendationId}`);
  revalidatePath("/portal/dashboard");
  return { ok: true };
}

export async function approveRecommendation(
  _prev: ActionResult | undefined,
  formData: FormData,
): Promise<ActionResult> {
  const parsed = decideSchema.safeParse({
    recommendationId: formData.get("recommendationId"),
    reason: (formData.get("reason") as string | null) || undefined,
  });
  if (!parsed.success) return { ok: false, error: parsed.error.issues[0].message };
  return decide(parsed.data.recommendationId, "approved", parsed.data.reason);
}

export async function rejectRecommendation(
  _prev: ActionResult | undefined,
  formData: FormData,
): Promise<ActionResult> {
  const parsed = decideSchema.safeParse({
    recommendationId: formData.get("recommendationId"),
    reason: (formData.get("reason") as string | null) || undefined,
  });
  if (!parsed.success) return { ok: false, error: parsed.error.issues[0].message };
  return decide(parsed.data.recommendationId, "rejected", parsed.data.reason);
}
