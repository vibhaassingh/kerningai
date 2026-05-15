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

// ---------------------------------------------------------------------------
// createSupportTicket — admin raises a ticket on behalf of a client
// ---------------------------------------------------------------------------
const createTicketSchema = z.object({
  organizationId: z.string().uuid("Pick a client."),
  title: z.string().min(3, "Give the ticket a title.").max(200),
  description: z.string().min(5, "Describe the issue.").max(8000),
  severity: z.enum(["p1", "p2", "p3", "p4"]),
  module: z.string().max(80).optional().or(z.literal("")),
});

export async function createSupportTicket(
  _prev: ActionResult<{ ticketId: string }> | undefined,
  formData: FormData,
): Promise<ActionResult<{ ticketId: string }>> {
  if (!(await hasPermissionAny("manage_support_tickets"))) {
    return { ok: false, error: "Not permitted to create tickets." };
  }

  const parsed = createTicketSchema.safeParse({
    organizationId: formData.get("organizationId"),
    title: formData.get("title"),
    description: formData.get("description"),
    severity: formData.get("severity"),
    module: formData.get("module") || "",
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
      organization_id: parsed.data.organizationId,
      title: parsed.data.title,
      description: parsed.data.description,
      severity: parsed.data.severity,
      status: "open",
      module: parsed.data.module || null,
      reported_by_id: user.id,
      metadata: { entered_via: "admin_manual" },
    })
    .select("id")
    .single();
  if (error || !data) {
    return { ok: false, error: error?.message ?? "Could not create ticket." };
  }

  await service.from("ticket_comments").insert({
    organization_id: parsed.data.organizationId,
    ticket_id: data.id,
    body: `Ticket opened by Kerning staff (severity ${parsed.data.severity.toUpperCase()}).`,
    author_id: user.id,
    is_internal: true,
  });

  await withAudit(
    {
      action: "support_ticket.created",
      resourceType: "support_ticket",
      resourceId: data.id,
      organizationId: parsed.data.organizationId,
      after: { title: parsed.data.title, severity: parsed.data.severity },
    },
    async () => null,
  );

  revalidatePath("/admin/support");
  return { ok: true, data: { ticketId: data.id } };
}
