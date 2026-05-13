/**
 * Canonical role catalogue. Keep in sync with the `roles` table seeded in
 * migration 0003.
 */
export const INTERNAL_ROLES = [
  "super_admin",
  "founder_leadership",
  "operations_admin",
  "sales_admin",
  "client_success_manager",
  "deployment_manager",
  "support_agent",
  "data_engineer",
  "ai_ml_engineer",
  "compliance_manager",
  "finance_billing_admin",
  "cms_editor",
  "read_only_auditor",
] as const;

export const CLIENT_ROLES = [
  "client_owner",
  "executive_cfo",
  "site_director",
  "site_manager",
  "operations_manager",
  "maintenance_manager",
  "maintenance_engineer",
  "qa_compliance_officer",
  "energy_manager",
  "chef_brigade_lead",
  "operator",
  "finance_viewer",
  "it_admin",
  "read_only_auditor_client",
] as const;

export type InternalRoleSlug = (typeof INTERNAL_ROLES)[number];
export type ClientRoleSlug = (typeof CLIENT_ROLES)[number];
export type RoleSlug = InternalRoleSlug | ClientRoleSlug;

export function isInternalRole(slug: string): slug is InternalRoleSlug {
  return (INTERNAL_ROLES as readonly string[]).includes(slug);
}

export function isClientRole(slug: string): slug is ClientRoleSlug {
  return (CLIENT_ROLES as readonly string[]).includes(slug);
}
