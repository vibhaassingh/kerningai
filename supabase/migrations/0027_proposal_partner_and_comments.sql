-- =============================================================================
-- Migration 0027 — Proposal: referring-partner access + comments
-- =============================================================================
-- 1. The partner org that referred a project can read that project's
--    proposals (full, including the commercial schedule) once the
--    proposal has left internal review.
-- 2. A shared comment thread on each proposal so internal staff, the
--    client, and the referring partner can collaborate on it.
--
-- Reuses app.is_partner_for_project() from 0020. Writes go through the
-- service-role action wrappers; only SELECT policies are defined here.
-- =============================================================================

-- ---------------------------------------------------------------------------
-- 1. Extend the child-visibility helper to include the referring partner,
--    then add the parent partner-read policy. Updating app.proposal_visible
--    automatically opens phases / modules / scope / risks / commercials to
--    the partner (they all gate on this function).
-- ---------------------------------------------------------------------------
CREATE OR REPLACE FUNCTION app.proposal_visible(p_proposal_id uuid)
RETURNS boolean
LANGUAGE sql STABLE SECURITY DEFINER
SET search_path = public, app
AS $$
  SELECT EXISTS (
    SELECT 1
    FROM public.proposals p
    WHERE p.id = p_proposal_id
      AND (
        app.is_super_admin()
        OR app.is_internal_staff()
        OR app.has_permission_any('manage_proposals')
        OR (p.status IN ('sent','accepted','declined','expired')
            AND p.organization_id IS NOT NULL
            AND app.is_member_of(p.organization_id))
        OR (p.status IN ('sent','accepted','declined','expired')
            AND app.is_partner_for_project(p.project_id))
      )
  )
$$;

CREATE POLICY "proposals_partner_read" ON public.proposals
  FOR SELECT
  USING (
    status IN ('sent','accepted','declined','expired')
    AND app.is_partner_for_project(project_id)
  );

-- ---------------------------------------------------------------------------
-- 2. Proposal comments — one shared thread per proposal.
-- ---------------------------------------------------------------------------
CREATE TABLE public.proposal_comments (
  id            uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  proposal_id   uuid NOT NULL REFERENCES public.proposals(id) ON DELETE CASCADE,
  user_id       uuid NOT NULL REFERENCES public.app_users(id) ON DELETE CASCADE,
  body          text NOT NULL,
  created_at    timestamptz NOT NULL DEFAULT now(),
  updated_at    timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX idx_proposal_comments_proposal
  ON public.proposal_comments (proposal_id, created_at);

CREATE TRIGGER trg_proposal_comments_updated_at
  BEFORE UPDATE ON public.proposal_comments
  FOR EACH ROW EXECUTE FUNCTION app.set_updated_at();

ALTER TABLE public.proposal_comments ENABLE ROW LEVEL SECURITY;

-- Anyone who can see the proposal (internal staff, the client members,
-- or the referring partner) can read the thread.
CREATE POLICY "proposal_comments_read" ON public.proposal_comments
  FOR SELECT USING (app.proposal_visible(proposal_id));
