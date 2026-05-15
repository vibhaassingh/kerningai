-- =============================================================================
-- Migration 0025 — Partner access: canvas remarks
-- =============================================================================
-- Adds the missing permission grant so partner organisations can leave
-- remarks on a referred client's workflow canvas.
--
-- Scope decisions (locked with the product owner, 2026-05-15):
--   * partner_owner + partner_user may comment; partner_viewer stays
--     strictly read-only.
--   * Partner remarks are ALWAYS written with visibility = 'partner_visible'
--     (partner + internal staff can see them; the client never does). That
--     constraint is enforced server-side in lib/partner/partner-canvas.ts —
--     this migration only opens the RBAC gate the action checks.
--   * "Full detail" partner viewing (a partner seeing every node + the
--     internal_notes of a project it referred) is performed in app code via
--     a service-role read gated by an explicit
--     app.is_member_of(project.partner_org_id) check + an audit-log entry.
--     It deliberately does NOT loosen the RLS policies from 0020 — partner
--     RLS on workflow_canvases still requires partner_visible/shared_all so
--     no broad widening of the security surface happens here.
-- =============================================================================

INSERT INTO public.role_permissions (role_slug, permission_slug) VALUES
  ('partner_owner', 'comment_on_workflow_canvas'),
  ('partner_user',  'comment_on_workflow_canvas')
ON CONFLICT DO NOTHING;
