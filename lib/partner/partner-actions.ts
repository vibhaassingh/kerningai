"use server";

import { revalidatePath } from "next/cache";
import { z } from "zod";

import type { ActionResult } from "@/lib/auth/actions";
import { hasPermissionAny, requireUser } from "@/lib/auth/require";
import { withAudit } from "@/lib/audit/with-audit";
import { createServiceClient } from "@/lib/supabase/service";
import { getCurrentPartnerOrgId } from "@/lib/partner/partner";

const submitLeadSchema = z.object({
  contactName: z.string().min(2).max(120),
  companyName: z.string().min(2).max(200),
  contactEmail: z.string().email(),
  phone: z.string().optional(),
  notes: z.string().max(2000).optional(),
});

export async function submitPartnerLead(
  _prev: ActionResult<{ leadId: string }> | undefined,
  formData: FormData,
): Promise<ActionResult<{ leadId: string }>> {
  const parsed = submitLeadSchema.safeParse({
    contactName: formData.get("contactName"),
    companyName: formData.get("companyName"),
    contactEmail: formData.get("contactEmail"),
    phone: formData.get("phone") || undefined,
    notes: formData.get("notes") || undefined,
  });
  if (!parsed.success) {
    return { ok: false, error: parsed.error.issues[0].message };
  }

  if (!(await hasPermissionAny("submit_partner_lead"))) {
    return { ok: false, error: "Not permitted to submit leads." };
  }

  const partnerOrgId = await getCurrentPartnerOrgId();
  if (!partnerOrgId) {
    return { ok: false, error: "Not signed in as a partner." };
  }

  const user = await requireUser();
  const service = createServiceClient();

  const { data, error } = await service
    .from("leads")
    .insert({
      source: "partner",
      status: "new",
      contact_name: parsed.data.contactName,
      company_name: parsed.data.companyName,
      contact_email: parsed.data.contactEmail,
      intent_summary: parsed.data.notes ?? null,
      created_by_id: user.id,
      metadata: {
        partner_org_id: partnerOrgId,
        submitted_via: "partner_portal",
        phone: parsed.data.phone ?? null,
      },
    })
    .select("id")
    .single();
  if (error || !data) {
    return { ok: false, error: error?.message ?? "Could not submit lead." };
  }

  await withAudit(
    {
      action: "lead.partner_submitted",
      resourceType: "lead",
      resourceId: data.id,
      organizationId: partnerOrgId,
      after: {
        company_name: parsed.data.companyName,
        partner_org_id: partnerOrgId,
      },
    },
    async () => null,
  );

  revalidatePath("/partner/leads");
  revalidatePath("/partner/dashboard");
  return { ok: true, data: { leadId: data.id } };
}
