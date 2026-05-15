"use server";

import { headers } from "next/headers";
import { redirect } from "next/navigation";
import { revalidatePath } from "next/cache";
import { z } from "zod";

import { recordSecurityEvent, withAudit } from "@/lib/audit/with-audit";
import { requirePermission, requireUser } from "@/lib/auth/require";
import {
  defaultInviteExpiry,
  generateInviteToken,
  hashInviteToken,
} from "@/lib/auth/invites";
import type { ActionResult } from "@/lib/auth/actions";
import { SITE_URL } from "@/lib/env";
import { sendEmail } from "@/lib/email/resend";
import { inviteEmail } from "@/lib/email/templates/invite";
import { createClient } from "@/lib/supabase/server";
import { createServiceClient } from "@/lib/supabase/service";

import {
  CLIENT_ROLES,
  INTERNAL_ROLES,
  PARTNER_ROLES,
  type RoleSlug,
} from "@/lib/rbac/roles";

const ALL_ROLE_SLUGS = [
  ...INTERNAL_ROLES,
  ...CLIENT_ROLES,
  ...PARTNER_ROLES,
] as readonly string[];

// ---------------------------------------------------------------------------
// inviteUser
// ---------------------------------------------------------------------------
const inviteSchema = z.object({
  email: z.string().email("Enter a valid email address."),
  organizationId: z.string().uuid("Pick an organization."),
  roleSlug: z
    .string()
    .min(1, "Pick a role.")
    .refine((v): v is RoleSlug => ALL_ROLE_SLUGS.includes(v), "Unknown role."),
});

export async function inviteUser(
  _prev: ActionResult<{ inviteId: string }> | undefined,
  formData: FormData,
): Promise<ActionResult<{ inviteId: string }>> {
  const parsed = inviteSchema.safeParse({
    email: formData.get("email"),
    organizationId: formData.get("organizationId"),
    roleSlug: formData.get("roleSlug"),
  });
  if (!parsed.success) {
    const issue = parsed.error.issues[0];
    return { ok: false, error: issue.message, field: issue.path.join(".") };
  }

  try {
    await requirePermission("manage_users", parsed.data.organizationId);
  } catch {
    return { ok: false, error: "You don't have permission to invite users to this organization." };
  }

  const user = await requireUser();
  const supabase = await createClient();
  const { data: actorProfile } = await supabase
    .from("app_users")
    .select("full_name, email")
    .eq("id", user.id)
    .maybeSingle();

  const service = createServiceClient();

  // Reject if an active member with that email already exists in this org.
  const { data: existingMember } = await service
    .from("org_members_view")
    .select("user_id")
    .eq("organization_id", parsed.data.organizationId)
    .ilike("email", parsed.data.email)
    .maybeSingle();
  if (existingMember) {
    return { ok: false, error: "That email is already a member of this organization.", field: "email" };
  }

  const { token, tokenHash } = generateInviteToken();
  const expiresAt = defaultInviteExpiry();

  // If a pending invite for this email already exists, refresh it in place
  // so the new email link supersedes the old one. Otherwise insert fresh.
  // We use service role here — permission was already enforced above.
  const { data: existing } = await service
    .from("invites")
    .select("id")
    .eq("organization_id", parsed.data.organizationId)
    .ilike("email", parsed.data.email)
    .eq("status", "pending")
    .maybeSingle();

  let invite: { id: string } | null = null;
  let insertError: { message: string } | null = null;

  if (existing) {
    const { data: updated, error } = await service
      .from("invites")
      .update({
        role_slug: parsed.data.roleSlug,
        token_hash: tokenHash,
        expires_at: expiresAt.toISOString(),
        invited_by_id: user.id,
      })
      .eq("id", existing.id)
      .select("id")
      .single();
    invite = updated;
    insertError = error ?? null;
  } else {
    const { data: created, error } = await service
      .from("invites")
      .insert({
        email: parsed.data.email,
        organization_id: parsed.data.organizationId,
        role_slug: parsed.data.roleSlug,
        token_hash: tokenHash,
        expires_at: expiresAt.toISOString(),
        status: "pending",
        invited_by_id: user.id,
      })
      .select("id")
      .single();
    invite = created;
    insertError = error ?? null;
  }

  if (insertError || !invite) {
    return { ok: false, error: insertError?.message ?? "Could not create invite." };
  }

  // Fetch org + role for the email body.
  const [{ data: org }, { data: role }] = await Promise.all([
    service.from("organizations").select("name").eq("id", parsed.data.organizationId).single(),
    service.from("roles").select("name").eq("slug", parsed.data.roleSlug).single(),
  ]);

  const acceptUrl = `${SITE_URL}/invite/${token}`;
  const email = inviteEmail({
    inviteeEmail: parsed.data.email,
    inviterName: actorProfile?.full_name ?? actorProfile?.email ?? "A Kerning teammate",
    organizationName: org?.name ?? "Kerning AI",
    roleName: role?.name ?? parsed.data.roleSlug,
    acceptUrl,
    expiresAt,
  });

  const send = await sendEmail({
    to: parsed.data.email,
    subject: email.subject,
    html: email.html,
    text: email.text,
  });

  await withAudit(
    {
      action: "invite.created",
      resourceType: "invite",
      resourceId: invite.id,
      organizationId: parsed.data.organizationId,
      after: {
        email: parsed.data.email,
        role_slug: parsed.data.roleSlug,
        email_send_ok: send.ok,
      },
    },
    async () => null,
  );

  revalidatePath("/admin/security/users");
  return { ok: true, data: { inviteId: invite.id } };
}

// ---------------------------------------------------------------------------
// revokeInvite
// ---------------------------------------------------------------------------
export async function revokeInvite(
  inviteId: string,
): Promise<ActionResult> {
  const service = createServiceClient();
  const { data: invite } = await service
    .from("invites")
    .select("id, organization_id, status")
    .eq("id", inviteId)
    .maybeSingle();

  if (!invite) return { ok: false, error: "Invite not found." };
  if (invite.status !== "pending") {
    return { ok: false, error: `Invite is already ${invite.status}.` };
  }

  try {
    await requirePermission("manage_users", invite.organization_id);
  } catch {
    return { ok: false, error: "Not permitted." };
  }

  const { error } = await service
    .from("invites")
    .update({ status: "revoked" })
    .eq("id", inviteId);

  if (error) return { ok: false, error: error.message };

  await withAudit(
    {
      action: "invite.revoked",
      resourceType: "invite",
      resourceId: inviteId,
      organizationId: invite.organization_id,
    },
    async () => null,
  );

  revalidatePath("/admin/security/users");
  return { ok: true };
}

// ---------------------------------------------------------------------------
// acceptInvite
// ---------------------------------------------------------------------------
const acceptInviteSchema = z.object({
  token: z.string().min(1),
  fullName: z.string().min(1, "Tell us what to call you."),
  password: z
    .string()
    .min(12, "Password must be at least 12 characters.")
    .regex(/[A-Z]/, "Include at least one uppercase letter.")
    .regex(/[a-z]/, "Include at least one lowercase letter.")
    .regex(/[0-9]/, "Include at least one number."),
});

export async function acceptInvite(
  _prev: ActionResult | undefined,
  formData: FormData,
): Promise<ActionResult> {
  const parsed = acceptInviteSchema.safeParse({
    token: formData.get("token"),
    fullName: formData.get("fullName"),
    password: formData.get("password"),
  });
  if (!parsed.success) {
    const issue = parsed.error.issues[0];
    return { ok: false, error: issue.message, field: issue.path.join(".") };
  }

  const tokenHash = hashInviteToken(parsed.data.token);
  const service = createServiceClient();

  const { data: invite } = await service
    .from("invites")
    .select("id, email, organization_id, role_slug, status, expires_at")
    .eq("token_hash", tokenHash)
    .maybeSingle();

  if (!invite) {
    return { ok: false, error: "Invite is invalid or has been used." };
  }
  if (invite.status !== "pending") {
    return { ok: false, error: `Invite was already ${invite.status}.` };
  }
  if (new Date(invite.expires_at) < new Date()) {
    await service.from("invites").update({ status: "expired" }).eq("id", invite.id);
    return { ok: false, error: "This invite has expired. Ask your Kerning contact for a new one." };
  }

  // Create the auth user via admin API.
  const { data: created, error: createErr } = await service.auth.admin.createUser({
    email: invite.email,
    password: parsed.data.password,
    email_confirm: true,
    user_metadata: { full_name: parsed.data.fullName },
  });

  if (createErr || !created.user) {
    // Email already registered? Try to look up the existing user instead so
    // we can attach them to this org.
    if (createErr?.code === "email_exists") {
      const { data: list } = await service.auth.admin.listUsers();
      const existing = list.users.find((u) => u.email?.toLowerCase() === invite.email.toLowerCase());
      if (!existing) {
        return { ok: false, error: "An account with this email already exists but couldn't be linked." };
      }
      // Update password + name so the user can sign in either way.
      await service.auth.admin.updateUserById(existing.id, {
        password: parsed.data.password,
        user_metadata: { full_name: parsed.data.fullName },
      });
      await attachMembership({
        userId: existing.id,
        email: invite.email,
        fullName: parsed.data.fullName,
        orgId: invite.organization_id,
        roleSlug: invite.role_slug,
        inviteId: invite.id,
      });
    } else {
      return { ok: false, error: createErr?.message ?? "Could not create the account." };
    }
  } else {
    await attachMembership({
      userId: created.user.id,
      email: invite.email,
      fullName: parsed.data.fullName,
      orgId: invite.organization_id,
      roleSlug: invite.role_slug,
      inviteId: invite.id,
    });
  }

  // Sign the user in by exchanging email/password via the user-scoped client.
  const supabase = await createClient();
  const { error: signInErr } = await supabase.auth.signInWithPassword({
    email: invite.email,
    password: parsed.data.password,
  });
  if (signInErr) {
    // Account was created but auto-sign-in failed; send them to /login.
    redirect("/login");
  }

  const h = await headers();
  await recordSecurityEvent({
    userId: created?.user?.id ?? null,
    kind: "invite_accepted",
    ip: h.get("x-forwarded-for")?.split(",")[0]?.trim() ?? h.get("x-real-ip"),
    userAgent: h.get("user-agent"),
    metadata: { invite_id: invite.id, organization_id: invite.organization_id },
  });

  // Route to the user's primary shell. attachMembership has already created
  // the membership; signInWithPassword's smart redirect logic is duplicated
  // here briefly because the redirect needs to be a final tail action.
  const { data: orgRow } = await service
    .from("organizations")
    .select("type")
    .eq("id", invite.organization_id)
    .maybeSingle();
  redirect(
    orgRow?.type === "internal"
      ? "/admin"
      : orgRow?.type === "partner"
        ? "/partner"
        : "/portal",
  );
}

async function attachMembership(opts: {
  userId: string;
  email: string;
  fullName: string;
  orgId: string;
  roleSlug: string;
  inviteId: string;
}) {
  const service = createServiceClient();

  // Ensure app_users row exists with the right profile (trigger handles
  // initial insert; we update name + default org here).
  await service
    .from("app_users")
    .upsert(
      {
        id: opts.userId,
        email: opts.email,
        full_name: opts.fullName,
        default_org_id: opts.orgId,
      },
      { onConflict: "id" },
    );

  // Create the membership.
  await service.from("organization_memberships").upsert(
    {
      user_id: opts.userId,
      organization_id: opts.orgId,
      role_slug: opts.roleSlug,
      status: "active",
      accepted_at: new Date().toISOString(),
    },
    { onConflict: "user_id,organization_id" },
  );

  // Mark the invite consumed.
  await service
    .from("invites")
    .update({
      status: "accepted",
      accepted_by_id: opts.userId,
      accepted_at: new Date().toISOString(),
    })
    .eq("id", opts.inviteId);

  await withAudit(
    {
      action: "invite.accepted",
      resourceType: "invite",
      resourceId: opts.inviteId,
      organizationId: opts.orgId,
      after: { user_id: opts.userId, role_slug: opts.roleSlug },
    },
    async () => null,
  );
}
