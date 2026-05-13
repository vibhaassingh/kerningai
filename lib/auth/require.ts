import "server-only";

import { redirect } from "next/navigation";

import { createClient } from "@/lib/supabase/server";
import { getUserMemberships, type Membership } from "@/lib/tenancy/current-org";

import type { PermissionSlug } from "@/lib/rbac/permissions";

export class UnauthorizedError extends Error {
  constructor(message = "Not authorized") {
    super(message);
    this.name = "UnauthorizedError";
  }
}

export class TenantBoundaryError extends Error {
  constructor(message = "Cross-tenant access denied") {
    super(message);
    this.name = "TenantBoundaryError";
  }
}

/**
 * Resolves the current authenticated user. Redirects to `/login` if not
 * signed in. Use at the top of a Server Component that requires a session.
 */
export async function requireUser() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) {
    redirect("/login");
  }
  return user;
}

/**
 * Resolves the current user plus a membership in the given org. Throws
 * `UnauthorizedError` if the user is not a member of that org. Returns
 * the membership for downstream role/permission checks.
 *
 * NOTE: this does not perform the permission check itself — call
 * `requirePermission` for that.
 */
export async function requireOrg(orgId: string): Promise<Membership> {
  const memberships = await getUserMemberships();
  const m = memberships.find((mb) => mb.organizationId === orgId);
  if (!m) throw new TenantBoundaryError();
  return m;
}

/**
 * Resolves the current user, verifies org membership, and checks the
 * given permission via the `app.has_permission` SQL function. Throws
 * `UnauthorizedError` if the permission check fails.
 *
 * Server Actions and Route Handlers should call this as the very first
 * thing they do.
 */
export async function requirePermission(
  permission: PermissionSlug,
  orgId: string,
): Promise<{ membership: Membership; userId: string }> {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) throw new UnauthorizedError("Not signed in");

  const membership = await requireOrg(orgId);

  const { data, error } = await supabase.rpc("has_permission", {
    p_permission: permission,
    p_org_id: orgId,
  });
  if (error) throw new UnauthorizedError(`Permission check failed: ${error.message}`);
  if (data !== true) throw new UnauthorizedError(`Missing permission: ${permission}`);

  return { membership, userId: user.id };
}

/**
 * Lightweight no-org-required permission check — true if the user holds
 * the permission in ANY of their active memberships. Useful for global
 * surface gating (e.g. "is this user a CMS editor anywhere?").
 */
export async function hasPermissionAny(
  permission: PermissionSlug,
): Promise<boolean> {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return false;

  const { data, error } = await supabase.rpc("has_permission_any", {
    p_permission: permission,
  });
  if (error) return false;
  return data === true;
}
