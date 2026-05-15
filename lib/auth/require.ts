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
 * `TenantBoundaryError` if the user has no relationship to that org.
 *
 * Internal staff have an implicit cross-org affinity: even though
 * `super_admin` and friends aren't members of every client's org row,
 * they're allowed to operate on it. We return a synthetic membership
 * for that path so downstream permission checks still pass through the
 * normal `requirePermission` helper.
 *
 * NOTE: this does not perform the permission check itself — call
 * `requirePermission` for that.
 */
export async function requireOrg(orgId: string): Promise<Membership> {
  const memberships = await getUserMemberships();
  const m = memberships.find((mb) => mb.organizationId === orgId);
  if (m) return m;

  // Internal-staff fallback: if the user holds any active membership in
  // an internal org, they may access any org. Specific permissions are
  // still enforced by `requirePermission`.
  const internal = memberships.find((mb) => mb.organizationType === "internal");
  if (internal) {
    return {
      organizationId: orgId,
      organizationName: "(cross-org as internal staff)",
      organizationType: "client",
      roleSlug: internal.roleSlug,
      siteIds: [],
    };
  }

  throw new TenantBoundaryError();
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
