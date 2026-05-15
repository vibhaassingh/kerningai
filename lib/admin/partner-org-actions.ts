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
