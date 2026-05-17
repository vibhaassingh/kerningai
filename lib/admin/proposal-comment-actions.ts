"use server";

import { revalidatePath } from "next/cache";
import { z } from "zod";

import type { ActionResult } from "@/lib/auth/actions";
import { requireUser } from "@/lib/auth/require";
import { withAudit } from "@/lib/audit/with-audit";
import { createClient } from "@/lib/supabase/server";
import { createServiceClient } from "@/lib/supabase/service";

const schema = z.object({
  proposalId: z.string().uuid(),
  body: z.string().trim().min(1, "Write something first.").max(2000),
});

/**
 * Add a comment to a proposal's shared thread. Authorization is delegated
 * to RLS: we read the proposal with the caller's session — if they can
 * see it (internal staff, client member, or referring partner) they may
 * comment. The insert itself runs service-role.
 */
export async function addProposalComment(
  _prev: ActionResult | undefined,
  formData: FormData,
): Promise<ActionResult> {
  const parsed = schema.safeParse({
    proposalId: formData.get("proposalId"),
    body: formData.get("body"),
  });
  if (!parsed.success) {
    return { ok: false, error: parsed.error.issues[0].message };
  }

  const user = await requireUser();

  // RLS gate: only returns the row if the caller can see this proposal.
  const rls = await createClient();
  const { data: prop } = await rls
    .from("proposals")
    .select("id, project_id, organization_id")
    .eq("id", parsed.data.proposalId)
    .maybeSingle();
  if (!prop) {
    return { ok: false, error: "Not permitted to comment on this proposal." };
  }

  const service = createServiceClient();
  const { error } = await service.from("proposal_comments").insert({
    proposal_id: parsed.data.proposalId,
    user_id: user.id,
    body: parsed.data.body,
  });
  if (error) return { ok: false, error: error.message };

  await withAudit(
    {
      action: "proposal_comment.added",
      resourceType: "proposal",
      resourceId: parsed.data.proposalId,
      organizationId: (prop.organization_id as string | null) ?? undefined,
    },
    async () => null,
  );

  const clientOrg = prop.organization_id as string | null;
  if (clientOrg) {
    revalidatePath(
      `/admin/clients/${clientOrg}/projects/${prop.project_id}/proposal/workflow`,
    );
  }
  revalidatePath(`/portal/proposals/${parsed.data.proposalId}`);
  revalidatePath(`/partner/proposals/${parsed.data.proposalId}`);
  return { ok: true };
}
