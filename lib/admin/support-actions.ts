"use server";

import { revalidatePath } from "next/cache";
import { z } from "zod";

import type { ActionResult } from "@/lib/auth/actions";
import { withAudit } from "@/lib/audit/with-audit";
import { hasPermissionAny, requireUser } from "@/lib/auth/require";
import { createServiceClient } from "@/lib/supabase/service";

const replySchema = z.object({
  ticketId: z.string().uuid(),
  organizationId: z.string().uuid(),
  body: z.string().min(1, "Add a message."),
  isInternal: z.coerce.boolean().default(false),
});

export async function adminReplyToTicket(
  _prev: ActionResult | undefined,
  formData: FormData,
): Promise<ActionResult> {
  if (!(await hasPermissionAny("manage_support_tickets"))) {
    return { ok: false, error: "Not permitted." };
  }

  const parsed = replySchema.safeParse({
    ticketId: formData.get("ticketId"),
    organizationId: formData.get("organizationId"),
    body: formData.get("body"),
    isInternal: formData.get("isInternal") === "on",
  });
  if (!parsed.success) {
    return { ok: false, error: parsed.error.issues[0].message, field: "body" };
  }

  const user = await requireUser();
  const service = createServiceClient();

  const { error } = await service.from("ticket_comments").insert({
    organization_id: parsed.data.organizationId,
    ticket_id: parsed.data.ticketId,
    body: parsed.data.body,
    author_id: user.id,
    is_internal: parsed.data.isInternal,
  });
  if (error) return { ok: false, error: error.message };

  await withAudit(
    {
      action: parsed.data.isInternal
        ? "support_ticket.internal_note"
        : "support_ticket.reply",
      resourceType: "support_ticket",
      resourceId: parsed.data.ticketId,
      organizationId: parsed.data.organizationId,
    },
    async () => null,
  );

  revalidatePath(`/admin/support/${parsed.data.ticketId}`);
  return { ok: true };
}

const statusSchema = z.object({
  ticketId: z.string().uuid(),
  organizationId: z.string().uuid(),
  status: z.enum(["open", "in_progress", "waiting_on_client", "closed"]),
});

export async function setTicketStatus(
  _prev: ActionResult | undefined,
  formData: FormData,
): Promise<ActionResult> {
  if (!(await hasPermissionAny("manage_support_tickets"))) {
    return { ok: false, error: "Not permitted." };
  }

  const parsed = statusSchema.safeParse({
    ticketId: formData.get("ticketId"),
    organizationId: formData.get("organizationId"),
    status: formData.get("status"),
  });
  if (!parsed.success) return { ok: false, error: parsed.error.issues[0].message };

  const user = await requireUser();
  const service = createServiceClient();

  const update: Record<string, unknown> = { status: parsed.data.status };
  if (parsed.data.status === "closed") update.closed_at = new Date().toISOString();
  else update.closed_at = null;

  const { error } = await service
    .from("support_tickets")
    .update(update)
    .eq("id", parsed.data.ticketId);
  if (error) return { ok: false, error: error.message };

  await service.from("ticket_comments").insert({
    organization_id: parsed.data.organizationId,
    ticket_id: parsed.data.ticketId,
    body: `Status changed to "${parsed.data.status.replace(/_/g, " ")}".`,
    author_id: user.id,
    is_internal: true,
  });

  await withAudit(
    {
      action: "support_ticket.status_changed",
      resourceType: "support_ticket",
      resourceId: parsed.data.ticketId,
      organizationId: parsed.data.organizationId,
      after: { status: parsed.data.status },
    },
    async () => null,
  );

  revalidatePath(`/admin/support/${parsed.data.ticketId}`);
  revalidatePath("/admin/support");
  return { ok: true };
}
