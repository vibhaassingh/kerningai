"use server";

import { revalidatePath } from "next/cache";
import { z } from "zod";

import type { ActionResult } from "@/lib/auth/actions";
import { requirePermission } from "@/lib/auth/require";
import { withAudit } from "@/lib/audit/with-audit";
import { createServiceClient } from "@/lib/supabase/service";

const deploymentEnum = z.enum([
  "cloud",
  "sovereign_cloud",
  "on_prem",
  "air_gapped",
]);

const createSiteSchema = z.object({
  clientId: z.string().uuid(),
  name: z.string().min(2, "Give the site a name."),
  slug: z
    .string()
    .min(2, "Slug is required.")
    .regex(/^[a-z0-9-]+$/, "Lowercase letters, numbers, and hyphens only."),
  region: z.string().min(2, "Pick a region."),
  timezone: z.string().min(2, "Pick a timezone."),
  deploymentType: deploymentEnum.optional(),
  city: z.string().optional(),
  country: z.string().optional(),
});

export async function createSite(
  _prev: ActionResult | undefined,
  formData: FormData,
): Promise<ActionResult> {
  const parsed = createSiteSchema.safeParse({
    clientId: formData.get("clientId"),
    name: formData.get("name"),
    slug: formData.get("slug"),
    region: formData.get("region"),
    timezone: formData.get("timezone"),
    deploymentType: formData.get("deploymentType") || undefined,
    city: (formData.get("city") as string | null) || undefined,
    country: (formData.get("country") as string | null) || undefined,
  });
  if (!parsed.success) {
    const issue = parsed.error.issues[0];
    return { ok: false, error: issue.message, field: issue.path.join(".") };
  }

  try {
    await requirePermission("manage_sites", parsed.data.clientId);
  } catch {
    return { ok: false, error: "You don't have permission to add sites here." };
  }

  const service = createServiceClient();

  const address: Record<string, string> = {};
  if (parsed.data.city) address.city = parsed.data.city;
  if (parsed.data.country) address.country = parsed.data.country;

  const { data, error } = await service
    .from("sites")
    .insert({
      organization_id: parsed.data.clientId,
      name: parsed.data.name,
      slug: parsed.data.slug,
      region: parsed.data.region,
      timezone: parsed.data.timezone,
      deployment_type: parsed.data.deploymentType ?? null,
      address,
    })
    .select("id")
    .single();

  if (error || !data) {
    if (error?.message?.includes("duplicate")) {
      return { ok: false, error: "A site with that slug already exists.", field: "slug" };
    }
    return { ok: false, error: error?.message ?? "Could not create site." };
  }

  await withAudit(
    {
      action: "site.created",
      resourceType: "site",
      resourceId: data.id,
      organizationId: parsed.data.clientId,
      after: {
        name: parsed.data.name,
        slug: parsed.data.slug,
        deployment_type: parsed.data.deploymentType,
      },
    },
    async () => null,
  );

  revalidatePath(`/admin/clients/${parsed.data.clientId}/sites`);
  revalidatePath(`/admin/clients/${parsed.data.clientId}/overview`);
  return { ok: true };
}
