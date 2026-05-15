"use server";

import { revalidatePath } from "next/cache";
import { z } from "zod";

import type { ActionResult } from "@/lib/auth/actions";
import { requireUser } from "@/lib/auth/require";
import { recordSecurityEvent, withAudit } from "@/lib/audit/with-audit";
import { createServiceClient } from "@/lib/supabase/service";
import {
  buildOtpAuthUrl,
  generateBackupCodes,
  generateSecret,
  hashBackupCode,
  verifyTotp,
} from "@/lib/mfa/totp";

/**
 * MFA enrol — creates a `pending` factor row with a fresh TOTP secret +
 * backup codes. Returns the secret + otpauth URL + plaintext backup
 * codes (only this once). The user must then call `verifyMfaSetup` with
 * a valid code from their authenticator app to flip status to `active`.
 */
export async function enrolMfa(): Promise<
  ActionResult<{
    factorId: string;
    secret: string;
    otpauthUrl: string;
    backupCodes: string[];
  }>
> {
  const user = await requireUser();
  const service = createServiceClient();

  // Revoke any existing pending factor for this user — only one in-flight enrol.
  await service
    .from("user_mfa_factors")
    .update({ status: "revoked", revoked_at: new Date().toISOString() })
    .eq("user_id", user.id)
    .eq("status", "pending");

  const { data: profile } = await service
    .from("app_users")
    .select("email")
    .eq("id", user.id)
    .maybeSingle();
  const email = (profile as { email: string } | null)?.email ?? "kerning user";

  const secret = generateSecret();
  const otpauthUrl = buildOtpAuthUrl({ secret, accountEmail: email });
  const { plain, hashes } = generateBackupCodes();

  const { data: created, error } = await service
    .from("user_mfa_factors")
    .insert({
      user_id: user.id,
      kind: "totp",
      status: "pending",
      secret,
      label: "Authenticator",
      backup_code_hashes: hashes,
    })
    .select("id")
    .single();
  if (error || !created) {
    return { ok: false, error: error?.message ?? "Could not start enrolment." };
  }

  return {
    ok: true,
    data: {
      factorId: created.id,
      secret,
      otpauthUrl,
      backupCodes: plain,
    },
  };
}

const verifySchema = z.object({
  factorId: z.string().uuid(),
  token: z.string().min(6).max(8),
});

export async function verifyMfaSetup(
  _prev: ActionResult | undefined,
  formData: FormData,
): Promise<ActionResult> {
  const parsed = verifySchema.safeParse({
    factorId: formData.get("factorId"),
    token: formData.get("token"),
  });
  if (!parsed.success) return { ok: false, error: parsed.error.issues[0].message };

  const user = await requireUser();
  const service = createServiceClient();

  const { data: factor } = await service
    .from("user_mfa_factors")
    .select("id, secret, status, user_id")
    .eq("id", parsed.data.factorId)
    .maybeSingle();
  if (!factor) return { ok: false, error: "Factor not found." };
  type F = { id: string; secret: string; status: string; user_id: string };
  const f = factor as F;
  if (f.user_id !== user.id) return { ok: false, error: "Not your factor." };
  if (f.status === "active") return { ok: true };
  if (f.status === "revoked") {
    return { ok: false, error: "This enrolment was revoked. Start over." };
  }

  if (!verifyTotp({ token: parsed.data.token.trim(), secret: f.secret })) {
    return { ok: false, error: "Code didn't match. Try again." };
  }

  const { error } = await service
    .from("user_mfa_factors")
    .update({ status: "active", activated_at: new Date().toISOString() })
    .eq("id", f.id);
  if (error) return { ok: false, error: error.message };

  await Promise.all([
    withAudit(
      {
        action: "mfa.enabled",
        resourceType: "user_mfa_factor",
        resourceId: f.id,
        after: { kind: "totp" },
      },
      async () => null,
    ),
    recordSecurityEvent({ userId: user.id, kind: "mfa_enabled" }),
  ]);

  revalidatePath("/admin/settings/security");
  revalidatePath("/portal/settings/security");
  revalidatePath("/partner/settings/security");
  return { ok: true };
}

const verifyChallengeSchema = z.object({
  token: z.string().min(6).max(12),
});

/**
 * Verify a TOTP challenge during sign-in or sensitive-action gating.
 * Accepts either a 6-digit TOTP code OR a 10-character backup code
 * (which is consumed on success).
 */
export async function verifyMfaChallenge(
  input: z.infer<typeof verifyChallengeSchema>,
): Promise<ActionResult> {
  const parsed = verifyChallengeSchema.safeParse(input);
  if (!parsed.success) return { ok: false, error: parsed.error.issues[0].message };

  const user = await requireUser();
  const service = createServiceClient();

  const { data: factor } = await service
    .from("user_mfa_factors")
    .select("id, secret, backup_code_hashes, used_backup_code_hashes")
    .eq("user_id", user.id)
    .eq("status", "active")
    .maybeSingle();
  if (!factor) return { ok: false, error: "MFA not enabled." };
  type F = {
    id: string;
    secret: string;
    backup_code_hashes: string[];
    used_backup_code_hashes: string[];
  };
  const f = factor as F;

  const token = parsed.data.token.trim();

  // Try TOTP first.
  if (token.length === 6 && verifyTotp({ token, secret: f.secret })) {
    await service
      .from("user_mfa_factors")
      .update({ last_used_at: new Date().toISOString() })
      .eq("id", f.id);
    return { ok: true };
  }

  // Try backup code.
  const hash = hashBackupCode(token);
  if (
    f.backup_code_hashes.includes(hash) &&
    !f.used_backup_code_hashes.includes(hash)
  ) {
    await service
      .from("user_mfa_factors")
      .update({
        last_used_at: new Date().toISOString(),
        used_backup_code_hashes: [...f.used_backup_code_hashes, hash],
      })
      .eq("id", f.id);
    return { ok: true };
  }

  return { ok: false, error: "Code didn't match." };
}

export async function revokeMfa(
  _prev: ActionResult | undefined,
  formData: FormData,
): Promise<ActionResult> {
  const parsed = z.object({ factorId: z.string().uuid() }).safeParse({
    factorId: formData.get("factorId"),
  });
  if (!parsed.success) return { ok: false, error: parsed.error.issues[0].message };

  const user = await requireUser();
  const service = createServiceClient();

  const { data: factor } = await service
    .from("user_mfa_factors")
    .select("id, user_id")
    .eq("id", parsed.data.factorId)
    .maybeSingle();
  if (!factor) return { ok: false, error: "Factor not found." };
  if ((factor as { user_id: string }).user_id !== user.id) {
    return { ok: false, error: "Not your factor." };
  }

  const { error } = await service
    .from("user_mfa_factors")
    .update({ status: "revoked", revoked_at: new Date().toISOString() })
    .eq("id", parsed.data.factorId);
  if (error) return { ok: false, error: error.message };

  await Promise.all([
    withAudit(
      {
        action: "mfa.disabled",
        resourceType: "user_mfa_factor",
        resourceId: parsed.data.factorId,
      },
      async () => null,
    ),
    recordSecurityEvent({ userId: user.id, kind: "mfa_disabled" }),
  ]);

  revalidatePath("/admin/settings/security");
  revalidatePath("/portal/settings/security");
  revalidatePath("/partner/settings/security");
  return { ok: true };
}
