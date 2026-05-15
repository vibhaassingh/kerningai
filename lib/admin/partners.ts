import "server-only";

import { createClient } from "@/lib/supabase/server";

export interface PartnerOrgRow {
  id: string;
  name: string;
  slug: string;
  region: string;
  status: "active" | "suspended" | "archived";
  billing_email: string | null;
  created_at: string;
  member_count: number;
  lead_count: number;
  project_count: number;
}

/**
 * Lists every partner organisation. RLS still applies — internal staff
 * see all orgs; this page is additionally permission-gated in the route.
 */
export async function listPartnerOrgs(): Promise<PartnerOrgRow[]> {
  const supabase = await createClient();

  const { data: orgs, error } = await supabase
    .from("organizations")
    .select("id, name, slug, region, status, billing_email, created_at")
    .eq("type", "partner")
    .is("deleted_at", null)
    .order("name", { ascending: true });

  if (error || !orgs) return [];

  const orgIds = orgs.map((o) => o.id);
  if (orgIds.length === 0) return [];

  const [membersRes, projectsRes, leadsRes] = await Promise.all([
    supabase
      .from("organization_memberships")
      .select("organization_id, status")
      .in("organization_id", orgIds),
    supabase
      .from("projects")
      .select("partner_org_id")
      .in("partner_org_id", orgIds)
      .is("deleted_at", null),
    supabase
      .from("leads")
      .select("id, metadata")
      .not("metadata->>partner_org_id", "is", null),
  ]);

  const memberCount = new Map<string, number>();
  for (const m of (membersRes.data ?? []) as {
    organization_id: string;
    status: string;
  }[]) {
    if (m.status !== "active") continue;
    memberCount.set(
      m.organization_id,
      (memberCount.get(m.organization_id) ?? 0) + 1,
    );
  }

  const projectCount = new Map<string, number>();
  for (const p of (projectsRes.data ?? []) as {
    partner_org_id: string | null;
  }[]) {
    if (!p.partner_org_id) continue;
    projectCount.set(
      p.partner_org_id,
      (projectCount.get(p.partner_org_id) ?? 0) + 1,
    );
  }

  const leadCount = new Map<string, number>();
  for (const l of (leadsRes.data ?? []) as {
    metadata: { partner_org_id?: string } | null;
  }[]) {
    const pid = l.metadata?.partner_org_id;
    if (!pid) continue;
    leadCount.set(pid, (leadCount.get(pid) ?? 0) + 1);
  }

  return orgs.map((o) => ({
    id: o.id,
    name: o.name,
    slug: o.slug,
    region: o.region,
    status: o.status as PartnerOrgRow["status"],
    billing_email: o.billing_email,
    created_at: o.created_at,
    member_count: memberCount.get(o.id) ?? 0,
    lead_count: leadCount.get(o.id) ?? 0,
    project_count: projectCount.get(o.id) ?? 0,
  }));
}

/** Minimal {id,name} list for partner-assignment dropdowns. */
export async function listPartnerOrgOptions(): Promise<
  { id: string; name: string }[]
> {
  const supabase = await createClient();
  const { data } = await supabase
    .from("organizations")
    .select("id, name")
    .eq("type", "partner")
    .eq("status", "active")
    .is("deleted_at", null)
    .order("name", { ascending: true });
  return (data ?? []) as { id: string; name: string }[];
}

/** Soft-deleted partner orgs, for the "Recently deleted" / restore list. */
export async function listDeletedPartnerOrgs(): Promise<
  { id: string; name: string; slug: string; deleted_at: string | null }[]
> {
  const supabase = await createClient();
  const { data } = await supabase
    .from("organizations")
    .select("id, name, slug, deleted_at")
    .eq("type", "partner")
    .not("deleted_at", "is", null)
    .order("deleted_at", { ascending: false });
  return (data ?? []) as {
    id: string;
    name: string;
    slug: string;
    deleted_at: string | null;
  }[];
}

export interface PartnerOrgDetail {
  id: string;
  name: string;
  slug: string;
  region: string;
  status: "active" | "suspended" | "archived";
  billing_email: string | null;
  created_at: string;
  deleted_at: string | null;
}

export interface PartnerMemberRow {
  membership_id: string;
  user_id: string;
  email: string;
  full_name: string | null;
  role_slug: string;
  role_name: string;
  status: "active" | "suspended" | "pending";
  accepted_at: string | null;
  last_login_at: string | null;
}

export interface PartnerInviteRow {
  id: string;
  email: string;
  role_slug: string;
  status: "pending" | "accepted" | "revoked" | "expired";
  expires_at: string;
  created_at: string;
}

export interface PartnerReferredProject {
  id: string;
  name: string;
  status: string;
  client_org_name: string;
  organization_id: string;
}

export interface PartnerReferredLead {
  id: string;
  contact_name: string;
  company_name: string | null;
  status: string;
  created_at: string;
}

export interface PartnerOrgFullDetail {
  org: PartnerOrgDetail;
  members: PartnerMemberRow[];
  invites: PartnerInviteRow[];
  projects: PartnerReferredProject[];
  leads: PartnerReferredLead[];
}

export async function getPartnerOrgDetail(
  partnerId: string,
): Promise<PartnerOrgFullDetail | null> {
  const supabase = await createClient();

  const { data: org } = await supabase
    .from("organizations")
    .select(
      "id, name, slug, region, status, billing_email, created_at, deleted_at, type",
    )
    .eq("id", partnerId)
    .maybeSingle();

  if (!org || (org as { type: string }).type !== "partner") return null;

  const [membersRes, invitesRes, projectsRes, leadsRes] = await Promise.all([
    supabase
      .from("org_members_view")
      .select(
        "membership_id, user_id, email, full_name, role_slug, role_name, status, accepted_at, last_login_at",
      )
      .eq("organization_id", partnerId)
      .order("status", { ascending: true }),
    supabase
      .from("invites")
      .select("id, email, role_slug, status, expires_at, created_at")
      .eq("organization_id", partnerId)
      .in("status", ["pending", "expired", "revoked"])
      .order("created_at", { ascending: false })
      .limit(50),
    supabase
      .from("projects")
      .select(
        "id, name, status, organization_id, client:organizations!projects_organization_id_fkey ( name )",
      )
      .eq("partner_org_id", partnerId)
      .is("deleted_at", null)
      .order("created_at", { ascending: false }),
    supabase
      .from("leads")
      .select("id, contact_name, company_name, status, created_at")
      .eq("metadata->>partner_org_id", partnerId)
      .order("created_at", { ascending: false })
      .limit(50),
  ]);

  type ProjRow = {
    id: string;
    name: string;
    status: string;
    organization_id: string;
    client: { name: string } | null;
  };

  return {
    org: {
      id: org.id,
      name: org.name,
      slug: org.slug,
      region: org.region,
      status: (org as { status: PartnerOrgDetail["status"] }).status,
      billing_email: (org as { billing_email: string | null }).billing_email,
      created_at: (org as { created_at: string }).created_at,
      deleted_at: (org as { deleted_at: string | null }).deleted_at,
    },
    members: (membersRes.data ?? []) as PartnerMemberRow[],
    invites: (invitesRes.data ?? []) as PartnerInviteRow[],
    projects: ((projectsRes.data ?? []) as unknown as ProjRow[]).map((p) => ({
      id: p.id,
      name: p.name,
      status: p.status,
      organization_id: p.organization_id,
      client_org_name: p.client?.name ?? "",
    })),
    leads: (leadsRes.data ?? []) as PartnerReferredLead[],
  };
}
