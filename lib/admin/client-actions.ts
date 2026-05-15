"use server";

import { revalidatePath } from "next/cache";
import { z } from "zod";

import type { ActionResult } from "@/lib/auth/actions";
import { hasPermissionAny, requireUser } from "@/lib/auth/require";
import { withAudit } from "@/lib/audit/with-audit";
import { MODULE_SLUGS } from "@/lib/admin/modules-catalog";
import { createServiceClient } from "@/lib/supabase/service";

const setModulesSchema = z.object({
  organizationId: z.string().uuid(),
});

/**
 * Replaces a client's enabled-module set. The form posts zero or more
 * `modules` checkbox values; we intersect with the canonical catalogue so
 * only valid slugs are ever persisted. Gated by `manage_clients` and
 * audit-logged (before/after module sets).
 */
export async function setClientModules(
  _prev: ActionResult | undefined,
  formData: FormData,
): Promise<ActionResult> {
  const parsed = setModulesSchema.safeParse({
    organizationId: formData.get("organizationId"),
  });
  if (!parsed.success) {
    return { ok: false, error: parsed.error.issues[0].message };
  }

  if (!(await hasPermissionAny("manage_clients"))) {
    return { ok: false, error: "You don't have permission to edit modules." };
  }

  await requireUser();
  const service = createServiceClient();

  const submitted = formData.getAll("modules").map(String);
  // Keep catalogue order, only valid slugs.
  const next = MODULE_SLUGS.filter((s) => submitted.includes(s));

  const { data: before } = await service
    .from("client_settings")
    .select("modules_enabled")
    .eq("organization_id", parsed.data.organizationId)
    .maybeSingle();
  if (!before) {
    return { ok: false, error: "Client settings not found for this org." };
  }

  const { error } = await service
    .from("client_settings")
    .update({ modules_enabled: next })
    .eq("organization_id", parsed.data.organizationId);
  if (error) return { ok: false, error: error.message };

  await withAudit(
    {
      action: "client.modules_changed",
      resourceType: "client_settings",
      resourceId: parsed.data.organizationId,
      organizationId: parsed.data.organizationId,
      before: { modules_enabled: before.modules_enabled },
      after: { modules_enabled: next },
    },
    async () => null,
  );

  revalidatePath(`/admin/clients/${parsed.data.organizationId}/modules`);
  revalidatePath(`/admin/clients/${parsed.data.organizationId}/overview`);
  revalidatePath(`/admin/clients/${parsed.data.organizationId}`);
  return { ok: true };
}
