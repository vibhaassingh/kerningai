-- =============================================================================
-- Migration 0028 — RLS-supporting performance indexes
-- =============================================================================
-- Additive only (CREATE INDEX IF NOT EXISTS). No policy or behaviour
-- change. Targets the hottest RLS path: organization_memberships is
-- read by every authenticated request and by app.is_member_of /
-- app.is_internal_staff / app.is_partner_for_project /
-- app.has_permission_any / getUserMemberships. The existing single-column
-- indexes (user_id), (organization_id), (status) don't serve the
-- "active membership for this user (+org/role)" lookup well; these
-- partial composites do.
-- =============================================================================

-- getUserMemberships(): user_id = $me AND status = 'active', selecting
-- organization_id + role_slug (+ site_ids). Also serves has_permission_any
-- (join on user_id + status='active' + role_slug).
CREATE INDEX IF NOT EXISTS idx_memberships_active_user_org_role
  ON public.organization_memberships (user_id, organization_id, role_slug)
  WHERE status = 'active';

-- app.is_member_of(org) / app.is_partner_for_project(): "is the current
-- user an active member of THIS org" — org-first probe.
CREATE INDEX IF NOT EXISTS idx_memberships_active_org_user
  ON public.organization_memberships (organization_id, user_id)
  WHERE status = 'active';

-- Compliance / corrective-action reads filter by org + status and order
-- by created_at; the existing idx is only (organization_id, status).
CREATE INDEX IF NOT EXISTS idx_corrective_org_status_created
  ON public.corrective_actions (organization_id, status, created_at DESC);
