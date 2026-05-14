import "server-only";

import { createClient } from "@/lib/supabase/server";

import type { RoleSlug } from "@/lib/rbac/roles";

/**
 * A resolved membership: the user is active in this org with this role.
 */
export interface Membership {
  organizationId: string;
  organizationName: string;
  organizationType: "internal" | "client" | "partner";
  roleSlug: RoleSlug;
  siteIds: string[];
}

/**
 * Returns every active membership for the current authenticated user.
 * Used to populate the org switcher and to gate cross-tenant access.
 */
export async function getUserMemberships(): Promise<Membership[]> {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return [];

  const { data, error } = await supabase
    .from("organization_memberships")
    .select(
      "organization_id, role_slug, site_ids, organizations:organizations!inner ( id, name, type )",
    )
    .eq("user_id", user.id)
    .eq("status", "active");

  if (error || !data) return [];

  // Supabase typing for joined rows is awkward; cast through unknown.
  return (data as unknown as RawMembership[]).map((row) => ({
    organizationId: row.organization_id,
    organizationName: row.organizations.name,
    organizationType: row.organizations.type,
    roleSlug: row.role_slug as RoleSlug,
    siteIds: row.site_ids ?? [],
  }));
}

interface RawMembership {
  organization_id: string;
  role_slug: string;
  site_ids: string[] | null;
  organizations: {
    id: string;
    name: string;
    type: "internal" | "client" | "partner";
  };
}

/**
 * Returns the membership for the org the user is currently working in.
 * Resolution order: explicit `orgId` argument → cookie → user's
 * `default_org_id` → first active membership.
 */
export async function getCurrentMembership(
  orgId?: string,
): Promise<Membership | null> {
  const memberships = await getUserMemberships();
  if (memberships.length === 0) return null;

  if (orgId) {
    return memberships.find((m) => m.organizationId === orgId) ?? null;
  }

  // TODO Phase 2: read selected_org_id from a cookie set by the org switcher.
  return memberships[0];
}
