"use server";

import { revalidatePath } from "next/cache";
import { z } from "zod";

import type { ActionResult } from "@/lib/auth/actions";
import { requirePermission, requireUser } from "@/lib/auth/require";
import { withAudit } from "@/lib/audit/with-audit";
import { createServiceClient } from "@/lib/supabase/service";

const slugify = (s: string): string =>
  s
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .slice(0, 60) || "project";

// ---------------------------------------------------------------------------
// createProject
// ---------------------------------------------------------------------------
const createSchema = z.object({
  organizationId: z.string().uuid(),
  name: z.string().min(2).max(200),
  description: z.string().optional(),
  partnerOrgId: z.string().uuid().optional(),
  partnerVisibleToClient: z.boolean().optional(),
  industryLabel: z.string().optional(),
  businessLabel: z.string().optional(),
  blueprintId: z.string().uuid().optional(),
  leadId: z.string().uuid().optional(),
});

export async function createProject(
  _prev: ActionResult<{ projectId: string; slug: string }> | undefined,
  formData: FormData,
): Promise<ActionResult<{ projectId: string; slug: string }>> {
  const parsed = createSchema.safeParse({
    organizationId: formData.get("organizationId"),
    name: formData.get("name"),
    description: formData.get("description") || undefined,
    partnerOrgId: formData.get("partnerOrgId") || undefined,
    partnerVisibleToClient: formData.get("partnerVisibleToClient") === "on",
    industryLabel: formData.get("industryLabel") || undefined,
    businessLabel: formData.get("businessLabel") || undefined,
    blueprintId: formData.get("blueprintId") || undefined,
    leadId: formData.get("leadId") || undefined,
  });
  if (!parsed.success) {
    return { ok: false, error: parsed.error.issues[0].message };
  }

  try {
    await requirePermission("manage_projects", parsed.data.organizationId);
  } catch {
    return { ok: false, error: "Not permitted." };
  }

  const user = await requireUser();
  const service = createServiceClient();

  const baseSlug = slugify(parsed.data.name);
  let slug = baseSlug;
  let attempt = 1;
  // Ensure unique slug per org.
  while (true) {
    const { data: existing } = await service
      .from("projects")
      .select("id")
      .eq("organization_id", parsed.data.organizationId)
      .eq("slug", slug)
      .maybeSingle();
    if (!existing) break;
    attempt += 1;
    slug = `${baseSlug}-${attempt}`;
  }

  const { data, error } = await service
    .from("projects")
    .insert({
      organization_id: parsed.data.organizationId,
      partner_org_id: parsed.data.partnerOrgId ?? null,
      partner_visible_to_client: parsed.data.partnerVisibleToClient ?? false,
      blueprint_id: parsed.data.blueprintId ?? null,
      lead_id: parsed.data.leadId ?? null,
      name: parsed.data.name,
      slug,
      description: parsed.data.description ?? null,
      status: "discovery",
      industry_label: parsed.data.industryLabel ?? null,
      business_label: parsed.data.businessLabel ?? null,
      created_by_id: user.id,
      updated_by_id: user.id,
    })
    .select("id, slug")
    .single();
  if (error || !data) {
    return { ok: false, error: error?.message ?? "Could not create project." };
  }

  await withAudit(
    {
      action: "project.created",
      resourceType: "project",
      resourceId: data.id,
      organizationId: parsed.data.organizationId,
      after: { name: parsed.data.name, slug: data.slug },
    },
    async () => null,
  );

  revalidatePath(`/admin/clients/${parsed.data.organizationId}/projects`);
  return { ok: true, data: { projectId: data.id, slug: data.slug } };
}

// ---------------------------------------------------------------------------
// updateProjectStatus
// ---------------------------------------------------------------------------
const updateStatusSchema = z.object({
  projectId: z.string().uuid(),
  organizationId: z.string().uuid(),
  status: z.enum([
    "discovery",
    "proposal",
    "implementation",
    "live",
    "archived",
    "on_hold",
  ]),
});

export async function updateProjectStatus(
  _prev: ActionResult | undefined,
  formData: FormData,
): Promise<ActionResult> {
  const parsed = updateStatusSchema.safeParse({
    projectId: formData.get("projectId"),
    organizationId: formData.get("organizationId"),
    status: formData.get("status"),
  });
  if (!parsed.success) return { ok: false, error: parsed.error.issues[0].message };

  try {
    await requirePermission("manage_projects", parsed.data.organizationId);
  } catch {
    return { ok: false, error: "Not permitted." };
  }
  const user = await requireUser();
  const service = createServiceClient();

  const { error } = await service
    .from("projects")
    .update({ status: parsed.data.status, updated_by_id: user.id })
    .eq("id", parsed.data.projectId);
  if (error) return { ok: false, error: error.message };

  await withAudit(
    {
      action: "project.status_changed",
      resourceType: "project",
      resourceId: parsed.data.projectId,
      organizationId: parsed.data.organizationId,
      after: { status: parsed.data.status },
    },
    async () => null,
  );

  revalidatePath(
    `/admin/clients/${parsed.data.organizationId}/projects/${parsed.data.projectId}/overview`,
  );
  return { ok: true };
}

// ---------------------------------------------------------------------------
// setProjectPartner — assign / clear the referring partner org on a project
// ---------------------------------------------------------------------------
const setPartnerSchema = z.object({
  projectId: z.string().uuid(),
  organizationId: z.string().uuid(),
  // Empty string clears the partner link.
  partnerOrgId: z.string().uuid().optional().or(z.literal("")),
  partnerVisibleToClient: z.boolean().optional(),
});

export async function setProjectPartner(
  _prev: ActionResult | undefined,
  formData: FormData,
): Promise<ActionResult> {
  const parsed = setPartnerSchema.safeParse({
    projectId: formData.get("projectId"),
    organizationId: formData.get("organizationId"),
    partnerOrgId: formData.get("partnerOrgId") || "",
    partnerVisibleToClient: formData.get("partnerVisibleToClient") === "on",
  });
  if (!parsed.success) return { ok: false, error: parsed.error.issues[0].message };

  try {
    await requirePermission("manage_projects", parsed.data.organizationId);
  } catch {
    return { ok: false, error: "Not permitted." };
  }
  const user = await requireUser();
  const service = createServiceClient();

  const nextPartnerId = parsed.data.partnerOrgId
    ? parsed.data.partnerOrgId
    : null;

  // If a partner is being attached, verify it really is a partner org.
  if (nextPartnerId) {
    const { data: partnerOrg } = await service
      .from("organizations")
      .select("id, type")
      .eq("id", nextPartnerId)
      .maybeSingle();
    if (!partnerOrg || (partnerOrg as { type: string }).type !== "partner") {
      return { ok: false, error: "That organisation is not a partner." };
    }
  }

  const { error } = await service
    .from("projects")
    .update({
      partner_org_id: nextPartnerId,
      partner_visible_to_client: nextPartnerId
        ? parsed.data.partnerVisibleToClient ?? false
        : false,
      updated_by_id: user.id,
    })
    .eq("id", parsed.data.projectId)
    .eq("organization_id", parsed.data.organizationId);
  if (error) return { ok: false, error: error.message };

  await withAudit(
    {
      action: "project.partner_set",
      resourceType: "project",
      resourceId: parsed.data.projectId,
      organizationId: parsed.data.organizationId,
      after: {
        partner_org_id: nextPartnerId,
        partner_visible_to_client: nextPartnerId
          ? parsed.data.partnerVisibleToClient ?? false
          : false,
      },
    },
    async () => null,
  );

  revalidatePath(
    `/admin/clients/${parsed.data.organizationId}/projects/${parsed.data.projectId}/overview`,
  );
  return { ok: true };
}
