-- =============================================================================
-- Migration 0010 — Discovery questionnaire engine schema
-- =============================================================================
-- Tables for the public + authenticated discovery flow:
--   * questionnaire_templates    — top-level service-keyed questionnaire
--   * questionnaire_sections     — numbered groupings (01–09 per template)
--   * questionnaire_questions    — atomic prompts within a section
--   * questionnaire_options      — picklist values for single/multi-select
--   * questionnaire_conditional_rules — show/hide rules between questions
--   * questionnaire_submissions  — one submission attempt by a prospect
--   * questionnaire_answers      — answer rows keyed by submission + question
--
-- RLS:
--   * Templates + sections + questions + options + rules are world-readable
--     for authenticated and anon users (the public flow needs them).
--     Writes restricted to manage_questionnaires permission.
--   * Submissions are visible to:
--       - the submitting session (resume token in cookie — handled by the
--         server action, not RLS; rows live behind service-role writes)
--       - internal staff with review_questionnaire_submissions permission
--     Anonymous public users CAN insert submissions and answers via the
--     service-role server actions (`startSubmission`, `saveAnswer`).
-- =============================================================================

-- ---------------------------------------------------------------------------
-- Templates
-- ---------------------------------------------------------------------------
CREATE TYPE public.questionnaire_template_status AS ENUM (
  'draft',
  'published',
  'archived'
);

CREATE TABLE public.questionnaire_templates (
  id              uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  slug            text NOT NULL,
  service         text NOT NULL,
  name            text NOT NULL,
  description     text,
  version         integer NOT NULL DEFAULT 1,
  status          public.questionnaire_template_status NOT NULL DEFAULT 'draft',
  estimated_minutes integer,
  intro_eyebrow   text,
  intro_heading   text,
  intro_body      text,
  created_at      timestamptz NOT NULL DEFAULT now(),
  updated_at      timestamptz NOT NULL DEFAULT now(),
  created_by_id   uuid REFERENCES public.app_users(id) ON DELETE SET NULL,
  metadata        jsonb NOT NULL DEFAULT '{}'::jsonb,
  UNIQUE (slug, version)
);

CREATE INDEX idx_questionnaire_templates_status ON public.questionnaire_templates (status);
CREATE INDEX idx_questionnaire_templates_slug ON public.questionnaire_templates (slug);

CREATE TRIGGER trg_questionnaire_templates_updated_at
  BEFORE UPDATE ON public.questionnaire_templates
  FOR EACH ROW EXECUTE FUNCTION app.set_updated_at();

-- ---------------------------------------------------------------------------
-- Sections — numbered 01..09 per template
-- ---------------------------------------------------------------------------
CREATE TABLE public.questionnaire_sections (
  id              uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  template_id     uuid NOT NULL REFERENCES public.questionnaire_templates(id) ON DELETE CASCADE,
  number          integer NOT NULL,
  slug            text NOT NULL,
  title           text NOT NULL,
  description     text,
  position        integer NOT NULL,
  metadata        jsonb NOT NULL DEFAULT '{}'::jsonb,
  UNIQUE (template_id, slug),
  UNIQUE (template_id, position)
);

CREATE INDEX idx_questionnaire_sections_template ON public.questionnaire_sections (template_id);

-- ---------------------------------------------------------------------------
-- Questions
-- ---------------------------------------------------------------------------
CREATE TYPE public.question_kind AS ENUM (
  'short_text',
  'long_text',
  'single_select',
  'multi_select',
  'boolean',
  'number',
  'currency',
  'date',
  'file',
  'site_count',
  'user_count',
  'integration_selector',
  'priority_ranking',
  'matrix',
  'repeating_group',
  'consent',
  'contact_details',
  'deployment_preference',
  'data_sensitivity',
  'budget_range',
  'timeline_expectation'
);

CREATE TABLE public.questionnaire_questions (
  id              uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  section_id      uuid NOT NULL REFERENCES public.questionnaire_sections(id) ON DELETE CASCADE,
  template_id     uuid NOT NULL REFERENCES public.questionnaire_templates(id) ON DELETE CASCADE,
  position        integer NOT NULL,
  slug            text NOT NULL,
  kind            public.question_kind NOT NULL,
  label           text NOT NULL,
  help            text,
  placeholder     text,
  required        boolean NOT NULL DEFAULT false,
  config          jsonb NOT NULL DEFAULT '{}'::jsonb,
  metadata        jsonb NOT NULL DEFAULT '{}'::jsonb,
  UNIQUE (template_id, slug)
);

CREATE INDEX idx_questionnaire_questions_section ON public.questionnaire_questions (section_id, position);
CREATE INDEX idx_questionnaire_questions_template ON public.questionnaire_questions (template_id);

-- ---------------------------------------------------------------------------
-- Options for single/multi-select questions
-- ---------------------------------------------------------------------------
CREATE TABLE public.questionnaire_options (
  id              uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  question_id     uuid NOT NULL REFERENCES public.questionnaire_questions(id) ON DELETE CASCADE,
  value           text NOT NULL,
  label           text NOT NULL,
  description     text,
  position        integer NOT NULL,
  UNIQUE (question_id, value)
);

CREATE INDEX idx_questionnaire_options_question ON public.questionnaire_options (question_id, position);

-- ---------------------------------------------------------------------------
-- Conditional rules — show target question when parent answer matches
-- ---------------------------------------------------------------------------
CREATE TABLE public.questionnaire_conditional_rules (
  id                  uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  template_id         uuid NOT NULL REFERENCES public.questionnaire_templates(id) ON DELETE CASCADE,
  parent_question_id  uuid NOT NULL REFERENCES public.questionnaire_questions(id) ON DELETE CASCADE,
  target_question_id  uuid NOT NULL REFERENCES public.questionnaire_questions(id) ON DELETE CASCADE,
  operator            text NOT NULL DEFAULT 'equals' CHECK (operator IN ('equals', 'not_equals', 'includes', 'excludes', 'truthy', 'falsy')),
  value               jsonb,
  effect              text NOT NULL DEFAULT 'show' CHECK (effect IN ('show', 'hide', 'require')),
  created_at          timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX idx_conditional_rules_template ON public.questionnaire_conditional_rules (template_id);
CREATE INDEX idx_conditional_rules_parent ON public.questionnaire_conditional_rules (parent_question_id);

-- ---------------------------------------------------------------------------
-- Submissions
-- ---------------------------------------------------------------------------
CREATE TYPE public.submission_status AS ENUM (
  'draft',
  'submitted',
  'reviewing',
  'discovery_scheduled',
  'proposal_drafting',
  'proposal_sent',
  'won',
  'lost',
  'archived'
);

CREATE TABLE public.questionnaire_submissions (
  id                uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  template_id       uuid NOT NULL REFERENCES public.questionnaire_templates(id) ON DELETE RESTRICT,
  template_version  integer NOT NULL,
  status            public.submission_status NOT NULL DEFAULT 'draft',
  resume_token_hash text UNIQUE,
  submitter_name    text,
  submitter_email   citext,
  submitter_company text,
  submitter_role    text,
  organization_id   uuid REFERENCES public.organizations(id) ON DELETE SET NULL,
  assigned_to_id    uuid REFERENCES public.app_users(id) ON DELETE SET NULL,
  lead_id           uuid REFERENCES public.leads(id) ON DELETE SET NULL,
  started_at        timestamptz NOT NULL DEFAULT now(),
  submitted_at      timestamptz,
  reviewed_at       timestamptz,
  raw_metadata      jsonb NOT NULL DEFAULT '{}'::jsonb,
  created_at        timestamptz NOT NULL DEFAULT now(),
  updated_at        timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX idx_submissions_template ON public.questionnaire_submissions (template_id);
CREATE INDEX idx_submissions_status ON public.questionnaire_submissions (status);
CREATE INDEX idx_submissions_submitter_email ON public.questionnaire_submissions (submitter_email);
CREATE INDEX idx_submissions_created_at ON public.questionnaire_submissions (created_at DESC);

CREATE TRIGGER trg_submissions_updated_at
  BEFORE UPDATE ON public.questionnaire_submissions
  FOR EACH ROW EXECUTE FUNCTION app.set_updated_at();

-- ---------------------------------------------------------------------------
-- Answers
-- ---------------------------------------------------------------------------
CREATE TABLE public.questionnaire_answers (
  id              uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  submission_id   uuid NOT NULL REFERENCES public.questionnaire_submissions(id) ON DELETE CASCADE,
  question_id     uuid NOT NULL REFERENCES public.questionnaire_questions(id) ON DELETE CASCADE,
  value           jsonb,
  answered_at     timestamptz NOT NULL DEFAULT now(),
  UNIQUE (submission_id, question_id)
);

CREATE INDEX idx_answers_submission ON public.questionnaire_answers (submission_id);

-- ---------------------------------------------------------------------------
-- RLS
-- ---------------------------------------------------------------------------

-- Templates + structure rows: world-readable (the public flow needs them),
-- super_admin / manage_questionnaires can write.
ALTER TABLE public.questionnaire_templates ENABLE ROW LEVEL SECURITY;
CREATE POLICY "templates_world_read" ON public.questionnaire_templates
  FOR SELECT USING (true);
CREATE POLICY "templates_admin_write" ON public.questionnaire_templates
  FOR ALL
  USING (app.is_super_admin() OR app.has_permission_any('manage_questionnaires'))
  WITH CHECK (app.is_super_admin() OR app.has_permission_any('manage_questionnaires'));

ALTER TABLE public.questionnaire_sections ENABLE ROW LEVEL SECURITY;
CREATE POLICY "sections_world_read" ON public.questionnaire_sections
  FOR SELECT USING (true);
CREATE POLICY "sections_admin_write" ON public.questionnaire_sections
  FOR ALL
  USING (app.is_super_admin() OR app.has_permission_any('manage_questionnaires'))
  WITH CHECK (app.is_super_admin() OR app.has_permission_any('manage_questionnaires'));

ALTER TABLE public.questionnaire_questions ENABLE ROW LEVEL SECURITY;
CREATE POLICY "questions_world_read" ON public.questionnaire_questions
  FOR SELECT USING (true);
CREATE POLICY "questions_admin_write" ON public.questionnaire_questions
  FOR ALL
  USING (app.is_super_admin() OR app.has_permission_any('manage_questionnaires'))
  WITH CHECK (app.is_super_admin() OR app.has_permission_any('manage_questionnaires'));

ALTER TABLE public.questionnaire_options ENABLE ROW LEVEL SECURITY;
CREATE POLICY "options_world_read" ON public.questionnaire_options
  FOR SELECT USING (true);
CREATE POLICY "options_admin_write" ON public.questionnaire_options
  FOR ALL
  USING (app.is_super_admin() OR app.has_permission_any('manage_questionnaires'))
  WITH CHECK (app.is_super_admin() OR app.has_permission_any('manage_questionnaires'));

ALTER TABLE public.questionnaire_conditional_rules ENABLE ROW LEVEL SECURITY;
CREATE POLICY "rules_world_read" ON public.questionnaire_conditional_rules
  FOR SELECT USING (true);
CREATE POLICY "rules_admin_write" ON public.questionnaire_conditional_rules
  FOR ALL
  USING (app.is_super_admin() OR app.has_permission_any('manage_questionnaires'))
  WITH CHECK (app.is_super_admin() OR app.has_permission_any('manage_questionnaires'));

-- Submissions + answers: internal staff with review permission see all.
-- Public flow writes via service role; no anon/authenticated INSERT policy
-- needed because the service-role bypass already covers it.
ALTER TABLE public.questionnaire_submissions ENABLE ROW LEVEL SECURITY;
CREATE POLICY "submissions_reviewer_read" ON public.questionnaire_submissions
  FOR SELECT
  USING (
    app.is_super_admin()
    OR app.has_permission_any('review_questionnaire_submissions')
    OR app.is_internal_staff()
  );

ALTER TABLE public.questionnaire_answers ENABLE ROW LEVEL SECURITY;
CREATE POLICY "answers_reviewer_read" ON public.questionnaire_answers
  FOR SELECT
  USING (
    app.is_super_admin()
    OR app.has_permission_any('review_questionnaire_submissions')
    OR app.is_internal_staff()
  );
