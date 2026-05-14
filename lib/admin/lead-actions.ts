"use server";

import { revalidatePath } from "next/cache";
import { z } from "zod";

import type { ActionResult } from "@/lib/auth/actions";
import { hasPermissionAny, requireUser } from "@/lib/auth/require";
import { withAudit } from "@/lib/audit/with-audit";
import { createServiceClient } from "@/lib/supabase/service";

const updateStatusSchema = z.object({
  leadId: z.string().uuid(),
  status: z.string().min(1),
});

export async function updateLeadStatus(
  _prev: ActionResult | undefined,
  formData: FormData,
): Promise<ActionResult> {
  const parsed = updateStatusSchema.safeParse({
    leadId: formData.get("leadId"),
    status: formData.get("status"),
  });
  if (!parsed.success) {
    return { ok: false, error: parsed.error.issues[0].message };
  }

  if (!(await hasPermissionAny("manage_leads"))) {
    return { ok: false, error: "You don't have permission to update leads." };
  }

  const user = await requireUser();
  const service = createServiceClient();

  const { data: before } = await service
    .from("leads")
    .select("status")
    .eq("id", parsed.data.leadId)
    .maybeSingle();
  if (!before) return { ok: false, error: "Lead not found." };

  if (before.status === parsed.data.status) {
    return { ok: true };
  }

  const { error } = await service
    .from("leads")
    .update({ status: parsed.data.status, updated_by_id: user.id })
    .eq("id", parsed.data.leadId);
  if (error) return { ok: false, error: error.message };

  await service.from("lead_activities").insert({
    lead_id: parsed.data.leadId,
    kind: "status_change",
    actor_id: user.id,
    body: `Status: ${before.status} → ${parsed.data.status}`,
    payload: { from: before.status, to: parsed.data.status },
  });

  await withAudit(
    {
      action: "lead.status_changed",
      resourceType: "lead",
      resourceId: parsed.data.leadId,
      before: { status: before.status },
      after: { status: parsed.data.status },
    },
    async () => null,
  );

  revalidatePath(`/admin/leads/${parsed.data.leadId}`);
  revalidatePath("/admin/leads");
  return { ok: true };
}

const addNoteSchema = z.object({
  leadId: z.string().uuid(),
  body: z.string().min(1, "Add a note."),
});

export async function addLeadNote(
  _prev: ActionResult | undefined,
  formData: FormData,
): Promise<ActionResult> {
  const parsed = addNoteSchema.safeParse({
    leadId: formData.get("leadId"),
    body: formData.get("body"),
  });
  if (!parsed.success) {
    return { ok: false, error: parsed.error.issues[0].message, field: "body" };
  }

  if (!(await hasPermissionAny("manage_leads"))) {
    return { ok: false, error: "Not permitted." };
  }

  const user = await requireUser();
  const service = createServiceClient();

  const { error } = await service.from("lead_activities").insert({
    lead_id: parsed.data.leadId,
    kind: "note",
    actor_id: user.id,
    body: parsed.data.body,
  });
  if (error) return { ok: false, error: error.message };

  revalidatePath(`/admin/leads/${parsed.data.leadId}`);
  return { ok: true };
}

const convertSchema = z.object({
  leadId: z.string().uuid(),
  organizationName: z.string().min(2, "Give the client org a name."),
  slug: z
    .string()
    .min(2)
    .regex(/^[a-z0-9-]+$/, "Lowercase letters, numbers, and hyphens only."),
  industry: z.string().optional(),
  ownerEmail: z.string().email().optional().or(z.literal("")),
});

export async function convertLeadToClient(
  _prev: ActionResult<{ clientId: string }> | undefined,
  formData: FormData,
): Promise<ActionResult<{ clientId: string }>> {
  const parsed = convertSchema.safeParse({
    leadId: formData.get("leadId"),
    organizationName: formData.get("organizationName"),
    slug: formData.get("slug"),
    industry: formData.get("industry") || undefined,
    ownerEmail: formData.get("ownerEmail") || "",
  });
  if (!parsed.success) {
    const issue = parsed.error.issues[0];
    return { ok: false, error: issue.message, field: issue.path.join(".") };
  }

  if (!(await hasPermissionAny("manage_clients"))) {
    return { ok: false, error: "You don't have permission to create clients." };
  }

  const user = await requireUser();
  const service = createServiceClient();

  const { data: lead } = await service
    .from("leads")
    .select("id, contact_email, contact_name, company_name, client_id")
    .eq("id", parsed.data.leadId)
    .maybeSingle();
  if (!lead) return { ok: false, error: "Lead not found." };
  if (lead.client_id) {
    return { ok: false, error: "Lead has already been converted." };
  }

  // Create the client organization.
  const { data: org, error: orgError } = await service
    .from("organizations")
    .insert({
      name: parsed.data.organizationName,
      slug: parsed.data.slug,
      type: "client",
      region: "eu-central-1",
      status: "active",
      billing_email: lead.contact_email,
    })
    .select("id")
    .single();

  if (orgError || !org) {
    if (orgError?.message?.includes("duplicate")) {
      return { ok: false, error: "A client with that slug already exists.", field: "slug" };
    }
    return { ok: false, error: orgError?.message ?? "Could not create client." };
  }

  // Default settings — modules empty, cloud deployment, EUR.
  await service.from("client_settings").insert({
    organization_id: org.id,
    industry: parsed.data.industry ?? null,
    deployment_type: "cloud",
    modules_enabled: [],
    health_score: null,
    mrr_cents: 0,
    currency: "EUR",
  });

  // Mark the lead converted.
  await service
    .from("leads")
    .update({ status: "won", client_id: org.id, updated_by_id: user.id })
    .eq("id", parsed.data.leadId);

  await service.from("lead_activities").insert({
    lead_id: parsed.data.leadId,
    kind: "converted",
    actor_id: user.id,
    body: `Converted to client: ${parsed.data.organizationName}`,
    payload: { client_id: org.id, slug: parsed.data.slug },
  });

  await withAudit(
    {
      action: "lead.converted",
      resourceType: "lead",
      resourceId: parsed.data.leadId,
      organizationId: org.id,
      after: { client_id: org.id, slug: parsed.data.slug },
    },
    async () => null,
  );

  revalidatePath(`/admin/leads/${parsed.data.leadId}`);
  revalidatePath("/admin/leads");
  revalidatePath("/admin/clients");

  return { ok: true, data: { clientId: org.id } };
}
