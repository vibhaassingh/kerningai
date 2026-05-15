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

const createLeadSchema = z.object({
  contactName: z.string().min(2, "Contact name is required.").max(160),
  contactEmail: z.string().email("Enter a valid email."),
  companyName: z.string().max(200).optional().or(z.literal("")),
  contactRole: z.string().max(120).optional().or(z.literal("")),
  source: z.enum([
    "referral",
    "inbound_email",
    "outbound",
    "event",
    "other",
  ]),
  intentSummary: z.string().max(4000).optional().or(z.literal("")),
  score: z
    .union([z.coerce.number().int().min(0).max(100), z.literal("")])
    .optional(),
});

/**
 * Creates a lead by hand (admin "Add lead" on the Sales CRM). Distinct
 * from the contact-form / discovery / partner ingestion paths — source is
 * picked by the operator. Status defaults to the pipeline's first stage.
 */
export async function createLead(
  _prev: ActionResult<{ leadId: string }> | undefined,
  formData: FormData,
): Promise<ActionResult<{ leadId: string }>> {
  const parsed = createLeadSchema.safeParse({
    contactName: formData.get("contactName"),
    contactEmail: formData.get("contactEmail"),
    companyName: formData.get("companyName") || "",
    contactRole: formData.get("contactRole") || "",
    source: formData.get("source"),
    intentSummary: formData.get("intentSummary") || "",
    score: formData.get("score") ?? "",
  });
  if (!parsed.success) {
    const issue = parsed.error.issues[0];
    return { ok: false, error: issue.message, field: issue.path.join(".") };
  }

  if (!(await hasPermissionAny("manage_leads"))) {
    return { ok: false, error: "You don't have permission to add leads." };
  }

  const user = await requireUser();
  const service = createServiceClient();

  const { data, error } = await service
    .from("leads")
    .insert({
      source: parsed.data.source,
      company_name: parsed.data.companyName || null,
      contact_name: parsed.data.contactName,
      contact_email: parsed.data.contactEmail,
      contact_role: parsed.data.contactRole || null,
      intent_summary: parsed.data.intentSummary || null,
      score:
        typeof parsed.data.score === "number" ? parsed.data.score : null,
      created_by_id: user.id,
      updated_by_id: user.id,
      metadata: { entered_via: "admin_manual" },
    })
    .select("id")
    .single();
  if (error || !data) {
    return { ok: false, error: error?.message ?? "Could not create lead." };
  }

  await service.from("lead_activities").insert({
    lead_id: data.id,
    kind: "note",
    actor_id: user.id,
    body: `Lead created manually (${parsed.data.source.replace(/_/g, " ")}).`,
  });

  await withAudit(
    {
      action: "lead.created",
      resourceType: "lead",
      resourceId: data.id,
      after: {
        source: parsed.data.source,
        contact_email: parsed.data.contactEmail,
      },
    },
    async () => null,
  );

  revalidatePath("/admin/leads");
  return { ok: true, data: { leadId: data.id } };
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

const convertPartnerSchema = z.object({
  leadId: z.string().uuid(),
  organizationName: z.string().min(2, "Give the partner org a name."),
  slug: z
    .string()
    .min(2)
    .regex(/^[a-z0-9-]+$/, "Lowercase letters, numbers, and hyphens only."),
});

/**
 * Promotes a lead into a PARTNER organisation (referral channel) instead
 * of a client. Mirrors convertLeadToClient but: org type = 'partner', no
 * client_settings row, and the lead is marked won + linked so it isn't
 * re-converted. The lead detail page branches the "converted" link on the
 * org type so a partner conversion points at /admin/partners.
 */
export async function convertLeadToPartner(
  _prev: ActionResult<{ partnerId: string }> | undefined,
  formData: FormData,
): Promise<ActionResult<{ partnerId: string }>> {
  const parsed = convertPartnerSchema.safeParse({
    leadId: formData.get("leadId"),
    organizationName: formData.get("organizationName"),
    slug: formData.get("slug"),
  });
  if (!parsed.success) {
    const issue = parsed.error.issues[0];
    return { ok: false, error: issue.message, field: issue.path.join(".") };
  }

  if (!(await hasPermissionAny("manage_clients"))) {
    return {
      ok: false,
      error: "You don't have permission to create partner organisations.",
    };
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

  const { data: org, error: orgError } = await service
    .from("organizations")
    .insert({
      name: parsed.data.organizationName,
      slug: parsed.data.slug,
      type: "partner",
      region: "eu-central-1",
      status: "active",
      billing_email: lead.contact_email,
    })
    .select("id")
    .single();

  if (orgError || !org) {
    if (orgError?.message?.includes("duplicate")) {
      return {
        ok: false,
        error: "A partner with that slug already exists.",
        field: "slug",
      };
    }
    return {
      ok: false,
      error: orgError?.message ?? "Could not create partner.",
    };
  }

  await service
    .from("leads")
    .update({ status: "won", client_id: org.id, updated_by_id: user.id })
    .eq("id", parsed.data.leadId);

  await service.from("lead_activities").insert({
    lead_id: parsed.data.leadId,
    kind: "converted",
    actor_id: user.id,
    body: `Converted to partner: ${parsed.data.organizationName}`,
    payload: { partner_org_id: org.id, slug: parsed.data.slug, converted_to: "partner" },
  });

  await withAudit(
    {
      action: "lead.converted_partner",
      resourceType: "lead",
      resourceId: parsed.data.leadId,
      organizationId: org.id,
      after: { partner_org_id: org.id, slug: parsed.data.slug },
    },
    async () => null,
  );

  revalidatePath(`/admin/leads/${parsed.data.leadId}`);
  revalidatePath("/admin/leads");
  revalidatePath("/admin/partners");

  return { ok: true, data: { partnerId: org.id } };
}
