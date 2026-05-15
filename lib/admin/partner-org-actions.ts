"use server";

import { revalidatePath } from "next/cache";
import { z } from "zod";

import type { ActionResult } from "@/lib/auth/actions";
import { hasPermissionAny, requireUser } from "@/lib/auth/require";
import { withAudit } from "@/lib/audit/with-audit";
import { createServiceClient } from "@/lib/supabase/service";

const createPartnerSchema = z.object({
  name: z.string().min(2, "Give the partner org a name.").max(200),
  slug: z
    .string()
    .min(2)
    .regex(/^[a-z0-9-]+$/, "Lowercase letters, numbers, and hyphens only."),
  billingEmail: z.string().email().optional().or(z.literal("")),
});

/**
 * Creates a partner organisation (org type = 'partner'). Partners refer
 * leads and view the workflow canvases of projects they introduced.
 * Unlike clients, partners get NO client_settings row — they're a referral
 * channel, not a billed tenant.
 *
 * Permission: manage_clients (same gate as creating clients — both shape
 * the customer graph).
 */
export async function createPartnerOrg(
  _prev: ActionResult<{ partnerId: string }> | undefined,
  formData: FormData,
): Promise<ActionResult<{ partnerId: string }>> {
  const parsed = createPartnerSchema.safeParse({
    name: formData.get("name"),
    slug: formData.get("slug"),
    billingEmail: formData.get("billingEmail") || "",
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

  await requireUser();
  const service = createServiceClient();

  const { data: org, error: orgError } = await service
    .from("organizations")
    .insert({
      name: parsed.data.name,
      slug: parsed.data.slug,
      type: "partner",
      region: "eu-central-1",
      status: "active",
      billing_email: parsed.data.billingEmail || null,
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
      error: orgError?.message ?? "Could not create partner org.",
    };
  }

  await withAudit(
    {
      action: "partner_org.created",
      resourceType: "organization",
      resourceId: org.id,
      organizationId: org.id,
      after: { name: parsed.data.name, slug: parsed.data.slug, type: "partner" },
    },
    async () => null,
  );

  revalidatePath("/admin/partners");
  return { ok: true, data: { partnerId: org.id } };
}

// ---------------------------------------------------------------------------
// updatePartnerOrg — edit name / slug / billing email / region / status
// ---------------------------------------------------------------------------
const updatePartnerSchema = z.object({
  partnerId: z.string().uuid(),
  name: z.string().min(2, "Give the partner org a name.").max(200),
  slug: z
    .string()
    .min(2)
    .regex(/^[a-z0-9-]+$/, "Lowercase letters, numbers, and hyphens only."),
  billingEmail: z.string().email().optional().or(z.literal("")),
  region: z.string().min(2).max(40),
  status: z.enum(["active", "suspended", "archived"]),
});

export async function updatePartnerOrg(
  _prev: ActionResult | undefined,
  formData: FormData,
): Promise<ActionResult> {
  const parsed = updatePartnerSchema.safeParse({
    partnerId: formData.get("partnerId"),
    name: formData.get("name"),
    slug: formData.get("slug"),
    billingEmail: formData.get("billingEmail") || "",
    region: formData.get("region"),
    status: formData.get("status"),
  });
  if (!parsed.success) {
    const issue = parsed.error.issues[0];
    return { ok: false, error: issue.message, field: issue.path.join(".") };
  }

  if (!(await hasPermissionAny("manage_clients"))) {
    return { ok: false, error: "You don't have permission to edit partners." };
  }

  await requireUser();
  const service = createServiceClient();

  // Guard: only operate on a real, non-deleted partner org.
  const { data: existing } = await service
    .from("organizations")
    .select("id, type, name, slug, status, region, billing_email, deleted_at")
    .eq("id", parsed.data.partnerId)
    .maybeSingle();
  if (
    !existing ||
    (existing as { type: string }).type !== "partner" ||
    (existing as { deleted_at: string | null }).deleted_at
  ) {
    return { ok: false, error: "Partner not found." };
  }

  const before = existing as {
    name: string;
    slug: string;
    status: string;
    region: string;
    billing_email: string | null;
  };

  const { error } = await service
    .from("organizations")
    .update({
      name: parsed.data.name,
      slug: parsed.data.slug,
      billing_email: parsed.data.billingEmail || null,
      region: parsed.data.region,
      status: parsed.data.status,
    })
    .eq("id", parsed.data.partnerId);

  if (error) {
    if (error.message?.includes("duplicate") || error.code === "23505") {
      return {
        ok: false,
        error: "That slug is already taken by another organisation.",
        field: "slug",
      };
    }
    return { ok: false, error: error.message };
  }

  await withAudit(
    {
      action: "partner_org.updated",
      resourceType: "organization",
      resourceId: parsed.data.partnerId,
      organizationId: parsed.data.partnerId,
      before: {
        name: before.name,
        slug: before.slug,
        status: before.status,
        region: before.region,
        billing_email: before.billing_email,
      },
      after: {
        name: parsed.data.name,
        slug: parsed.data.slug,
        status: parsed.data.status,
        region: parsed.data.region,
        billing_email: parsed.data.billingEmail || null,
      },
    },
    async () => null,
  );

  revalidatePath("/admin/partners");
  revalidatePath(`/admin/partners/${parsed.data.partnerId}`);
  return { ok: true };
}

// ---------------------------------------------------------------------------
// deletePartnerOrg — soft delete (reversible). Sets deleted_at + archives.
// ---------------------------------------------------------------------------
const deletePartnerSchema = z.object({
  partnerId: z.string().uuid(),
  // Typed confirmation from the UI ("DELETE") to avoid accidental clicks.
  confirm: z.string(),
});

export async function deletePartnerOrg(
  _prev: ActionResult | undefined,
  formData: FormData,
): Promise<ActionResult> {
  const parsed = deletePartnerSchema.safeParse({
    partnerId: formData.get("partnerId"),
    confirm: formData.get("confirm"),
  });
  if (!parsed.success) {
    return { ok: false, error: parsed.error.issues[0].message };
  }
  if (parsed.data.confirm !== "DELETE") {
    return { ok: false, error: 'Type DELETE to confirm.', field: "confirm" };
  }

  if (!(await hasPermissionAny("manage_clients"))) {
    return { ok: false, error: "You don't have permission to delete partners." };
  }

  await requireUser();
  const service = createServiceClient();

  const { data: existing } = await service
    .from("organizations")
    .select("id, type, name, deleted_at")
    .eq("id", parsed.data.partnerId)
    .maybeSingle();
  if (!existing || (existing as { type: string }).type !== "partner") {
    return { ok: false, error: "Partner not found." };
  }
  if ((existing as { deleted_at: string | null }).deleted_at) {
    return { ok: true }; // already deleted — idempotent
  }

  // Soft delete: it disappears from every partner listing immediately but
  // is fully recoverable (Restore button + audit trail). Projects keep
  // their partner_org_id reference for historical attribution.
  const { error } = await service
    .from("organizations")
    .update({ deleted_at: new Date().toISOString(), status: "archived" })
    .eq("id", parsed.data.partnerId);
  if (error) return { ok: false, error: error.message };

  await withAudit(
    {
      action: "partner_org.deleted",
      resourceType: "organization",
      resourceId: parsed.data.partnerId,
      organizationId: parsed.data.partnerId,
      after: {
        name: (existing as { name: string }).name,
        soft_deleted: true,
      },
    },
    async () => null,
  );

  revalidatePath("/admin/partners");
  return { ok: true };
}

// ---------------------------------------------------------------------------
// restorePartnerOrg — undo a soft delete
// ---------------------------------------------------------------------------
const restorePartnerSchema = z.object({ partnerId: z.string().uuid() });

export async function restorePartnerOrg(
  _prev: ActionResult | undefined,
  formData: FormData,
): Promise<ActionResult> {
  const parsed = restorePartnerSchema.safeParse({
    partnerId: formData.get("partnerId"),
  });
  if (!parsed.success) {
    return { ok: false, error: parsed.error.issues[0].message };
  }

  if (!(await hasPermissionAny("manage_clients"))) {
    return { ok: false, error: "Not permitted." };
  }

  await requireUser();
  const service = createServiceClient();

  const { data: existing } = await service
    .from("organizations")
    .select("id, type")
    .eq("id", parsed.data.partnerId)
    .maybeSingle();
  if (!existing || (existing as { type: string }).type !== "partner") {
    return { ok: false, error: "Partner not found." };
  }

  const { error } = await service
    .from("organizations")
    .update({ deleted_at: null, status: "active" })
    .eq("id", parsed.data.partnerId);
  if (error) return { ok: false, error: error.message };

  await withAudit(
    {
      action: "partner_org.restored",
      resourceType: "organization",
      resourceId: parsed.data.partnerId,
      organizationId: parsed.data.partnerId,
      after: { restored: true },
    },
    async () => null,
  );

  revalidatePath("/admin/partners");
  revalidatePath(`/admin/partners/${parsed.data.partnerId}`);
  return { ok: true };
}
