-- =============================================================================
-- Migration 0008 — Sales CRM: leads, deals, pipeline, contact submissions
-- =============================================================================
-- Models:
--   * pipeline_stages   — canonical stages, seeded with the user-spec list
--   * leads             — top of funnel
--   * lead_activities   — polymorphic activity stream
--   * deals             — qualified opportunities (later phase, schema only)
--   * contact_form_submissions — preserved raw form payload from /api/contact
--
-- Internal staff write/read everything. Client users don't touch any of
-- these tables. RLS reflects that.
-- =============================================================================

-- ---------------------------------------------------------------------------
-- Pipeline stages
-- ---------------------------------------------------------------------------
CREATE TABLE public.pipeline_stages (
  slug          text PRIMARY KEY,
  name          text NOT NULL,
  position      integer NOT NULL,
  is_won        boolean NOT NULL DEFAULT false,
  is_lost       boolean NOT NULL DEFAULT false,
  is_dormant    boolean NOT NULL DEFAULT false,
  created_at    timestamptz NOT NULL DEFAULT now()
);

INSERT INTO public.pipeline_stages (slug, name, position, is_won, is_lost, is_dormant) VALUES
  ('new',                  'New',                  10, false, false, false),
  ('qualified',            'Qualified',            20, false, false, false),
  ('discovery_scheduled',  'Discovery scheduled',  30, false, false, false),
  ('discovery_complete',   'Discovery complete',   40, false, false, false),
  ('proposal_drafting',    'Proposal drafting',    50, false, false, false),
  ('proposal_sent',        'Proposal sent',        60, false, false, false),
  ('negotiation',          'Negotiation',          70, false, false, false),
  ('won',                  'Won',                  80, true,  false, false),
  ('lost',                 'Lost',                 90, false, true,  false),
  ('dormant',              'Dormant',             100, false, false, true)
ON CONFLICT (slug) DO NOTHING;

ALTER TABLE public.pipeline_stages ENABLE ROW LEVEL SECURITY;
CREATE POLICY "pipeline_stages_authed_read" ON public.pipeline_stages
  FOR SELECT USING (app.current_user_id() IS NOT NULL);
CREATE POLICY "pipeline_stages_super_admin_write" ON public.pipeline_stages
  FOR ALL USING (app.is_super_admin()) WITH CHECK (app.is_super_admin());

-- ---------------------------------------------------------------------------
-- Lead source enum
-- ---------------------------------------------------------------------------
CREATE TYPE public.lead_source AS ENUM (
  'contact_form',
  'discovery_questionnaire',
  'referral',
  'inbound_email',
  'outbound',
  'partner',
  'event',
  'other'
);

-- ---------------------------------------------------------------------------
-- Leads — top of funnel
-- ---------------------------------------------------------------------------
CREATE TABLE public.leads (
  id                uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  source            public.lead_source NOT NULL DEFAULT 'other',
  status            text NOT NULL DEFAULT 'new'
                      REFERENCES public.pipeline_stages(slug)
                      DEFERRABLE INITIALLY DEFERRED,
  company_name      text,
  contact_name      text NOT NULL,
  contact_email     citext NOT NULL,
  contact_role      text,
  interested_in     text[] NOT NULL DEFAULT ARRAY[]::text[],
  intent_summary    text,
  score             integer CHECK (score IS NULL OR (score >= 0 AND score <= 100)),
  owner_id          uuid REFERENCES public.app_users(id) ON DELETE SET NULL,
  client_id         uuid REFERENCES public.organizations(id) ON DELETE SET NULL,
  submission_id     uuid,
  raw_payload       jsonb NOT NULL DEFAULT '{}'::jsonb,
  created_at        timestamptz NOT NULL DEFAULT now(),
  updated_at        timestamptz NOT NULL DEFAULT now(),
  deleted_at        timestamptz,
  created_by_id     uuid REFERENCES public.app_users(id) ON DELETE SET NULL,
  updated_by_id     uuid REFERENCES public.app_users(id) ON DELETE SET NULL,
  metadata          jsonb NOT NULL DEFAULT '{}'::jsonb
);

CREATE INDEX idx_leads_status ON public.leads (status);
CREATE INDEX idx_leads_owner ON public.leads (owner_id);
CREATE INDEX idx_leads_email ON public.leads (contact_email);
CREATE INDEX idx_leads_created_at ON public.leads (created_at DESC);

ALTER TABLE public.leads ENABLE ROW LEVEL SECURITY;

-- Internal staff read + write all leads.
CREATE POLICY "leads_internal_read" ON public.leads
  FOR SELECT USING (app.is_internal_staff() OR app.is_super_admin());
CREATE POLICY "leads_internal_write" ON public.leads
  FOR ALL
  USING (app.is_internal_staff() OR app.is_super_admin())
  WITH CHECK (app.is_internal_staff() OR app.is_super_admin());

-- ---------------------------------------------------------------------------
-- Lead activities — generic activity stream (note, status_change, email, etc.)
-- ---------------------------------------------------------------------------
CREATE TYPE public.lead_activity_kind AS ENUM (
  'note',
  'status_change',
  'owner_change',
  'email_sent',
  'email_received',
  'meeting',
  'task',
  'converted'
);

CREATE TABLE public.lead_activities (
  id            uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  lead_id       uuid NOT NULL REFERENCES public.leads(id) ON DELETE CASCADE,
  kind          public.lead_activity_kind NOT NULL,
  actor_id      uuid REFERENCES public.app_users(id) ON DELETE SET NULL,
  body          text,
  payload       jsonb NOT NULL DEFAULT '{}'::jsonb,
  created_at    timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX idx_lead_activities_lead ON public.lead_activities (lead_id);
CREATE INDEX idx_lead_activities_created_at ON public.lead_activities (created_at DESC);

ALTER TABLE public.lead_activities ENABLE ROW LEVEL SECURITY;
CREATE POLICY "lead_activities_internal_read" ON public.lead_activities
  FOR SELECT USING (app.is_internal_staff() OR app.is_super_admin());
CREATE POLICY "lead_activities_internal_write" ON public.lead_activities
  FOR ALL
  USING (app.is_internal_staff() OR app.is_super_admin())
  WITH CHECK (app.is_internal_staff() OR app.is_super_admin());

-- ---------------------------------------------------------------------------
-- Deals — qualified opportunities. Schema only for Phase 2c; full
-- pipeline-board UI ships in Phase 2d.
-- ---------------------------------------------------------------------------
CREATE TABLE public.deals (
  id              uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  lead_id         uuid REFERENCES public.leads(id) ON DELETE SET NULL,
  client_id       uuid REFERENCES public.organizations(id) ON DELETE SET NULL,
  stage_slug      text NOT NULL DEFAULT 'qualified'
                    REFERENCES public.pipeline_stages(slug)
                    DEFERRABLE INITIALLY DEFERRED,
  title           text NOT NULL,
  value_cents     bigint NOT NULL DEFAULT 0,
  currency        text NOT NULL DEFAULT 'EUR',
  close_target    date,
  owner_id        uuid REFERENCES public.app_users(id) ON DELETE SET NULL,
  notes           text,
  created_at      timestamptz NOT NULL DEFAULT now(),
  updated_at      timestamptz NOT NULL DEFAULT now(),
  metadata        jsonb NOT NULL DEFAULT '{}'::jsonb
);

CREATE INDEX idx_deals_stage ON public.deals (stage_slug);
CREATE INDEX idx_deals_owner ON public.deals (owner_id);
CREATE INDEX idx_deals_client ON public.deals (client_id);

ALTER TABLE public.deals ENABLE ROW LEVEL SECURITY;
CREATE POLICY "deals_internal_read" ON public.deals
  FOR SELECT USING (app.is_internal_staff() OR app.is_super_admin());
CREATE POLICY "deals_internal_write" ON public.deals
  FOR ALL
  USING (app.is_internal_staff() OR app.is_super_admin())
  WITH CHECK (app.is_internal_staff() OR app.is_super_admin());

-- ---------------------------------------------------------------------------
-- Contact form submissions — raw payload preserved separately from leads
-- so we can audit what the prospect submitted before any processing.
-- ---------------------------------------------------------------------------
CREATE TABLE public.contact_form_submissions (
  id              uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  lead_id         uuid REFERENCES public.leads(id) ON DELETE SET NULL,
  contact_name    text NOT NULL,
  contact_email   citext NOT NULL,
  company         text,
  role            text,
  message         text,
  raw_payload     jsonb NOT NULL DEFAULT '{}'::jsonb,
  ip              inet,
  user_agent      text,
  delivered_via   text NOT NULL DEFAULT 'resend',
  created_at      timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX idx_contact_form_email ON public.contact_form_submissions (contact_email);
CREATE INDEX idx_contact_form_created_at ON public.contact_form_submissions (created_at DESC);

ALTER TABLE public.contact_form_submissions ENABLE ROW LEVEL SECURITY;
CREATE POLICY "contact_form_internal_read" ON public.contact_form_submissions
  FOR SELECT USING (app.is_internal_staff() OR app.is_super_admin());
-- Writes happen via service role from the /api/contact route handler.

-- ---------------------------------------------------------------------------
-- updated_at trigger coverage for new tables
-- ---------------------------------------------------------------------------
CREATE TRIGGER trg_leads_updated_at
  BEFORE UPDATE ON public.leads
  FOR EACH ROW EXECUTE FUNCTION app.set_updated_at();

CREATE TRIGGER trg_deals_updated_at
  BEFORE UPDATE ON public.deals
  FOR EACH ROW EXECUTE FUNCTION app.set_updated_at();
