-- =============================================================================
-- Migration 0019 — Support tickets
-- =============================================================================

CREATE TYPE public.ticket_severity AS ENUM ('p1','p2','p3','p4');
CREATE TYPE public.ticket_status   AS ENUM ('open','in_progress','waiting_on_client','closed');

CREATE TABLE public.support_tickets (
  id              uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id uuid NOT NULL REFERENCES public.organizations(id) ON DELETE CASCADE,
  site_id         uuid REFERENCES public.sites(id) ON DELETE SET NULL,
  module          text,
  severity        public.ticket_severity NOT NULL DEFAULT 'p3',
  status          public.ticket_status   NOT NULL DEFAULT 'open',
  title           text NOT NULL,
  description     text NOT NULL,
  reported_by_id  uuid REFERENCES public.app_users(id) ON DELETE SET NULL,
  assigned_to_id  uuid REFERENCES public.app_users(id) ON DELETE SET NULL,
  created_at      timestamptz NOT NULL DEFAULT now(),
  updated_at      timestamptz NOT NULL DEFAULT now(),
  closed_at       timestamptz,
  metadata        jsonb NOT NULL DEFAULT '{}'::jsonb
);

CREATE INDEX idx_tickets_org_status ON public.support_tickets (organization_id, status, created_at DESC);

CREATE TRIGGER trg_tickets_updated_at
  BEFORE UPDATE ON public.support_tickets
  FOR EACH ROW EXECUTE FUNCTION app.set_updated_at();

ALTER TABLE public.support_tickets ENABLE ROW LEVEL SECURITY;

CREATE POLICY "tickets_member_read" ON public.support_tickets
  FOR SELECT
  USING (app.is_member_of(organization_id) OR app.is_internal_staff() OR app.is_super_admin());

CREATE POLICY "tickets_member_write" ON public.support_tickets
  FOR INSERT
  WITH CHECK (
    app.is_member_of(organization_id)
    OR app.is_internal_staff()
    OR app.is_super_admin()
  );

CREATE POLICY "tickets_internal_update" ON public.support_tickets
  FOR UPDATE
  USING (
    app.is_internal_staff()
    OR app.is_super_admin()
    OR (app.is_member_of(organization_id) AND app.has_permission('manage_support_tickets', organization_id))
  );

-- ---------------------------------------------------------------------------
-- Comments
-- ---------------------------------------------------------------------------
CREATE TABLE public.ticket_comments (
  id              uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id uuid NOT NULL REFERENCES public.organizations(id) ON DELETE CASCADE,
  ticket_id       uuid NOT NULL REFERENCES public.support_tickets(id) ON DELETE CASCADE,
  author_id       uuid REFERENCES public.app_users(id) ON DELETE SET NULL,
  body            text NOT NULL,
  is_internal     boolean NOT NULL DEFAULT false,
  created_at      timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX idx_ticket_comments_ticket ON public.ticket_comments (ticket_id, created_at);

ALTER TABLE public.ticket_comments ENABLE ROW LEVEL SECURITY;

-- Internal-only comments are hidden from client members.
CREATE POLICY "comments_member_read" ON public.ticket_comments
  FOR SELECT
  USING (
    app.is_super_admin()
    OR app.is_internal_staff()
    OR (
      app.is_member_of(organization_id)
      AND is_internal = false
    )
  );

CREATE POLICY "comments_member_write" ON public.ticket_comments
  FOR INSERT
  WITH CHECK (
    app.is_super_admin()
    OR app.is_internal_staff()
    OR app.is_member_of(organization_id)
  );
