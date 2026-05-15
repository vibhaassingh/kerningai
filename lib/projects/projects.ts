import "server-only";

import { createClient } from "@/lib/supabase/server";

export type ProjectStatus =
  | "discovery"
  | "proposal"
  | "implementation"
  | "live"
  | "archived"
  | "on_hold";

export interface Project {
  id: string;
  organization_id: string;
  partner_org_id: string | null;
  partner_visible_to_client: boolean;
  blueprint_id: string | null;
  lead_id: string | null;
  name: string;
  slug: string;
  description: string | null;
  status: ProjectStatus;
  industry_label: string | null;
  business_label: string | null;
  badges: string[];
  created_by_id: string | null;
  updated_by_id: string | null;
  created_at: string;
  updated_at: string;
  metadata: Record<string, unknown>;
}

export interface ProjectWithPartner extends Project {
  partner_org_name: string | null;
  client_org_name: string;
}

const PROJECT_COLS = `
  id, organization_id, partner_org_id, partner_visible_to_client,
  blueprint_id, lead_id, name, slug, description, status,
  industry_label, business_label, badges,
  created_by_id, updated_by_id, created_at, updated_at, metadata
`;

export async function listProjectsForOrg(orgId: string): Promise<Project[]> {
  const supabase = await createClient();
  const { data } = await supabase
    .from("projects")
    .select(PROJECT_COLS)
    .eq("organization_id", orgId)
    .is("deleted_at", null)
    .order("created_at", { ascending: false });
  return (data ?? []) as Project[];
}

export async function listProjectsForPartner(partnerOrgId: string): Promise<ProjectWithPartner[]> {
  const supabase = await createClient();
  const { data } = await supabase
    .from("projects")
    .select(`${PROJECT_COLS}, client:organizations!projects_organization_id_fkey ( name )`)
    .eq("partner_org_id", partnerOrgId)
    .is("deleted_at", null)
    .order("created_at", { ascending: false });

  type Row = Project & { client: { name: string } | null };
  return ((data ?? []) as unknown as Row[]).map((p) => ({
    ...p,
    partner_org_name: null,
    client_org_name: p.client?.name ?? "",
  }));
}

export async function getProject(projectId: string): Promise<ProjectWithPartner | null> {
  const supabase = await createClient();
  const { data } = await supabase
    .from("projects")
    .select(`
      ${PROJECT_COLS},
      client:organizations!projects_organization_id_fkey ( name ),
      partner:organizations!projects_partner_org_id_fkey ( name )
    `)
    .eq("id", projectId)
    .maybeSingle();

  if (!data) return null;
  type Row = Project & {
    client: { name: string } | null;
    partner: { name: string } | null;
  };
  const row = data as unknown as Row;
  return {
    ...row,
    client_org_name: row.client?.name ?? "",
    partner_org_name: row.partner?.name ?? null,
  };
}
