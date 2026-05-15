-- =============================================================================
-- Migration 0003 — Seed RBAC catalogue
-- =============================================================================
-- Inserts the canonical role + permission catalogue and the grant matrix.
-- Re-runnable: every INSERT uses ON CONFLICT DO NOTHING so re-applying does
-- not duplicate rows.
-- =============================================================================

-- ---------------------------------------------------------------------------
-- Internal roles (Kerning org)
-- ---------------------------------------------------------------------------
INSERT INTO public.roles (slug, name, description, scope, rank) VALUES
  ('super_admin',             'Super Admin',                 'All permissions, including security and impersonation.',     'internal', 100),
  ('founder_leadership',      'Founder / Leadership',         'Read-all, manage clients/leads/billing.',                    'internal', 90),
  ('operations_admin',        'Operations Admin',             'Manages clients, deployments, support.',                     'internal', 80),
  ('sales_admin',             'Sales Admin',                  'Manages leads, deals, proposals; reads clients.',            'internal', 70),
  ('client_success_manager',  'Client Success Manager',       'Manages assigned clients; reads all.',                       'internal', 70),
  ('deployment_manager',      'Deployment Manager',           'Manages deployments, sites, integrations.',                  'internal', 65),
  ('support_agent',           'Support Agent',                'Manages support tickets.',                                   'internal', 50),
  ('data_engineer',           'Data Engineer',                'Manages ontology, integrations, data jobs.',                 'internal', 60),
  ('ai_ml_engineer',          'AI/ML Engineer',               'Manages agents, prompts, evaluations.',                      'internal', 60),
  ('compliance_manager',      'Compliance Manager',           'Manages compliance frameworks; audit-log reads.',            'internal', 65),
  ('finance_billing_admin',   'Finance / Billing Admin',      'Manages contracts and billing.',                             'internal', 70),
  ('cms_editor',              'CMS Editor',                   'Manages public website content only.',                       'internal', 40),
  ('read_only_auditor',       'Read-only Auditor',            'Reads everything in audit scope; no writes.',                'internal', 30)
ON CONFLICT (slug) DO NOTHING;

-- ---------------------------------------------------------------------------
-- Client roles (per client org)
-- ---------------------------------------------------------------------------
INSERT INTO public.roles (slug, name, description, scope, rank) VALUES
  ('client_owner',                'Client Owner',                  'Manages client users, all modules, settings.',            'client', 100),
  ('executive_cfo',               'Executive / CFO',               'Reads all modules; finance reads.',                       'client', 90),
  ('site_director',               'Site Director',                 'Reads all sites; writes site management.',                'client', 80),
  ('site_manager',                'Site Manager',                  'Manages assigned site(s).',                               'client', 70),
  ('operations_manager',          'Operations Manager',            'Operates dashboards and agents within scope.',            'client', 65),
  ('maintenance_manager',         'Maintenance Manager',           'Manages work orders, asset registry.',                    'client', 65),
  ('maintenance_engineer',        'Maintenance Engineer',          'Operates work orders, logs events.',                      'client', 55),
  ('qa_compliance_officer',       'QA / Compliance Officer',       'Manages audits, evidence, corrective actions.',           'client', 60),
  ('energy_manager',              'Energy Manager',                'Manages energy module.',                                  'client', 60),
  ('chef_brigade_lead',           'Chef / Brigade Lead',           'Operates kitchen-side compliance + ops.',                 'client', 55),
  ('operator',                    'Operator',                      'Frontline: temp logs, checklists, incident reports.',     'client', 30),
  ('finance_viewer',              'Finance Viewer',                'Reads billing and invoices.',                             'client', 50),
  ('it_admin',                    'IT Admin',                      'Manages integrations, API keys, users.',                  'client', 75),
  ('read_only_auditor_client',    'Read-only Auditor',             'Reads everything client-scoped.',                         'client', 30)
ON CONFLICT (slug) DO NOTHING;

-- ---------------------------------------------------------------------------
-- Permissions
-- ---------------------------------------------------------------------------
INSERT INTO public.permissions (slug, name, category, description) VALUES
  -- dashboard
  ('view_dashboard',                 'View dashboard',                 'dashboard', 'See the high-level dashboard for the current scope.'),
  -- users & roles
  ('manage_users',                   'Manage users',                   'users',     'Invite, edit, suspend org members.'),
  ('manage_roles',                   'Manage roles',                   'users',     'Assign roles to members.'),
  ('manage_security_settings',       'Manage security settings',       'security',  'Change security-related org settings.'),
  ('manage_connected_accounts',      'Manage connected accounts',      'security',  'Link/unlink own OAuth providers.'),
  -- clients / sites
  ('view_clients',                   'View clients',                   'clients',   'Read the list of client organizations.'),
  ('manage_clients',                 'Manage clients',                 'clients',   'Create, edit, archive client organizations.'),
  ('manage_sites',                   'Manage sites',                   'sites',     'Create, edit, archive sites.'),
  ('manage_assets',                  'Manage assets',                  'sites',     'Manage asset registry.'),
  ('manage_sensors',                 'Manage sensors',                 'sites',     'Manage sensors and telemetry sources.'),
  ('view_telemetry',                 'View telemetry',                 'sites',     'Read sensor readings and live signals.'),
  -- CRM / sales
  ('view_leads',                     'View leads',                     'crm',       'Read sales lead inbox.'),
  ('manage_leads',                   'Manage leads',                   'crm',       'Edit, assign, convert leads.'),
  ('manage_deals',                   'Manage deals',                   'crm',       'Edit deals through pipeline stages.'),
  ('manage_proposals',               'Manage proposals',               'crm',       'Draft and send proposals.'),
  -- questionnaires / blueprints
  ('manage_questionnaires',          'Manage questionnaires',          'discovery', 'Create and edit questionnaire templates.'),
  ('review_questionnaire_submissions','Review submissions',            'discovery', 'Triage and respond to questionnaire submissions.'),
  ('approve_solution_blueprints',    'Approve blueprints',             'discovery', 'Approve a generated blueprint for client visibility.'),
  -- ontology
  ('manage_ontology',                'Manage ontology',                'ontology',  'Edit ontology schemas, entities, mappings.'),
  -- agents
  ('configure_agents',               'Configure agents',               'agents',    'Manage agent templates, tools, guardrails.'),
  ('run_agent_workflows',            'Run agent workflows',            'agents',    'Trigger agent runs within scope.'),
  ('approve_agent_actions',          'Approve agent actions',          'agents',    'Approve or reject agent recommendations.'),
  -- maintenance
  ('view_maintenance',               'View maintenance',               'maintenance','Read maintenance dashboards.'),
  ('manage_work_orders',             'Manage work orders',             'maintenance','Create, assign, close work orders.'),
  -- energy
  ('view_energy',                    'View energy',                    'energy',    'Read energy and emissions dashboards.'),
  ('manage_energy_settings',         'Manage energy settings',         'energy',    'Configure meters, tariffs, optimization rules.'),
  -- compliance
  ('view_compliance',                'View compliance',                'compliance','Read compliance dashboards.'),
  ('manage_audits',                  'Manage audits',                  'compliance','Configure audit checklists and runs.'),
  ('close_corrective_actions',       'Close corrective actions',       'compliance','Sign off on corrective actions.'),
  -- decision intelligence
  ('view_decision_intelligence',     'View decision intelligence',     'di',        'Read DI dashboards.'),
  ('view_financial_metrics',         'View financial metrics',         'di',        'Read P&L, margins, financial KPIs.'),
  -- reports / docs
  ('export_reports',                 'Export reports',                 'reports',   'Generate and export reports.'),
  ('manage_documents',               'Manage documents',               'documents', 'Upload, organize, share documents.'),
  -- support
  ('view_support',                   'View support',                   'support',   'Read support tickets.'),
  ('manage_support_tickets',         'Manage support tickets',         'support',   'Create, update, close support tickets.'),
  -- billing
  ('view_billing',                   'View billing',                   'billing',   'Read billing and invoices.'),
  ('manage_billing',                 'Manage billing',                 'billing',   'Edit contracts, subscriptions, invoices.'),
  -- integrations
  ('view_integrations',              'View integrations',              'integrations','Read integration status.'),
  ('configure_integrations',         'Configure integrations',         'integrations','Add, edit, remove integrations and API keys.'),
  -- CMS
  ('manage_cms',                     'Manage CMS',                     'cms',       'Create and publish website content.'),
  -- audit / system
  ('view_audit_logs',                'View audit logs',                'audit',     'Read the audit log explorer.'),
  ('view_system_health',             'View system health',             'system',    'Read the system health dashboard.'),
  ('manage_feature_flags',           'Manage feature flags',           'system',    'Toggle feature flags.'),
  -- impersonation
  ('impersonate_client_user',        'Impersonate client user',        'security',  'Step into a client user (audited).')
ON CONFLICT (slug) DO NOTHING;

-- ---------------------------------------------------------------------------
-- Grant matrix
-- ---------------------------------------------------------------------------

-- super_admin → everything
INSERT INTO public.role_permissions (role_slug, permission_slug)
SELECT 'super_admin', slug FROM public.permissions
ON CONFLICT DO NOTHING;

-- founder_leadership → read-all + manage clients/leads/billing (no security writes)
INSERT INTO public.role_permissions (role_slug, permission_slug) VALUES
  ('founder_leadership', 'view_dashboard'),
  ('founder_leadership', 'view_clients'),
  ('founder_leadership', 'manage_clients'),
  ('founder_leadership', 'view_leads'),
  ('founder_leadership', 'manage_leads'),
  ('founder_leadership', 'manage_deals'),
  ('founder_leadership', 'manage_proposals'),
  ('founder_leadership', 'view_billing'),
  ('founder_leadership', 'manage_billing'),
  ('founder_leadership', 'view_audit_logs'),
  ('founder_leadership', 'view_system_health'),
  ('founder_leadership', 'view_telemetry'),
  ('founder_leadership', 'view_maintenance'),
  ('founder_leadership', 'view_energy'),
  ('founder_leadership', 'view_compliance'),
  ('founder_leadership', 'view_decision_intelligence'),
  ('founder_leadership', 'view_financial_metrics'),
  ('founder_leadership', 'view_support'),
  ('founder_leadership', 'export_reports'),
  ('founder_leadership', 'manage_connected_accounts')
ON CONFLICT DO NOTHING;

-- operations_admin → clients, deployments, support
INSERT INTO public.role_permissions (role_slug, permission_slug) VALUES
  ('operations_admin', 'view_dashboard'),
  ('operations_admin', 'view_clients'),
  ('operations_admin', 'manage_clients'),
  ('operations_admin', 'manage_sites'),
  ('operations_admin', 'view_support'),
  ('operations_admin', 'manage_support_tickets'),
  ('operations_admin', 'view_audit_logs'),
  ('operations_admin', 'view_system_health'),
  ('operations_admin', 'manage_documents'),
  ('operations_admin', 'export_reports'),
  ('operations_admin', 'manage_connected_accounts')
ON CONFLICT DO NOTHING;

-- sales_admin → leads, deals, proposals; reads clients
INSERT INTO public.role_permissions (role_slug, permission_slug) VALUES
  ('sales_admin', 'view_dashboard'),
  ('sales_admin', 'view_clients'),
  ('sales_admin', 'view_leads'),
  ('sales_admin', 'manage_leads'),
  ('sales_admin', 'manage_deals'),
  ('sales_admin', 'manage_proposals'),
  ('sales_admin', 'manage_questionnaires'),
  ('sales_admin', 'review_questionnaire_submissions'),
  ('sales_admin', 'approve_solution_blueprints'),
  ('sales_admin', 'export_reports'),
  ('sales_admin', 'manage_connected_accounts')
ON CONFLICT DO NOTHING;

-- client_success_manager → reads all + manages assigned clients
INSERT INTO public.role_permissions (role_slug, permission_slug) VALUES
  ('client_success_manager', 'view_dashboard'),
  ('client_success_manager', 'view_clients'),
  ('client_success_manager', 'manage_clients'),
  ('client_success_manager', 'view_support'),
  ('client_success_manager', 'manage_support_tickets'),
  ('client_success_manager', 'view_maintenance'),
  ('client_success_manager', 'view_energy'),
  ('client_success_manager', 'view_compliance'),
  ('client_success_manager', 'view_decision_intelligence'),
  ('client_success_manager', 'view_audit_logs'),
  ('client_success_manager', 'export_reports'),
  ('client_success_manager', 'manage_documents'),
  ('client_success_manager', 'manage_connected_accounts')
ON CONFLICT DO NOTHING;

-- deployment_manager → deployments + sites + integrations
INSERT INTO public.role_permissions (role_slug, permission_slug) VALUES
  ('deployment_manager', 'view_dashboard'),
  ('deployment_manager', 'view_clients'),
  ('deployment_manager', 'manage_sites'),
  ('deployment_manager', 'manage_assets'),
  ('deployment_manager', 'manage_sensors'),
  ('deployment_manager', 'view_integrations'),
  ('deployment_manager', 'configure_integrations'),
  ('deployment_manager', 'view_system_health'),
  ('deployment_manager', 'manage_documents'),
  ('deployment_manager', 'manage_connected_accounts')
ON CONFLICT DO NOTHING;

-- support_agent → support tickets
INSERT INTO public.role_permissions (role_slug, permission_slug) VALUES
  ('support_agent', 'view_dashboard'),
  ('support_agent', 'view_clients'),
  ('support_agent', 'view_support'),
  ('support_agent', 'manage_support_tickets'),
  ('support_agent', 'manage_documents'),
  ('support_agent', 'manage_connected_accounts')
ON CONFLICT DO NOTHING;

-- data_engineer → ontology + integrations
INSERT INTO public.role_permissions (role_slug, permission_slug) VALUES
  ('data_engineer', 'view_dashboard'),
  ('data_engineer', 'manage_ontology'),
  ('data_engineer', 'manage_sensors'),
  ('data_engineer', 'view_integrations'),
  ('data_engineer', 'configure_integrations'),
  ('data_engineer', 'view_telemetry'),
  ('data_engineer', 'view_system_health'),
  ('data_engineer', 'manage_connected_accounts')
ON CONFLICT DO NOTHING;

-- ai_ml_engineer → agents + prompts
INSERT INTO public.role_permissions (role_slug, permission_slug) VALUES
  ('ai_ml_engineer', 'view_dashboard'),
  ('ai_ml_engineer', 'configure_agents'),
  ('ai_ml_engineer', 'run_agent_workflows'),
  ('ai_ml_engineer', 'approve_agent_actions'),
  ('ai_ml_engineer', 'manage_ontology'),
  ('ai_ml_engineer', 'view_telemetry'),
  ('ai_ml_engineer', 'manage_connected_accounts')
ON CONFLICT DO NOTHING;

-- compliance_manager → compliance + audit reads
INSERT INTO public.role_permissions (role_slug, permission_slug) VALUES
  ('compliance_manager', 'view_dashboard'),
  ('compliance_manager', 'view_compliance'),
  ('compliance_manager', 'manage_audits'),
  ('compliance_manager', 'close_corrective_actions'),
  ('compliance_manager', 'view_audit_logs'),
  ('compliance_manager', 'manage_documents'),
  ('compliance_manager', 'export_reports'),
  ('compliance_manager', 'manage_connected_accounts')
ON CONFLICT DO NOTHING;

-- finance_billing_admin → contracts + billing
INSERT INTO public.role_permissions (role_slug, permission_slug) VALUES
  ('finance_billing_admin', 'view_dashboard'),
  ('finance_billing_admin', 'view_clients'),
  ('finance_billing_admin', 'view_billing'),
  ('finance_billing_admin', 'manage_billing'),
  ('finance_billing_admin', 'view_financial_metrics'),
  ('finance_billing_admin', 'export_reports'),
  ('finance_billing_admin', 'manage_documents'),
  ('finance_billing_admin', 'manage_connected_accounts')
ON CONFLICT DO NOTHING;

-- cms_editor → CMS only
INSERT INTO public.role_permissions (role_slug, permission_slug) VALUES
  ('cms_editor', 'view_dashboard'),
  ('cms_editor', 'manage_cms'),
  ('cms_editor', 'manage_documents'),
  ('cms_editor', 'manage_connected_accounts')
ON CONFLICT DO NOTHING;

-- read_only_auditor → reads only
INSERT INTO public.role_permissions (role_slug, permission_slug) VALUES
  ('read_only_auditor', 'view_dashboard'),
  ('read_only_auditor', 'view_clients'),
  ('read_only_auditor', 'view_leads'),
  ('read_only_auditor', 'view_telemetry'),
  ('read_only_auditor', 'view_maintenance'),
  ('read_only_auditor', 'view_energy'),
  ('read_only_auditor', 'view_compliance'),
  ('read_only_auditor', 'view_decision_intelligence'),
  ('read_only_auditor', 'view_billing'),
  ('read_only_auditor', 'view_support'),
  ('read_only_auditor', 'view_audit_logs'),
  ('read_only_auditor', 'view_system_health'),
  ('read_only_auditor', 'view_integrations'),
  ('read_only_auditor', 'manage_connected_accounts')
ON CONFLICT DO NOTHING;

-- ---------------------------------------------------------------------------
-- CLIENT roles
-- ---------------------------------------------------------------------------

-- client_owner → everything within own client org
INSERT INTO public.role_permissions (role_slug, permission_slug) VALUES
  ('client_owner', 'view_dashboard'),
  ('client_owner', 'manage_users'),
  ('client_owner', 'manage_roles'),
  ('client_owner', 'manage_sites'),
  ('client_owner', 'manage_assets'),
  ('client_owner', 'manage_sensors'),
  ('client_owner', 'view_telemetry'),
  ('client_owner', 'view_maintenance'),
  ('client_owner', 'manage_work_orders'),
  ('client_owner', 'view_energy'),
  ('client_owner', 'manage_energy_settings'),
  ('client_owner', 'view_compliance'),
  ('client_owner', 'manage_audits'),
  ('client_owner', 'close_corrective_actions'),
  ('client_owner', 'view_decision_intelligence'),
  ('client_owner', 'view_financial_metrics'),
  ('client_owner', 'view_billing'),
  ('client_owner', 'manage_billing'),
  ('client_owner', 'view_integrations'),
  ('client_owner', 'configure_integrations'),
  ('client_owner', 'view_support'),
  ('client_owner', 'manage_support_tickets'),
  ('client_owner', 'configure_agents'),
  ('client_owner', 'run_agent_workflows'),
  ('client_owner', 'approve_agent_actions'),
  ('client_owner', 'export_reports'),
  ('client_owner', 'manage_documents'),
  ('client_owner', 'view_audit_logs'),
  ('client_owner', 'manage_security_settings'),
  ('client_owner', 'manage_connected_accounts')
ON CONFLICT DO NOTHING;

-- executive_cfo → broad reads + financial reads
INSERT INTO public.role_permissions (role_slug, permission_slug) VALUES
  ('executive_cfo', 'view_dashboard'),
  ('executive_cfo', 'view_telemetry'),
  ('executive_cfo', 'view_maintenance'),
  ('executive_cfo', 'view_energy'),
  ('executive_cfo', 'view_compliance'),
  ('executive_cfo', 'view_decision_intelligence'),
  ('executive_cfo', 'view_financial_metrics'),
  ('executive_cfo', 'view_billing'),
  ('executive_cfo', 'view_support'),
  ('executive_cfo', 'export_reports'),
  ('executive_cfo', 'manage_connected_accounts')
ON CONFLICT DO NOTHING;

-- site_director → all sites in client; site management writes
INSERT INTO public.role_permissions (role_slug, permission_slug) VALUES
  ('site_director', 'view_dashboard'),
  ('site_director', 'manage_sites'),
  ('site_director', 'manage_assets'),
  ('site_director', 'view_telemetry'),
  ('site_director', 'view_maintenance'),
  ('site_director', 'manage_work_orders'),
  ('site_director', 'view_energy'),
  ('site_director', 'view_compliance'),
  ('site_director', 'manage_audits'),
  ('site_director', 'view_decision_intelligence'),
  ('site_director', 'approve_agent_actions'),
  ('site_director', 'run_agent_workflows'),
  ('site_director', 'export_reports'),
  ('site_director', 'manage_documents'),
  ('site_director', 'manage_connected_accounts')
ON CONFLICT DO NOTHING;

-- site_manager → assigned site management
INSERT INTO public.role_permissions (role_slug, permission_slug) VALUES
  ('site_manager', 'view_dashboard'),
  ('site_manager', 'manage_assets'),
  ('site_manager', 'view_telemetry'),
  ('site_manager', 'view_maintenance'),
  ('site_manager', 'manage_work_orders'),
  ('site_manager', 'view_energy'),
  ('site_manager', 'view_compliance'),
  ('site_manager', 'manage_audits'),
  ('site_manager', 'close_corrective_actions'),
  ('site_manager', 'view_decision_intelligence'),
  ('site_manager', 'approve_agent_actions'),
  ('site_manager', 'run_agent_workflows'),
  ('site_manager', 'manage_documents'),
  ('site_manager', 'view_support'),
  ('site_manager', 'manage_support_tickets'),
  ('site_manager', 'export_reports'),
  ('site_manager', 'manage_connected_accounts')
ON CONFLICT DO NOTHING;

-- operations_manager
INSERT INTO public.role_permissions (role_slug, permission_slug) VALUES
  ('operations_manager', 'view_dashboard'),
  ('operations_manager', 'view_telemetry'),
  ('operations_manager', 'view_maintenance'),
  ('operations_manager', 'manage_work_orders'),
  ('operations_manager', 'view_energy'),
  ('operations_manager', 'view_compliance'),
  ('operations_manager', 'view_decision_intelligence'),
  ('operations_manager', 'run_agent_workflows'),
  ('operations_manager', 'approve_agent_actions'),
  ('operations_manager', 'export_reports'),
  ('operations_manager', 'manage_connected_accounts')
ON CONFLICT DO NOTHING;

-- maintenance_manager
INSERT INTO public.role_permissions (role_slug, permission_slug) VALUES
  ('maintenance_manager', 'view_dashboard'),
  ('maintenance_manager', 'manage_assets'),
  ('maintenance_manager', 'view_telemetry'),
  ('maintenance_manager', 'view_maintenance'),
  ('maintenance_manager', 'manage_work_orders'),
  ('maintenance_manager', 'approve_agent_actions'),
  ('maintenance_manager', 'export_reports'),
  ('maintenance_manager', 'manage_documents'),
  ('maintenance_manager', 'manage_connected_accounts')
ON CONFLICT DO NOTHING;

-- maintenance_engineer
INSERT INTO public.role_permissions (role_slug, permission_slug) VALUES
  ('maintenance_engineer', 'view_dashboard'),
  ('maintenance_engineer', 'view_telemetry'),
  ('maintenance_engineer', 'view_maintenance'),
  ('maintenance_engineer', 'manage_work_orders'),
  ('maintenance_engineer', 'manage_documents'),
  ('maintenance_engineer', 'manage_connected_accounts')
ON CONFLICT DO NOTHING;

-- qa_compliance_officer
INSERT INTO public.role_permissions (role_slug, permission_slug) VALUES
  ('qa_compliance_officer', 'view_dashboard'),
  ('qa_compliance_officer', 'view_compliance'),
  ('qa_compliance_officer', 'manage_audits'),
  ('qa_compliance_officer', 'close_corrective_actions'),
  ('qa_compliance_officer', 'export_reports'),
  ('qa_compliance_officer', 'manage_documents'),
  ('qa_compliance_officer', 'manage_connected_accounts')
ON CONFLICT DO NOTHING;

-- energy_manager
INSERT INTO public.role_permissions (role_slug, permission_slug) VALUES
  ('energy_manager', 'view_dashboard'),
  ('energy_manager', 'view_telemetry'),
  ('energy_manager', 'view_energy'),
  ('energy_manager', 'manage_energy_settings'),
  ('energy_manager', 'approve_agent_actions'),
  ('energy_manager', 'export_reports'),
  ('energy_manager', 'manage_documents'),
  ('energy_manager', 'manage_connected_accounts')
ON CONFLICT DO NOTHING;

-- chef_brigade_lead
INSERT INTO public.role_permissions (role_slug, permission_slug) VALUES
  ('chef_brigade_lead', 'view_dashboard'),
  ('chef_brigade_lead', 'view_telemetry'),
  ('chef_brigade_lead', 'view_compliance'),
  ('chef_brigade_lead', 'close_corrective_actions'),
  ('chef_brigade_lead', 'manage_work_orders'),
  ('chef_brigade_lead', 'manage_documents'),
  ('chef_brigade_lead', 'manage_connected_accounts')
ON CONFLICT DO NOTHING;

-- operator
INSERT INTO public.role_permissions (role_slug, permission_slug) VALUES
  ('operator', 'view_dashboard'),
  ('operator', 'view_telemetry'),
  ('operator', 'view_compliance'),
  ('operator', 'manage_connected_accounts')
ON CONFLICT DO NOTHING;

-- finance_viewer
INSERT INTO public.role_permissions (role_slug, permission_slug) VALUES
  ('finance_viewer', 'view_dashboard'),
  ('finance_viewer', 'view_billing'),
  ('finance_viewer', 'view_financial_metrics'),
  ('finance_viewer', 'export_reports'),
  ('finance_viewer', 'manage_connected_accounts')
ON CONFLICT DO NOTHING;

-- it_admin
INSERT INTO public.role_permissions (role_slug, permission_slug) VALUES
  ('it_admin', 'view_dashboard'),
  ('it_admin', 'manage_users'),
  ('it_admin', 'manage_roles'),
  ('it_admin', 'view_integrations'),
  ('it_admin', 'configure_integrations'),
  ('it_admin', 'view_system_health'),
  ('it_admin', 'view_audit_logs'),
  ('it_admin', 'manage_security_settings'),
  ('it_admin', 'manage_connected_accounts')
ON CONFLICT DO NOTHING;

-- read_only_auditor_client
INSERT INTO public.role_permissions (role_slug, permission_slug) VALUES
  ('read_only_auditor_client', 'view_dashboard'),
  ('read_only_auditor_client', 'view_telemetry'),
  ('read_only_auditor_client', 'view_maintenance'),
  ('read_only_auditor_client', 'view_energy'),
  ('read_only_auditor_client', 'view_compliance'),
  ('read_only_auditor_client', 'view_decision_intelligence'),
  ('read_only_auditor_client', 'view_billing'),
  ('read_only_auditor_client', 'view_support'),
  ('read_only_auditor_client', 'view_audit_logs'),
  ('read_only_auditor_client', 'manage_connected_accounts')
ON CONFLICT DO NOTHING;

-- ---------------------------------------------------------------------------
-- Default feature flags
-- ---------------------------------------------------------------------------
INSERT INTO public.feature_flags (slug, description, enabled_globally) VALUES
  ('blueprint_llm_enrichment', 'Use an LLM to enrich rule-based blueprints with executive summaries. Off by default.', false),
  ('client_self_signup',       'Allow client users to self-signup without invite. Off by default.',                       false),
  ('agent_actions_live',       'Allow agents to take real actions, not just recommend. Off by default in Phase 1.',       false),
  ('discovery_email_resume',   'Send anonymous prospects a single-use resume link by email.',                              true),
  ('cms_dual_mode',            'CMS coexists with code-based content registries. Code wins on slug collision.',           true)
ON CONFLICT (slug) DO NOTHING;
