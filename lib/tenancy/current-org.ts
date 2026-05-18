import "server-only";

import { cache } from "react";

import { createClient } from "@/lib/supabase/server";
import { getRequestProfile, getRequestUser } from "@/lib/auth/request-session";

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
export const getUserMemberships = cache(async (): Promise<Membership[]> => {
  const user = await getRequestUser();
  if (!user) return [];

  const supabase = await createClient();
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
});

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

const SELECTED_ORG_COOKIE = "kerning_selected_org";

/**
 * Returns the membership for the org the user is currently working in.
 * Resolution order: explicit `orgId` argument → `kerning_selected_org`
 * cookie set by the org switcher → user's `default_org_id` from
 * app_users → first active membership.
 */
export async function getCurrentMembership(
  orgId?: string,
): Promise<Membership | null> {
  const memberships = await getUserMemberships();
  if (memberships.length === 0) return null;

  if (orgId) {
    return memberships.find((m) => m.organizationId === orgId) ?? null;
  }

  // Cookie set by switchOrg server action.
  const { cookies } = await import("next/headers");
  const cookieStore = await cookies();
  const selected = cookieStore.get(SELECTED_ORG_COOKIE)?.value;
  if (selected) {
    const fromCookie = memberships.find((m) => m.organizationId === selected);
    if (fromCookie) return fromCookie;
  }

  // app_users.default_org_id fallback (request-memoized profile).
  const profile = await getRequestProfile();
  if (profile?.default_org_id) {
    const fromDefault = memberships.find(
      (m) => m.organizationId === profile.default_org_id,
    );
    if (fromDefault) return fromDefault;
  }

  return memberships[0];
}
