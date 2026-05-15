import type { RoleSlug } from "@/lib/rbac/roles";

/**
 * Human-readable labels for role slugs. Keep in sync with the `roles`
 * table seeded in migration 0003.
 */
export const ROLE_LABELS: Record<RoleSlug, string> = {
  // internal
  super_admin: "Super Admin",
  founder_leadership: "Founder / Leadership",
  operations_admin: "Operations Admin",
  sales_admin: "Sales Admin",
  client_success_manager: "Client Success Manager",
  deployment_manager: "Deployment Manager",
  support_agent: "Support Agent",
  data_engineer: "Data Engineer",
  ai_ml_engineer: "AI/ML Engineer",
  compliance_manager: "Compliance Manager",
  finance_billing_admin: "Finance / Billing Admin",
  cms_editor: "CMS Editor",
  read_only_auditor: "Read-only Auditor",
  // client
  client_owner: "Client Owner",
  executive_cfo: "Executive / CFO",
  site_director: "Site Director",
  site_manager: "Site Manager",
  operations_manager: "Operations Manager",
  maintenance_manager: "Maintenance Manager",
  maintenance_engineer: "Maintenance Engineer",
  qa_compliance_officer: "QA / Compliance Officer",
  energy_manager: "Energy Manager",
  chef_brigade_lead: "Chef / Brigade Lead",
  operator: "Operator",
  finance_viewer: "Finance Viewer",
  it_admin: "IT Admin",
  read_only_auditor_client: "Read-only Auditor",
  // partner
  partner_owner: "Partner Owner",
  partner_user: "Partner User",
  partner_viewer: "Partner Viewer",
};
