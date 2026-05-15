import "server-only";

import { createClient } from "@/lib/supabase/server";
import { getUserMemberships } from "@/lib/tenancy/current-org";

export interface PartnerLead {
  id: string;
  contact_name: string;
  company_name: string | null;
  status: string;
  source: string;
  created_at: string;
}

/**
 * Returns the (single) partner-org membership for the current user, or null
 * if they're not a partner. PartnerShell uses this to scope all queries.
 */
export async function getCurrentPartnerOrgId(): Promise<string | null> {
  const memberships = await getUserMemberships();
  const m = memberships.find((mb) => mb.organizationType === "partner");
  return m?.organizationId ?? null;
}

export async function listPartnerLeads(partnerOrgId: string): Promise<PartnerLead[]> {
  const supabase = await createClient();
  const { data } = await supabase
    .from("leads")
    .select("id, contact_name, company_name, status, source, created_at")
    .eq("metadata->>partner_org_id", partnerOrgId)
    .order("created_at", { ascending: false });
  return (data ?? []) as PartnerLead[];
}

export interface PartnerDashboardSummary {
  leadCount: number;
  projectCount: number;
  recentLeads: PartnerLead[];
}

export async function getPartnerDashboardSummary(
  partnerOrgId: string,
): Promise<PartnerDashboardSummary> {
  const supabase = await createClient();
  const [leads, projectCount] = await Promise.all([
    supabase
      .from("leads")
      .select("id, contact_name, company_name, status, source, created_at")
      .eq("metadata->>partner_org_id", partnerOrgId)
      .order("created_at", { ascending: false })
      .limit(5),
    supabase
      .from("projects")
      .select("id", { count: "exact", head: true })
      .eq("partner_org_id", partnerOrgId),
  ]);

  return {
    leadCount: leads.data?.length ?? 0,
    projectCount: projectCount.count ?? 0,
    recentLeads: (leads.data ?? []) as PartnerLead[],
  };
}
