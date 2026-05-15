/**
 * Canonical permission catalogue. Keep this union in sync with the
 * `permissions` table seeded in migration 0003.
 *
 * The runtime check is `has_permission(slug, org_id)` in Postgres; this
 * type is purely for developer ergonomics.
 */
export const PERMISSIONS = [
  // dashboard
  "view_dashboard",
  // users & roles
  "manage_users",
  "manage_roles",
  "manage_security_settings",
  "manage_connected_accounts",
  // clients & sites
  "view_clients",
  "manage_clients",
  "manage_sites",
  "manage_assets",
  "manage_sensors",
  "view_telemetry",
  // CRM
  "view_leads",
  "manage_leads",
  "manage_deals",
  "manage_proposals",
  // discovery
  "manage_questionnaires",
  "review_questionnaire_submissions",
  "approve_solution_blueprints",
  // ontology
  "manage_ontology",
  // agents
  "configure_agents",
  "run_agent_workflows",
  "approve_agent_actions",
  // maintenance
  "view_maintenance",
  "manage_work_orders",
  // energy
  "view_energy",
  "manage_energy_settings",
  // compliance
  "view_compliance",
  "manage_audits",
  "close_corrective_actions",
  // decision intelligence
  "view_decision_intelligence",
  "view_financial_metrics",
  // reports / docs
  "export_reports",
  "manage_documents",
  // support
  "view_support",
  "manage_support_tickets",
  // billing
  "view_billing",
  "manage_billing",
  // integrations
  "view_integrations",
  "configure_integrations",
  // CMS
  "manage_cms",
  // audit / system
  "view_audit_logs",
  "view_system_health",
  "manage_feature_flags",
  // impersonation
  "impersonate_client_user",
  // projects
  "view_projects",
  "manage_projects",
  // workflow canvas
  "view_workflow_canvas",
  "manage_workflow_canvas",
  "share_workflow_canvas",
  "manage_workflow_versions",
  "comment_on_workflow_canvas",
  // partner portal
  "view_partner_dashboard",
  "submit_partner_lead",
  "view_partner_projects",
  "view_partner_workflow_summary",
] as const;

export type PermissionSlug = (typeof PERMISSIONS)[number];

export function isPermission(value: string): value is PermissionSlug {
  return (PERMISSIONS as readonly string[]).includes(value);
}
