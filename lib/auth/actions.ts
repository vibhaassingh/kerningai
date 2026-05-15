"use server";

import { headers } from "next/headers";
import { redirect } from "next/navigation";
import { z } from "zod";

import { recordSecurityEvent } from "@/lib/audit/with-audit";
import { safeRedirectTarget, safeRedirectUrl } from "@/lib/auth/redirects";
import { rateLimit } from "@/lib/auth/rate-limit";
import { SITE_URL, GOOGLE_OAUTH_CONFIGURED } from "@/lib/env";
import { createClient } from "@/lib/supabase/server";
import { createServiceClient } from "@/lib/supabase/service";

// ---------------------------------------------------------------------------
// Result type
// ---------------------------------------------------------------------------
export type ActionResult<T = undefined> =
  | { ok: true; data?: T }
  | { ok: false; error: string; field?: string };

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------
async function clientIp(): Promise<string | null> {
  const h = await headers();
  return (
    h.get("x-forwarded-for")?.split(",")[0]?.trim() ??
    h.get("x-real-ip") ??
    null
  );
}

async function userAgent(): Promise<string | null> {
  const h = await headers();
  return h.get("user-agent") ?? null;
}

// ---------------------------------------------------------------------------
// Schemas
// ---------------------------------------------------------------------------
const loginSchema = z.object({
  email: z.string().email("Enter a valid email address."),
  password: z.string().min(1, "Password is required."),
  returnTo: z.string().optional(),
});

const emailOnlySchema = z.object({
  email: z.string().email("Enter a valid email address."),
});

const newPasswordSchema = z
  .string()
  .min(12, "Password must be at least 12 characters.")
  .regex(/[A-Z]/, "Include at least one uppercase letter.")
  .regex(/[a-z]/, "Include at least one lowercase letter.")
  .regex(/[0-9]/, "Include at least one number.");

const resetPasswordSchema = z.object({
  password: newPasswordSchema,
});

const changePasswordSchema = z.object({
  currentPassword: z.string().min(1),
  newPassword: newPasswordSchema,
});

// ---------------------------------------------------------------------------
// signInWithPassword
// ---------------------------------------------------------------------------
export async function signInWithPassword(
  _prev: ActionResult | undefined,
  formData: FormData,
): Promise<ActionResult> {
  const parsed = loginSchema.safeParse({
    email: formData.get("email"),
    password: formData.get("password"),
    returnTo: formData.get("returnTo") ?? undefined,
  });
  if (!parsed.success) {
    const issue = parsed.error.issues[0];
    return { ok: false, error: issue.message, field: issue.path.join(".") };
  }

  const ip = await clientIp();
  const rl = await rateLimit({
    key: `login:${ip ?? "unknown"}`,
    limit: 5,
    windowSeconds: 15 * 60,
  });
  if (!rl.allowed) {
    return {
      ok: false,
      error: `Too many sign-in attempts. Try again in ${Math.ceil(rl.retryAfterSeconds / 60)} minutes.`,
    };
  }

  const supabase = await createClient();
  const { data, error } = await supabase.auth.signInWithPassword({
    email: parsed.data.email,
    password: parsed.data.password,
  });

  if (error || !data.user) {
    await recordSecurityEvent({
      userId: null,
      kind: "login_failed",
      ip,
      userAgent: await userAgent(),
      metadata: { email: parsed.data.email },
    });
    return { ok: false, error: "Email or password is incorrect." };
  }

  await recordSecurityEvent({
    userId: data.user.id,
    kind: "login_succeeded",
    ip,
    userAgent: await userAgent(),
  });

  // If the caller passed a returnTo, honor it (validated against the
  // allowlist). Otherwise route the user to their primary shell based
  // on org type. Internal staff → /admin, client users → /portal,
  // partner users → /partner, anyone with no active membership →
  // /accept-invite to surface that.
  let target = parsed.data.returnTo
    ? safeRedirectTarget(parsed.data.returnTo)
    : null;

  if (!target || target === "/") {
    const { data: memberships } = await supabase
      .from("organization_memberships")
      .select("organization_id, status, organizations:organizations!inner(type)")
      .eq("user_id", data.user.id)
      .eq("status", "active");

    type MembershipRow = {
      organizations: { type: "internal" | "client" | "partner" };
    };
    const rows = (memberships ?? []) as unknown as MembershipRow[];
    const hasInternal = rows.some((m) => m.organizations.type === "internal");
    const hasClient = rows.some((m) => m.organizations.type === "client");
    const hasPartner = rows.some((m) => m.organizations.type === "partner");

    target = hasInternal
      ? "/admin"
      : hasClient
        ? "/portal"
        : hasPartner
          ? "/partner"
          : "/accept-invite";
  }

  redirect(target);
}

// ---------------------------------------------------------------------------
// signOut
// ---------------------------------------------------------------------------
export async function signOut(): Promise<void> {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  await supabase.auth.signOut();
  if (user) {
    await recordSecurityEvent({
      userId: user.id,
      kind: "logout",
      ip: await clientIp(),
      userAgent: await userAgent(),
    });
  }
  redirect("/login");
}

// ---------------------------------------------------------------------------
// requestPasswordReset
// ---------------------------------------------------------------------------
export async function requestPasswordReset(
  _prev: ActionResult | undefined,
  formData: FormData,
): Promise<ActionResult> {
  const parsed = emailOnlySchema.safeParse({ email: formData.get("email") });
  if (!parsed.success) {
    return { ok: false, error: parsed.error.issues[0].message, field: "email" };
  }

  const ip = await clientIp();
  const rl = await rateLimit({
    key: `forgot:${ip ?? "unknown"}`,
    limit: 3,
    windowSeconds: 15 * 60,
  });
  if (!rl.allowed) {
    return { ok: false, error: "Too many requests. Try again later." };
  }

  const supabase = await createClient();
  // We don't reveal whether the email exists.
  await supabase.auth.resetPasswordForEmail(parsed.data.email, {
    redirectTo: `${SITE_URL}/reset-password`,
  });

  await recordSecurityEvent({
    userId: null,
    kind: "password_reset_requested",
    ip,
    userAgent: await userAgent(),
    metadata: { email: parsed.data.email },
  });

  return {
    ok: true,
    data: undefined,
  };
}

// ---------------------------------------------------------------------------
// resetPassword
// ---------------------------------------------------------------------------
export async function resetPassword(
  _prev: ActionResult | undefined,
  formData: FormData,
): Promise<ActionResult> {
  const parsed = resetPasswordSchema.safeParse({
    password: formData.get("password"),
  });
  if (!parsed.success) {
    return {
      ok: false,
      error: parsed.error.issues[0].message,
      field: "password",
    };
  }

  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  // The user gets here via the recovery email link, which exchanges the
  // recovery token for a temporary session before landing on /reset-password.
  // If there's no session, the link is invalid or expired.
  if (!user) {
    return { ok: false, error: "Reset link is invalid or expired. Request a new one." };
  }

  const { error } = await supabase.auth.updateUser({
    password: parsed.data.password,
  });
  if (error) return { ok: false, error: error.message };

  await recordSecurityEvent({
    userId: user.id,
    kind: "password_reset_completed",
    ip: await clientIp(),
    userAgent: await userAgent(),
  });

  redirect("/login?reset=ok");
}

// ---------------------------------------------------------------------------
// changePassword (from settings/security)
// ---------------------------------------------------------------------------
export async function changePassword(
  _prev: ActionResult | undefined,
  formData: FormData,
): Promise<ActionResult> {
  const parsed = changePasswordSchema.safeParse({
    currentPassword: formData.get("currentPassword"),
    newPassword: formData.get("newPassword"),
  });
  if (!parsed.success) {
    return {
      ok: false,
      error: parsed.error.issues[0].message,
      field: parsed.error.issues[0].path.join("."),
    };
  }

  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user || !user.email) return { ok: false, error: "Not signed in." };

  // Re-auth to verify current password.
  const { error: signInError } = await supabase.auth.signInWithPassword({
    email: user.email,
    password: parsed.data.currentPassword,
  });
  if (signInError) {
    return { ok: false, error: "Current password is incorrect.", field: "currentPassword" };
  }

  const { error } = await supabase.auth.updateUser({
    password: parsed.data.newPassword,
  });
  if (error) return { ok: false, error: error.message };

  await recordSecurityEvent({
    userId: user.id,
    kind: "password_changed",
    ip: await clientIp(),
    userAgent: await userAgent(),
  });

  return { ok: true };
}

// ---------------------------------------------------------------------------
// Connected accounts — Google link / unlink / list
// ---------------------------------------------------------------------------

export interface ConnectedAccountsSnapshot {
  hasPassword: boolean;
  google: { linked: boolean; email: string | null } | null;
}

export async function listConnectedAccounts(): Promise<ConnectedAccountsSnapshot> {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return { hasPassword: false, google: null };

  // `identities` on the auth user exposes all linked providers including
  // "email" (password). Use that as the source of truth.
  const identities = user.identities ?? [];
  const hasPassword = identities.some((i) => i.provider === "email");
  const googleIdentity = identities.find((i) => i.provider === "google");

  return {
    hasPassword,
    google: googleIdentity
      ? {
          linked: true,
          email:
            (googleIdentity.identity_data?.email as string | undefined) ??
            user.email ??
            null,
        }
      : null,
  };
}

/**
 * Starts the Google OAuth flow with `linkIdentity` so the resulting
 * identity is attached to the current authed user instead of creating
 * a new one. Throws if Google OAuth isn't configured server-side.
 */
export async function linkGoogleStart(returnTo?: string): Promise<ActionResult<{ url: string }>> {
  if (!GOOGLE_OAUTH_CONFIGURED) {
    return { ok: false, error: "Google sign-in is not configured." };
  }

  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return { ok: false, error: "Not signed in." };

  const target = safeRedirectUrl(
    returnTo ?? `${SITE_URL}/auth/callback?next=${encodeURIComponent("/portal/settings/security")}`,
  );

  const { data, error } = await supabase.auth.linkIdentity({
    provider: "google",
    options: { redirectTo: target },
  });
  if (error || !data?.url) {
    return { ok: false, error: error?.message ?? "Could not start Google flow." };
  }
  return { ok: true, data: { url: data.url } };
}

/**
 * Unlinks the Google identity, but only if the user retains at least one
 * other sign-in method (currently: password). Records a security event.
 */
export async function unlinkGoogle(): Promise<ActionResult> {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return { ok: false, error: "Not signed in." };

  const identities = user.identities ?? [];
  const google = identities.find((i) => i.provider === "google");
  if (!google) return { ok: false, error: "Google is not linked." };

  const hasPassword = identities.some((i) => i.provider === "email");
  if (!hasPassword) {
    return {
      ok: false,
      error: "Set a password before unlinking Google so you can still sign in.",
    };
  }

  const { error } = await supabase.auth.unlinkIdentity(google);
  if (error) return { ok: false, error: error.message };

  await recordSecurityEvent({
    userId: user.id,
    kind: "google_unlinked",
    ip: await clientIp(),
    userAgent: await userAgent(),
  });

  // Mirror the unlink into our own connected_accounts table for fast queries.
  try {
    const service = createServiceClient();
    await service
      .from("connected_accounts")
      .delete()
      .eq("user_id", user.id)
      .eq("provider", "google");
  } catch (err) {
    console.error("[auth] failed to clean connected_accounts", err);
  }

  return { ok: true };
}

/**
 * Starts a "sign in with Google" flow for a NEW or RETURNING session
 * (not for linking — that's `linkGoogleStart`).
 */
export async function signInWithGoogle(returnTo?: string): Promise<ActionResult<{ url: string }>> {
  if (!GOOGLE_OAUTH_CONFIGURED) {
    return { ok: false, error: "Google sign-in is not configured." };
  }

  const supabase = await createClient();
  const target = safeRedirectUrl(
    returnTo ?? `${SITE_URL}/auth/callback?next=${encodeURIComponent("/portal")}`,
  );

  const { data, error } = await supabase.auth.signInWithOAuth({
    provider: "google",
    options: { redirectTo: target },
  });
  if (error || !data?.url) {
    return { ok: false, error: error?.message ?? "Could not start Google flow." };
  }
  return { ok: true, data: { url: data.url } };
}
