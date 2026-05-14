import "server-only";

import { createClient } from "@/lib/supabase/server";
import { getUserMemberships } from "@/lib/tenancy/current-org";

export interface PortalMember {
  membership_id: string;
  user_id: string;
  email: string;
  full_name: string | null;
  role_slug: string;
  role_name: string;
  status: "active" | "suspended" | "pending";
  last_login_at: string | null;
  accepted_at: string | null;
}

export interface PortalPendingInvite {
  id: string;
  email: string;
  role_slug: string;
  status: "pending" | "expired" | "revoked";
  expires_at: string;
  created_at: string;
}

/**
 * Returns the active client org for the current user. Used by /portal
 * pages to pick the org context without an explicit switcher (Phase 4
 * will introduce the switcher proper).
 */
export async function getPortalClientId(): Promise<string | null> {
  const memberships = await getUserMemberships();
  const client = memberships.find((m) => m.organizationType === "client");
  return client?.organizationId ?? null;
}

export async function getPortalContext(): Promise<{
  organizationId: string;
  organizationName: string;
  roleSlug: string;
} | null> {
  const memberships = await getUserMemberships();
  const client = memberships.find((m) => m.organizationType === "client");
  if (!client) return null;
  return {
    organizationId: client.organizationId,
    organizationName: client.organizationName,
    roleSlug: client.roleSlug,
  };
}

export async function listPortalMembers(clientId: string): Promise<PortalMember[]> {
  const supabase = await createClient();
  const { data } = await supabase
    .from("org_members_view")
    .select(
      "membership_id, user_id, email, full_name, role_slug, role_name, status, last_login_at, accepted_at",
    )
    .eq("organization_id", clientId)
    .order("status", { ascending: true });
  return (data ?? []) as PortalMember[];
}

export async function listPortalPendingInvites(
  clientId: string,
): Promise<PortalPendingInvite[]> {
  const supabase = await createClient();
  const { data } = await supabase
    .from("invites")
    .select("id, email, role_slug, status, expires_at, created_at")
    .eq("organization_id", clientId)
    .in("status", ["pending", "expired", "revoked"])
    .order("created_at", { ascending: false })
    .limit(50);
  return (data ?? []) as PortalPendingInvite[];
}
