# RBAC

27 roles · 44 permissions · grant matrix in `0003_seed_rbac.sql`.

## Internal roles (Kerning org)

`super_admin`, `founder_leadership`, `operations_admin`, `sales_admin`,
`client_success_manager`, `deployment_manager`, `support_agent`,
`data_engineer`, `ai_ml_engineer`, `compliance_manager`,
`finance_billing_admin`, `cms_editor`, `read_only_auditor`.

## Client roles (per client org)

`client_owner`, `executive_cfo`, `site_director`, `site_manager`,
`operations_manager`, `maintenance_manager`, `maintenance_engineer`,
`qa_compliance_officer`, `energy_manager`, `chef_brigade_lead`,
`operator`, `finance_viewer`, `it_admin`, `read_only_auditor_client`.

## Permission categories (44 total)

`dashboard`, `users`, `clients`, `sites`, `crm`, `discovery`, `ontology`,
`agents`, `maintenance`, `energy`, `compliance`, `di`, `reports`,
`documents`, `support`, `billing`, `integrations`, `cms`, `audit`,
`system`, `security`.

## Grant matrix highlights

| Role | Default key permissions |
|---|---|
| `super_admin` | every permission |
| `founder_leadership` | read-all + clients/leads/billing |
| `sales_admin` | leads, deals, proposals, questionnaires, blueprints |
| `client_owner` | every per-org permission within own org |
| `it_admin` (client) | manage_users, configure_integrations, manage_security_settings |
| `operator` (client) | view_dashboard, view_telemetry, view_compliance |

Full matrix: see migration `0003_seed_rbac.sql`.

## Adding a new permission

1. Append to `lib/rbac/permissions.ts` `PERMISSIONS` array.
2. Add an `INSERT` to `0003_seed_rbac.sql` (or a new
   `0NNN_seed_extra_perms.sql`).
3. Grant to the right roles via `INSERT INTO role_permissions ...`.
4. Use in a Server Action: `await requirePermission("new_slug", orgId)`.
5. Optionally guard UI with `<PermissionGate perm="new_slug">`.

## Adding a new role

Same idea — append to `lib/rbac/roles.ts` (`INTERNAL_ROLES` or
`CLIENT_ROLES`), add label to `lib/rbac/labels.ts`, insert into
`roles` + `role_permissions` via migration.

## Enforcement layers

```
Server Action call
  ↓
requirePermission(perm, orgId)         ← layer 1, server-side check
  ↓
INSERT/UPDATE attempted via Supabase
  ↓
RLS policy on the table                ← layer 2, DB-side backstop
  ↓
Audit log written via withAudit(...)
```

Layer 3 (UI gating) is convenience, not security. Hidden buttons are
not security.

## Internal-staff cross-org bypass

`requireOrg(orgId)` returns a synthetic membership for users with any
internal-org membership, even if they're not a member of `orgId`. This
lets `super_admin` and friends operate across client orgs by design.
Specific permissions are still enforced by `requirePermission`.

This bypass also surfaces in RLS via `app.is_internal_staff()`.
