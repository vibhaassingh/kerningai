import "server-only";

import { createClient } from "@/lib/supabase/server";

export interface ClientListRow {
  id: string;
  name: string;
  slug: string;
  region: string;
  status: "active" | "suspended" | "archived";
  industry: string | null;
  deployment_type: "cloud" | "sovereign_cloud" | "on_prem" | "air_gapped" | null;
  modules_enabled: string[];
  health_score: number | null;
  mrr_cents: number;
  currency: string;
  renewal_date: string | null;
  site_count: number;
  member_count: number;
}

/**
 * Returns every client org visible to the current session, plus a few
 * aggregate counts for the listing UI. RLS still applies — internal
 * staff see everyone, client users see only their own org.
 */
export async function listClients(): Promise<ClientListRow[]> {
  const supabase = await createClient();

  const { data: orgs, error } = await supabase
    .from("organizations")
    .select(
      `id, name, slug, region, status,
       client_settings!inner(industry, deployment_type, modules_enabled, health_score, mrr_cents, currency, renewal_date)`,
    )
    .eq("type", "client")
    .order("name", { ascending: true });

  if (error || !orgs) return [];

  type Row = {
    id: string;
    name: string;
    slug: string;
    region: string;
    status: "active" | "suspended" | "archived";
    client_settings: {
      industry: string | null;
      deployment_type: ClientListRow["deployment_type"];
      modules_enabled: string[];
      health_score: number | null;
      mrr_cents: number;
      currency: string;
      renewal_date: string | null;
    };
  };

  const rows = orgs as unknown as Row[];
  const orgIds = rows.map((r) => r.id);
  if (orgIds.length === 0) return [];

  const [sitesRes, membersRes] = await Promise.all([
    supabase
      .from("sites")
      .select("organization_id")
      .in("organization_id", orgIds),
    supabase
      .from("organization_memberships")
      .select("organization_id, status")
      .in("organization_id", orgIds),
  ]);

  const siteCount = countByKey(sitesRes.data ?? [], "organization_id");
  const memberCount = countByKey(
    (membersRes.data ?? []).filter((m) => (m as { status: string }).status === "active"),
    "organization_id",
  );

  return rows.map((r) => ({
    id: r.id,
    name: r.name,
    slug: r.slug,
    region: r.region,
    status: r.status,
    industry: r.client_settings.industry,
    deployment_type: r.client_settings.deployment_type,
    modules_enabled: r.client_settings.modules_enabled,
    health_score: r.client_settings.health_score,
    mrr_cents: r.client_settings.mrr_cents,
    currency: r.client_settings.currency,
    renewal_date: r.client_settings.renewal_date,
    site_count: siteCount.get(r.id) ?? 0,
    member_count: memberCount.get(r.id) ?? 0,
  }));
}

function countByKey<T extends Record<string, unknown>>(
  rows: T[],
  key: keyof T,
): Map<string, number> {
  const m = new Map<string, number>();
  for (const row of rows) {
    const k = String(row[key]);
    m.set(k, (m.get(k) ?? 0) + 1);
  }
  return m;
}

export interface ClientDetail extends ClientListRow {
  billing_email: string | null;
  created_at: string;
}

export async function getClientDetail(clientId: string): Promise<ClientDetail | null> {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("organizations")
    .select(
      `id, name, slug, region, status, billing_email, created_at,
       client_settings!inner(industry, deployment_type, modules_enabled, health_score, mrr_cents, currency, renewal_date)`,
    )
    .eq("type", "client")
    .eq("id", clientId)
    .maybeSingle();

  if (error || !data) return null;

  type Row = {
    id: string;
    name: string;
    slug: string;
    region: string;
    status: "active" | "suspended" | "archived";
    billing_email: string | null;
    created_at: string;
    client_settings: {
      industry: string | null;
      deployment_type: ClientListRow["deployment_type"];
      modules_enabled: string[];
      health_score: number | null;
      mrr_cents: number;
      currency: string;
      renewal_date: string | null;
    };
  };
  const r = data as unknown as Row;

  const [sitesRes, membersRes] = await Promise.all([
    supabase.from("sites").select("id", { count: "exact", head: true }).eq("organization_id", clientId),
    supabase
      .from("organization_memberships")
      .select("id", { count: "exact", head: true })
      .eq("organization_id", clientId)
      .eq("status", "active"),
  ]);

  return {
    id: r.id,
    name: r.name,
    slug: r.slug,
    region: r.region,
    status: r.status,
    billing_email: r.billing_email,
    created_at: r.created_at,
    industry: r.client_settings.industry,
    deployment_type: r.client_settings.deployment_type,
    modules_enabled: r.client_settings.modules_enabled,
    health_score: r.client_settings.health_score,
    mrr_cents: r.client_settings.mrr_cents,
    currency: r.client_settings.currency,
    renewal_date: r.client_settings.renewal_date,
    site_count: sitesRes.count ?? 0,
    member_count: membersRes.count ?? 0,
  };
}

export interface ClientSite {
  id: string;
  name: string;
  slug: string;
  region: string;
  timezone: string;
  deployment_type: ClientListRow["deployment_type"];
  status: "active" | "pending" | "archived";
  city: string | null;
  country: string | null;
  created_at: string;
}

export async function listClientSites(clientId: string): Promise<ClientSite[]> {
  const supabase = await createClient();
  const { data } = await supabase
    .from("sites")
    .select("id, name, slug, region, timezone, deployment_type, status, address, created_at")
    .eq("organization_id", clientId)
    .order("name", { ascending: true });

  type Row = {
    id: string;
    name: string;
    slug: string;
    region: string;
    timezone: string;
    deployment_type: ClientListRow["deployment_type"];
    status: ClientSite["status"];
    address: { city?: string; country?: string } | null;
    created_at: string;
  };

  return ((data ?? []) as Row[]).map((r) => ({
    id: r.id,
    name: r.name,
    slug: r.slug,
    region: r.region,
    timezone: r.timezone,
    deployment_type: r.deployment_type,
    status: r.status,
    city: r.address?.city ?? null,
    country: r.address?.country ?? null,
    created_at: r.created_at,
  }));
}

export interface ClientMember {
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

export async function listClientMembers(clientId: string): Promise<ClientMember[]> {
  const supabase = await createClient();
  const { data } = await supabase
    .from("org_members_view")
    .select(
      "membership_id, user_id, email, full_name, role_slug, role_name, status, last_login_at, accepted_at",
    )
    .eq("organization_id", clientId)
    .order("status", { ascending: true });

  return (data ?? []) as ClientMember[];
}

export interface ClientPendingInvite {
  id: string;
  email: string;
  role_slug: string;
  status: "pending" | "expired" | "revoked";
  expires_at: string;
  created_at: string;
}

export async function listClientPendingInvites(clientId: string): Promise<ClientPendingInvite[]> {
  const supabase = await createClient();
  const { data } = await supabase
    .from("invites")
    .select("id, email, role_slug, status, expires_at, created_at")
    .eq("organization_id", clientId)
    .in("status", ["pending", "expired", "revoked"])
    .order("created_at", { ascending: false })
    .limit(50);
  return (data ?? []) as ClientPendingInvite[];
}
