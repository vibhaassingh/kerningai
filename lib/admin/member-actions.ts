"use server";

import { revalidatePath } from "next/cache";
import { z } from "zod";

import { recordSecurityEvent, withAudit } from "@/lib/audit/with-audit";
import type { ActionResult } from "@/lib/auth/actions";
import { requirePermission, requireUser } from "@/lib/auth/require";
import { SITE_URL } from "@/lib/env";
import { sendEmail } from "@/lib/email/resend";
import { passwordResetEmail } from "@/lib/email/templates/password-reset";
import {
  CLIENT_ROLES,
  INTERNAL_ROLES,
  PARTNER_ROLES,
} from "@/lib/rbac/roles";
import { createClient } from "@/lib/supabase/server";
import { createServiceClient } from "@/lib/supabase/service";
import { getUserMemberships } from "@/lib/tenancy/current-org";

function rolesForOrgType(type: string): readonly string[] {
  if (type === "internal") return INTERNAL_ROLES;
  if (type === "partner") return PARTNER_ROLES;
  return CLIENT_ROLES;
}

// ---------------------------------------------------------------------------
// adminResetPassword — staff triggers a password-recovery email for a user.
// The user sets their own new password via the emailed single-use link;
// the operator never sees or sets the password. The recovery link is sent
// by email only (never returned to the UI — it grants account access).
// ---------------------------------------------------------------------------
const resetSchema = z.object({
  userId: z.string().uuid(),
  email: z.string().email(),
  organizationId: z.string().uuid(),
});

export async function adminResetPassword(
  _prev: ActionResult | undefined,
  formData: FormData,
): Promise<ActionResult> {
  const parsed = resetSchema.safeParse({
    userId: formData.get("userId"),
    email: formData.get("email"),
    organizationId: formData.get("organizationId"),
  });
  if (!parsed.success) {
    return { ok: false, error: parsed.error.issues[0].message };
  }

  try {
    await requirePermission("manage_users", parsed.data.organizationId);
  } catch {
    return { ok: false, error: "Not permitted." };
  }

  const actor = await requireUser();
  const supabase = await createClient();
  const service = createServiceClient();

  const [{ data: actorProfile }, { data: target }, { data: org }] =
    await Promise.all([
      supabase
        .from("app_users")
        .select("full_name, email")
        .eq("id", actor.id)
        .maybeSingle(),
      service
        .from("app_users")
        .select("full_name, email")
        .eq("id", parsed.data.userId)
        .maybeSingle(),
      service
        .from("organizations")
        .select("name")
        .eq("id", parsed.data.organizationId)
        .maybeSingle(),
    ]);

  const { data: linkData, error: linkErr } =
    await service.auth.admin.generateLink({
      type: "recovery",
      email: parsed.data.email,
      options: { redirectTo: `${SITE_URL}/reset-password` },
    });
  const actionLink = (
    linkData as { properties?: { action_link?: string } } | null
  )?.properties?.action_link;
  if (linkErr || !actionLink) {
    return {
      ok: false,
      error: linkErr?.message ?? "Could not generate a reset link.",
    };
  }

  const mail = passwordResetEmail({
    recipientName: target?.full_name ?? parsed.data.email,
    organizationName: org?.name ?? "Kerning AI",
    resetUrl: actionLink,
    initiatedByName:
      actorProfile?.full_name ?? actorProfile?.email ?? "A Kerning admin",
  });
  const send = await sendEmail({
    to: parsed.data.email,
    subject: mail.subject,
    html: mail.html,
    text: mail.text,
  });
  if (!send.ok) {
    return { ok: false, error: `Could not send the email: ${send.error}` };
  }

  await recordSecurityEvent({
    userId: parsed.data.userId,
    kind: "password_reset_requested",
    metadata: {
      initiated_by: actor.id,
      organization_id: parsed.data.organizationId,
    },
  });
  await withAudit(
    {
      action: "user.password_reset_initiated",
      resourceType: "app_user",
      resourceId: parsed.data.userId,
      organizationId: parsed.data.organizationId,
      after: { email: parsed.data.email, email_send_ok: send.ok },
    },
    async () => null,
  );

  return { ok: true };
}

// ---------------------------------------------------------------------------
// setMembershipStatus — suspend / reactivate a member (offboarding).
// Guards against self-suspension and locking everyone out of an org.
// ---------------------------------------------------------------------------
const statusSchema = z.object({
  membershipId: z.string().uuid(),
  organizationId: z.string().uuid(),
  status: z.enum(["active", "suspended"]),
});

export async function setMembershipStatus(
  _prev: ActionResult | undefined,
  formData: FormData,
): Promise<ActionResult> {
  const parsed = statusSchema.safeParse({
    membershipId: formData.get("membershipId"),
    organizationId: formData.get("organizationId"),
    status: formData.get("status"),
  });
  if (!parsed.success) {
    return { ok: false, error: parsed.error.issues[0].message };
  }

  try {
    await requirePermission("manage_users", parsed.data.organizationId);
  } catch {
    return { ok: false, error: "Not permitted." };
  }
  const actor = await requireUser();
  const service = createServiceClient();

  const { data: membership } = await service
    .from("organization_memberships")
    .select("id, user_id, organization_id, status")
    .eq("id", parsed.data.membershipId)
    .maybeSingle();
  if (!membership || membership.organization_id !== parsed.data.organizationId) {
    return { ok: false, error: "Member not found." };
  }
  if (membership.user_id === actor.id) {
    return { ok: false, error: "You can't change your own access." };
  }

  if (parsed.data.status === "suspended") {
    const { count } = await service
      .from("organization_memberships")
      .select("id", { count: "exact", head: true })
      .eq("organization_id", parsed.data.organizationId)
      .eq("status", "active");
    if ((count ?? 0) <= 1) {
      return {
        ok: false,
        error: "Can't suspend the last active member of an organisation.",
      };
    }
  }

  const { error } = await service
    .from("organization_memberships")
    .update({ status: parsed.data.status })
    .eq("id", parsed.data.membershipId);
  if (error) return { ok: false, error: error.message };

  await withAudit(
    {
      action: "membership.status_changed",
      resourceType: "organization_membership",
      resourceId: parsed.data.membershipId,
      organizationId: parsed.data.organizationId,
      before: { status: membership.status },
      after: { status: parsed.data.status },
    },
    async () => null,
  );

  revalidatePath("/admin/security/users");
  revalidatePath(`/admin/clients/${parsed.data.organizationId}/users`);
  revalidatePath(`/admin/partners/${parsed.data.organizationId}`);
  return { ok: true };
}

// ---------------------------------------------------------------------------
// setMembershipRole — change a member's role within the org's role set.
// Privilege guards: valid-for-org-type only, no self change, and only a
// super_admin may grant super_admin.
// ---------------------------------------------------------------------------
const roleSchema = z.object({
  membershipId: z.string().uuid(),
  organizationId: z.string().uuid(),
  roleSlug: z.string().min(1),
});

export async function setMembershipRole(
  _prev: ActionResult | undefined,
  formData: FormData,
): Promise<ActionResult> {
  const parsed = roleSchema.safeParse({
    membershipId: formData.get("membershipId"),
    organizationId: formData.get("organizationId"),
    roleSlug: formData.get("roleSlug"),
  });
  if (!parsed.success) {
    return { ok: false, error: parsed.error.issues[0].message };
  }

  try {
    await requirePermission("manage_users", parsed.data.organizationId);
  } catch {
    return { ok: false, error: "Not permitted." };
  }
  const actor = await requireUser();
  const service = createServiceClient();

  const [{ data: membership }, { data: org }] = await Promise.all([
    service
      .from("organization_memberships")
      .select("id, user_id, organization_id, role_slug")
      .eq("id", parsed.data.membershipId)
      .maybeSingle(),
    service
      .from("organizations")
      .select("type")
      .eq("id", parsed.data.organizationId)
      .maybeSingle(),
  ]);
  if (!membership || membership.organization_id !== parsed.data.organizationId) {
    return { ok: false, error: "Member not found." };
  }
  if (!org) return { ok: false, error: "Organisation not found." };
  if (membership.user_id === actor.id) {
    return { ok: false, error: "You can't change your own role." };
  }

  const allowed = rolesForOrgType((org as { type: string }).type);
  if (!allowed.includes(parsed.data.roleSlug)) {
    return {
      ok: false,
      error: "That role isn't valid for this kind of organisation.",
    };
  }
  if (membership.role_slug === parsed.data.roleSlug) {
    return { ok: true }; // no-op
  }

  // Only a super_admin may grant super_admin.
  if (parsed.data.roleSlug === "super_admin") {
    const memberships = await getUserMemberships();
    const actorIsSuper = memberships.some((m) => m.roleSlug === "super_admin");
    if (!actorIsSuper) {
      return {
        ok: false,
        error: "Only a Super Admin can grant the Super Admin role.",
      };
    }
  }

  const { error } = await service
    .from("organization_memberships")
    .update({ role_slug: parsed.data.roleSlug })
    .eq("id", parsed.data.membershipId);
  if (error) return { ok: false, error: error.message };

  await recordSecurityEvent({
    userId: membership.user_id,
    kind: "role_changed",
    metadata: {
      organization_id: parsed.data.organizationId,
      from: membership.role_slug,
      to: parsed.data.roleSlug,
      by: actor.id,
    },
  });
  await withAudit(
    {
      action: "membership.role_changed",
      resourceType: "organization_membership",
      resourceId: parsed.data.membershipId,
      organizationId: parsed.data.organizationId,
      before: { role_slug: membership.role_slug },
      after: { role_slug: parsed.data.roleSlug },
    },
    async () => null,
  );

  revalidatePath("/admin/security/users");
  revalidatePath(`/admin/clients/${parsed.data.organizationId}/users`);
  revalidatePath(`/admin/partners/${parsed.data.organizationId}`);
  return { ok: true };
}
