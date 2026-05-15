"use server";

import { revalidatePath } from "next/cache";
import { z } from "zod";

import type { ActionResult } from "@/lib/auth/actions";
import { withAudit } from "@/lib/audit/with-audit";
import { requireUser } from "@/lib/auth/require";
import { createServiceClient } from "@/lib/supabase/service";
import { getPortalContext } from "@/lib/portal/team";

const createSchema = z.object({
  title: z.string().min(4, "Give the ticket a clear title."),
  description: z.string().min(8, "Describe what happened."),
  severity: z.enum(["p1", "p2", "p3", "p4"]).default("p3"),
  module: z.string().optional(),
});

export async function createTicket(
  _prev: ActionResult<{ ticketId: string }> | undefined,
  formData: FormData,
): Promise<ActionResult<{ ticketId: string }>> {
  const ctx = await getPortalContext();
  if (!ctx) return { ok: false, error: "No active workspace." };

  const parsed = createSchema.safeParse({
    title: formData.get("title"),
    description: formData.get("description"),
    severity: formData.get("severity") || "p3",
    module: (formData.get("module") as string | null) || undefined,
  });
  if (!parsed.success) {
    const issue = parsed.error.issues[0];
    return { ok: false, error: issue.message, field: issue.path.join(".") };
  }

  const user = await requireUser();
  const service = createServiceClient();

  const { data, error } = await service
    .from("support_tickets")
    .insert({
      organization_id: ctx.organizationId,
      title: parsed.data.title,
      description: parsed.data.description,
      severity: parsed.data.severity,
      module: parsed.data.module ?? null,
      reported_by_id: user.id,
    })
    .select("id")
    .single();

  if (error || !data) {
    return { ok: false, error: error?.message ?? "Could not create ticket." };
  }

  await withAudit(
    {
      action: "support_ticket.created",
      resourceType: "support_ticket",
      resourceId: data.id,
      organizationId: ctx.organizationId,
      after: { severity: parsed.data.severity, title: parsed.data.title },
    },
    async () => null,
  );

  revalidatePath("/portal/support");
  return { ok: true, data: { ticketId: data.id } };
}

const commentSchema = z.object({
  ticketId: z.string().uuid(),
  body: z.string().min(1, "Add a message."),
});

export async function addTicketComment(
  _prev: ActionResult | undefined,
  formData: FormData,
): Promise<ActionResult> {
  const ctx = await getPortalContext();
  if (!ctx) return { ok: false, error: "No active workspace." };

  const parsed = commentSchema.safeParse({
    ticketId: formData.get("ticketId"),
    body: formData.get("body"),
  });
  if (!parsed.success) {
    return { ok: false, error: parsed.error.issues[0].message, field: "body" };
  }

  const user = await requireUser();
  const service = createServiceClient();

  const { error } = await service.from("ticket_comments").insert({
    organization_id: ctx.organizationId,
    ticket_id: parsed.data.ticketId,
    body: parsed.data.body,
    author_id: user.id,
    is_internal: false,
  });
  if (error) return { ok: false, error: error.message };

  revalidatePath(`/portal/support/${parsed.data.ticketId}`);
  return { ok: true };
}
