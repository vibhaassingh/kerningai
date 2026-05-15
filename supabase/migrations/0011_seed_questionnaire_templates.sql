-- =============================================================================
-- Migration 0011 — Seed first two questionnaire templates
-- =============================================================================
-- Production-safe. Inserts two published templates fully fleshed out
-- (sections + questions + options). The remaining eight services
-- (ERP, CRM, Inventory, Predictive Maintenance, Energy, Compliance, DI,
-- IoT) ship as schema-only stubs in Phase 3b once the builder UI lands.
-- =============================================================================

-- ---------------------------------------------------------------------------
-- Helper DO block to insert a template + its sections + questions cleanly.
-- ---------------------------------------------------------------------------
DO $$
DECLARE
  v_template_id uuid;
  v_section_id  uuid;
  v_question_id uuid;
BEGIN

  -- ========================================================================
  -- TEMPLATE 1 — Custom AI Agent Workflow
  -- ========================================================================
  INSERT INTO public.questionnaire_templates (
    id, slug, service, name, description, version, status,
    estimated_minutes, intro_eyebrow, intro_heading, intro_body
  )
  VALUES (
    'aaaaaaaa-0001-0000-0000-000000000001',
    'custom-ai-agent',
    'custom_ai_agent',
    'Custom AI Agent Workflow',
    'Tell us where a human-approved AI agent could remove cognitive load — and we''ll come back with a blueprint.',
    1,
    'published',
    9,
    'Discovery',
    'Build a custom AI agent that fits your operations.',
    'Nine short sections. Most teams finish in under ten minutes. Save and resume any time.'
  )
  ON CONFLICT (slug, version) DO NOTHING
  RETURNING id INTO v_template_id;

  IF v_template_id IS NULL THEN
    SELECT id INTO v_template_id FROM public.questionnaire_templates
    WHERE slug = 'custom-ai-agent' AND version = 1;
  END IF;

  -- --- 01 / Context ------------------------------------------------------
  INSERT INTO public.questionnaire_sections (template_id, number, slug, title, description, position)
  VALUES (v_template_id, 1, 'context', '01 / Context', 'A quick read on you and where you operate.', 1)
  ON CONFLICT (template_id, slug) DO NOTHING
  RETURNING id INTO v_section_id;
  IF v_section_id IS NULL THEN SELECT id INTO v_section_id FROM public.questionnaire_sections WHERE template_id = v_template_id AND slug = 'context'; END IF;

  INSERT INTO public.questionnaire_questions (section_id, template_id, position, slug, kind, label, help, required)
  VALUES
    (v_section_id, v_template_id, 1, 'context.company', 'short_text', 'Company name', NULL, true),
    (v_section_id, v_template_id, 2, 'context.industry', 'single_select', 'Industry', 'Pick the closest fit.', true),
    (v_section_id, v_template_id, 3, 'context.role',    'short_text', 'Your role',  'How you describe your job.', true),
    (v_section_id, v_template_id, 4, 'context.locations','short_text', 'Where do you operate?', 'Cities, regions, sites. One line is fine.', false)
  ON CONFLICT (template_id, slug) DO NOTHING;

  -- Options for industry
  INSERT INTO public.questionnaire_options (question_id, value, label, position)
  SELECT id, v, l, p FROM (
    VALUES
      ('hospitality', 'Hospitality', 1),
      ('manufacturing', 'Manufacturing', 2),
      ('institutional', 'Institutional / F&B', 3),
      ('logistics', 'Logistics & supply chain', 4),
      ('retail', 'Retail', 5),
      ('other', 'Something else', 6)
  ) AS opt(v, l, p), public.questionnaire_questions q
  WHERE q.template_id = v_template_id AND q.slug = 'context.industry'
  ON CONFLICT (question_id, value) DO NOTHING;

  -- --- 02 / The job to be done -------------------------------------------
  INSERT INTO public.questionnaire_sections (template_id, number, slug, title, description, position)
  VALUES (v_template_id, 2, 'job', '02 / The job to be done', 'What should the agent take off your hands?', 2)
  ON CONFLICT (template_id, slug) DO NOTHING
  RETURNING id INTO v_section_id;
  IF v_section_id IS NULL THEN SELECT id INTO v_section_id FROM public.questionnaire_sections WHERE template_id = v_template_id AND slug = 'job'; END IF;

  INSERT INTO public.questionnaire_questions (section_id, template_id, position, slug, kind, label, help, required)
  VALUES
    (v_section_id, v_template_id, 1, 'job.purpose',   'multi_select', 'What should this agent do?', 'Pick all that fit.', true),
    (v_section_id, v_template_id, 2, 'job.example',   'long_text',    'Walk us through one concrete example', 'The kind of decision or report you''d hand to the agent.', true),
    (v_section_id, v_template_id, 3, 'job.frequency', 'single_select','How often does this happen?', NULL, true)
  ON CONFLICT (template_id, slug) DO NOTHING;

  INSERT INTO public.questionnaire_options (question_id, value, label, position)
  SELECT id, v, l, p FROM (
    VALUES
      ('monitoring',    'Monitoring + alerting',         1),
      ('triage',        'Triage incoming signals',        2),
      ('recommendation','Recommend a next step',         3),
      ('report_drafting','Draft reports for humans',     4),
      ('anomaly_explain','Explain an anomaly',           5),
      ('task_creation', 'Create / route tasks',          6),
      ('approvals',     'Pre-fill approvals',            7),
      ('forecasting',   'Short-horizon forecasting',     8)
  ) AS opt(v, l, p), public.questionnaire_questions q
  WHERE q.template_id = v_template_id AND q.slug = 'job.purpose'
  ON CONFLICT (question_id, value) DO NOTHING;

  INSERT INTO public.questionnaire_options (question_id, value, label, position)
  SELECT id, v, l, p FROM (
    VALUES
      ('hourly',     'Multiple times an hour',     1),
      ('daily',      'A few times a day',          2),
      ('weekly',     'A few times a week',          3),
      ('monthly',    'Monthly cycle',              4),
      ('ad_hoc',     'Ad hoc / event-driven',      5)
  ) AS opt(v, l, p), public.questionnaire_questions q
  WHERE q.template_id = v_template_id AND q.slug = 'job.frequency'
  ON CONFLICT (question_id, value) DO NOTHING;

  -- --- 03 / Guardrails ---------------------------------------------------
  INSERT INTO public.questionnaire_sections (template_id, number, slug, title, description, position)
  VALUES (v_template_id, 3, 'guardrails', '03 / Guardrails', 'Where the agent must stop and ask a human.', 3)
  ON CONFLICT (template_id, slug) DO NOTHING
  RETURNING id INTO v_section_id;
  IF v_section_id IS NULL THEN SELECT id INTO v_section_id FROM public.questionnaire_sections WHERE template_id = v_template_id AND slug = 'guardrails'; END IF;

  INSERT INTO public.questionnaire_questions (section_id, template_id, position, slug, kind, label, help, required)
  VALUES
    (v_section_id, v_template_id, 1, 'guardrails.prohibited', 'long_text', 'Actions the agent must never take',  NULL, false),
    (v_section_id, v_template_id, 2, 'guardrails.approval',   'long_text', 'Decisions that always need a named approver', NULL, true),
    (v_section_id, v_template_id, 3, 'guardrails.risk',       'single_select', 'Risk tolerance', NULL, true)
  ON CONFLICT (template_id, slug) DO NOTHING;

  INSERT INTO public.questionnaire_options (question_id, value, label, position)
  SELECT id, v, l, p FROM (
    VALUES
      ('low',    'Low — every recommendation reviewed',  1),
      ('medium', 'Medium — only consequential actions reviewed', 2),
      ('high',   'High — agent acts, humans audit after', 3)
  ) AS opt(v, l, p), public.questionnaire_questions q
  WHERE q.template_id = v_template_id AND q.slug = 'guardrails.risk'
  ON CONFLICT (question_id, value) DO NOTHING;

  -- --- 04 / Data & integrations -----------------------------------------
  INSERT INTO public.questionnaire_sections (template_id, number, slug, title, description, position)
  VALUES (v_template_id, 4, 'data', '04 / Data & integrations', 'Where the agent reads from and writes to.', 4)
  ON CONFLICT (template_id, slug) DO NOTHING
  RETURNING id INTO v_section_id;
  IF v_section_id IS NULL THEN SELECT id INTO v_section_id FROM public.questionnaire_sections WHERE template_id = v_template_id AND slug = 'data'; END IF;

  INSERT INTO public.questionnaire_questions (section_id, template_id, position, slug, kind, label, help, required)
  VALUES
    (v_section_id, v_template_id, 1, 'data.sources',      'multi_select', 'Where does the data live today?', 'Pick all that apply.', true),
    (v_section_id, v_template_id, 2, 'data.write_targets','long_text',    'Systems the agent should be able to write into', NULL, false),
    (v_section_id, v_template_id, 3, 'data.documents',    'long_text',    'Documents the agent should be able to read', 'SOPs, playbooks, prior reports, contracts.', false)
  ON CONFLICT (template_id, slug) DO NOTHING;

  INSERT INTO public.questionnaire_options (question_id, value, label, position)
  SELECT id, v, l, p FROM (
    VALUES
      ('erp',        'ERP',           1),
      ('crm',        'CRM',           2),
      ('pos',        'POS',           3),
      ('bms',        'BMS / HVAC',    4),
      ('iot',        'IoT sensors',   5),
      ('csv',        'CSV / Sheets',  6),
      ('email',      'Email inbox',   7),
      ('calendar',   'Calendar',      8),
      ('object_storage','Object storage', 9),
      ('other',      'Something else',10)
  ) AS opt(v, l, p), public.questionnaire_questions q
  WHERE q.template_id = v_template_id AND q.slug = 'data.sources'
  ON CONFLICT (question_id, value) DO NOTHING;

  -- --- 05 / Users & permissions -----------------------------------------
  INSERT INTO public.questionnaire_sections (template_id, number, slug, title, description, position)
  VALUES (v_template_id, 5, 'users', '05 / Users & permissions', 'Who interacts with the agent.', 5)
  ON CONFLICT (template_id, slug) DO NOTHING
  RETURNING id INTO v_section_id;
  IF v_section_id IS NULL THEN SELECT id INTO v_section_id FROM public.questionnaire_sections WHERE template_id = v_template_id AND slug = 'users'; END IF;

  INSERT INTO public.questionnaire_questions (section_id, template_id, position, slug, kind, label, help, required)
  VALUES
    (v_section_id, v_template_id, 1, 'users.count',     'number', 'Roughly how many users will see the agent?', NULL, true),
    (v_section_id, v_template_id, 2, 'users.approvers', 'long_text', 'Who acts as the named approver for consequential actions?', NULL, true),
    (v_section_id, v_template_id, 3, 'users.multilingual','boolean','Do you need multilingual operator surfaces?', NULL, false)
  ON CONFLICT (template_id, slug) DO NOTHING;

  -- --- 06 / Compliance & security ---------------------------------------
  INSERT INTO public.questionnaire_sections (template_id, number, slug, title, description, position)
  VALUES (v_template_id, 6, 'security', '06 / Compliance & security', 'Posture, residency, audit needs.', 6)
  ON CONFLICT (template_id, slug) DO NOTHING
  RETURNING id INTO v_section_id;
  IF v_section_id IS NULL THEN SELECT id INTO v_section_id FROM public.questionnaire_sections WHERE template_id = v_template_id AND slug = 'security'; END IF;

  INSERT INTO public.questionnaire_questions (section_id, template_id, position, slug, kind, label, help, required)
  VALUES
    (v_section_id, v_template_id, 1, 'security.sensitivity','single_select','Data sensitivity', NULL, true),
    (v_section_id, v_template_id, 2, 'security.audit',    'boolean','Do you need a full action ledger for every agent step?', NULL, false),
    (v_section_id, v_template_id, 3, 'security.residency','long_text','Any data-residency constraints?', NULL, false)
  ON CONFLICT (template_id, slug) DO NOTHING;

  INSERT INTO public.questionnaire_options (question_id, value, label, position)
  SELECT id, v, l, p FROM (
    VALUES
      ('public', 'Public / non-sensitive', 1),
      ('internal', 'Internal-only', 2),
      ('confidential', 'Confidential / commercial', 3),
      ('regulated', 'Regulated (PII / health / finance)', 4)
  ) AS opt(v, l, p), public.questionnaire_questions q
  WHERE q.template_id = v_template_id AND q.slug = 'security.sensitivity'
  ON CONFLICT (question_id, value) DO NOTHING;

  -- --- 07 / Deployment --------------------------------------------------
  INSERT INTO public.questionnaire_sections (template_id, number, slug, title, description, position)
  VALUES (v_template_id, 7, 'deployment', '07 / Deployment', 'Where this runs.', 7)
  ON CONFLICT (template_id, slug) DO NOTHING
  RETURNING id INTO v_section_id;
  IF v_section_id IS NULL THEN SELECT id INTO v_section_id FROM public.questionnaire_sections WHERE template_id = v_template_id AND slug = 'deployment'; END IF;

  INSERT INTO public.questionnaire_questions (section_id, template_id, position, slug, kind, label, help, required)
  VALUES
    (v_section_id, v_template_id, 1, 'deployment.preference','single_select','Preferred deployment', NULL, true),
    (v_section_id, v_template_id, 2, 'deployment.network',   'long_text','Any network restrictions or air-gapped sites?', NULL, false)
  ON CONFLICT (template_id, slug) DO NOTHING;

  INSERT INTO public.questionnaire_options (question_id, value, label, position)
  SELECT id, v, l, p FROM (
    VALUES
      ('cloud', 'Cloud (Kerning-hosted)', 1),
      ('sovereign_cloud', 'Sovereign cloud', 2),
      ('on_prem', 'On-prem', 3),
      ('air_gapped', 'Air-gapped', 4),
      ('not_sure', 'Not sure yet', 5)
  ) AS opt(v, l, p), public.questionnaire_questions q
  WHERE q.template_id = v_template_id AND q.slug = 'deployment.preference'
  ON CONFLICT (question_id, value) DO NOTHING;

  -- --- 08 / Timeline & budget -------------------------------------------
  INSERT INTO public.questionnaire_sections (template_id, number, slug, title, description, position)
  VALUES (v_template_id, 8, 'timeline', '08 / Timeline & budget', 'How fast, how much.', 8)
  ON CONFLICT (template_id, slug) DO NOTHING
  RETURNING id INTO v_section_id;
  IF v_section_id IS NULL THEN SELECT id INTO v_section_id FROM public.questionnaire_sections WHERE template_id = v_template_id AND slug = 'timeline'; END IF;

  INSERT INTO public.questionnaire_questions (section_id, template_id, position, slug, kind, label, help, required)
  VALUES
    (v_section_id, v_template_id, 1, 'timeline.target',  'single_select','When do you want this live?', NULL, true),
    (v_section_id, v_template_id, 2, 'timeline.budget',  'single_select','Rough budget band',           NULL, false),
    (v_section_id, v_template_id, 3, 'timeline.urgency', 'long_text','What''s driving the timeline?', NULL, false)
  ON CONFLICT (template_id, slug) DO NOTHING;

  INSERT INTO public.questionnaire_options (question_id, value, label, position)
  SELECT id, v, l, p FROM (
    VALUES
      ('within_quarter',   'This quarter',          1),
      ('within_two_quarters','Next two quarters',   2),
      ('within_year',      'Within a year',         3),
      ('exploratory',      'Exploratory — no fixed date', 4)
  ) AS opt(v, l, p), public.questionnaire_questions q
  WHERE q.template_id = v_template_id AND q.slug = 'timeline.target'
  ON CONFLICT (question_id, value) DO NOTHING;

  INSERT INTO public.questionnaire_options (question_id, value, label, position)
  SELECT id, v, l, p FROM (
    VALUES
      ('under_25k',  'Under €25k',    1),
      ('25k_75k',    '€25k – €75k',   2),
      ('75k_200k',   '€75k – €200k',  3),
      ('over_200k',  '€200k+',        4),
      ('tbd',        'Still scoping', 5)
  ) AS opt(v, l, p), public.questionnaire_questions q
  WHERE q.template_id = v_template_id AND q.slug = 'timeline.budget'
  ON CONFLICT (question_id, value) DO NOTHING;

  -- --- 09 / Success criteria --------------------------------------------
  INSERT INTO public.questionnaire_sections (template_id, number, slug, title, description, position)
  VALUES (v_template_id, 9, 'success', '09 / Success criteria', 'How we know this worked.', 9)
  ON CONFLICT (template_id, slug) DO NOTHING
  RETURNING id INTO v_section_id;
  IF v_section_id IS NULL THEN SELECT id INTO v_section_id FROM public.questionnaire_sections WHERE template_id = v_template_id AND slug = 'success'; END IF;

  INSERT INTO public.questionnaire_questions (section_id, template_id, position, slug, kind, label, help, required)
  VALUES
    (v_section_id, v_template_id, 1, 'success.metric',   'long_text','One number or signal you''d use to declare this a win', NULL, true),
    (v_section_id, v_template_id, 2, 'success.contact',  'short_text','Best email to reach you on', 'We''ll respond within two business days.', true),
    (v_section_id, v_template_id, 3, 'success.consent',  'boolean','Okay to receive a short follow-up about this submission?', NULL, true)
  ON CONFLICT (template_id, slug) DO NOTHING;

  -- ========================================================================
  -- TEMPLATE 2 — Operational Intelligence Platform
  -- ========================================================================
  -- Tighter shell: same 9 sections, slightly different questions oriented
  -- toward the full platform discovery rather than a single agent.
  -- ========================================================================
  INSERT INTO public.questionnaire_templates (
    id, slug, service, name, description, version, status,
    estimated_minutes, intro_eyebrow, intro_heading, intro_body
  )
  VALUES (
    'aaaaaaaa-0001-0000-0000-000000000002',
    'operational-intelligence',
    'operational_intelligence',
    'Operational Intelligence Platform',
    'A broader discovery for teams considering the full Kerning platform.',
    1,
    'published',
    12,
    'Discovery',
    'Stand up an operational intelligence platform for your floor.',
    'A wider scoping pass: sites, systems, signals, and the decisions you''d like to ground in data.'
  )
  ON CONFLICT (slug, version) DO NOTHING
  RETURNING id INTO v_template_id;
  IF v_template_id IS NULL THEN
    SELECT id INTO v_template_id FROM public.questionnaire_templates
    WHERE slug = 'operational-intelligence' AND version = 1;
  END IF;

  -- 01 / Context
  INSERT INTO public.questionnaire_sections (template_id, number, slug, title, description, position)
  VALUES (v_template_id, 1, 'context', '01 / Context', 'About your operation.', 1)
  ON CONFLICT (template_id, slug) DO NOTHING
  RETURNING id INTO v_section_id;
  IF v_section_id IS NULL THEN SELECT id INTO v_section_id FROM public.questionnaire_sections WHERE template_id = v_template_id AND slug = 'context'; END IF;
  INSERT INTO public.questionnaire_questions (section_id, template_id, position, slug, kind, label, required) VALUES
    (v_section_id, v_template_id, 1, 'ctx.company', 'short_text', 'Company name', true),
    (v_section_id, v_template_id, 2, 'ctx.sites', 'number', 'How many physical sites?', true),
    (v_section_id, v_template_id, 3, 'ctx.users', 'number', 'How many operators day-to-day?', false)
  ON CONFLICT (template_id, slug) DO NOTHING;

  -- 02 / Decisions to support
  INSERT INTO public.questionnaire_sections (template_id, number, slug, title, description, position)
  VALUES (v_template_id, 2, 'decisions', '02 / Decisions to support', 'What you''d like to ground in data.', 2)
  ON CONFLICT (template_id, slug) DO NOTHING
  RETURNING id INTO v_section_id;
  IF v_section_id IS NULL THEN SELECT id INTO v_section_id FROM public.questionnaire_sections WHERE template_id = v_template_id AND slug = 'decisions'; END IF;
  INSERT INTO public.questionnaire_questions (section_id, template_id, position, slug, kind, label, required) VALUES
    (v_section_id, v_template_id, 1, 'dec.primary',   'long_text', 'Top three decisions you wish were better-informed', true),
    (v_section_id, v_template_id, 2, 'dec.signals',   'multi_select', 'Signals you most want visibility into', true)
  ON CONFLICT (template_id, slug) DO NOTHING;

  INSERT INTO public.questionnaire_options (question_id, value, label, position)
  SELECT id, v, l, p FROM (
    VALUES
      ('maintenance', 'Maintenance + downtime', 1),
      ('energy',      'Energy + emissions',     2),
      ('compliance',  'Compliance + audits',    3),
      ('pnl',         'Plate / SKU / shift P&L',4),
      ('throughput',  'Throughput / OEE',       5),
      ('demand',      'Demand forecasting',     6)
  ) AS opt(v, l, p), public.questionnaire_questions q
  WHERE q.template_id = v_template_id AND q.slug = 'dec.signals'
  ON CONFLICT (question_id, value) DO NOTHING;

  -- 03 / Systems
  INSERT INTO public.questionnaire_sections (template_id, number, slug, title, description, position)
  VALUES (v_template_id, 3, 'systems', '03 / Current systems', 'What lives where.', 3)
  ON CONFLICT (template_id, slug) DO NOTHING
  RETURNING id INTO v_section_id;
  IF v_section_id IS NULL THEN SELECT id INTO v_section_id FROM public.questionnaire_sections WHERE template_id = v_template_id AND slug = 'systems'; END IF;
  INSERT INTO public.questionnaire_questions (section_id, template_id, position, slug, kind, label, required) VALUES
    (v_section_id, v_template_id, 1, 'sys.list', 'long_text', 'What systems run today? ERP, POS, BMS, sensors, anything bespoke.', true)
  ON CONFLICT (template_id, slug) DO NOTHING;

  -- 04 / Data & integrations
  INSERT INTO public.questionnaire_sections (template_id, number, slug, title, description, position)
  VALUES (v_template_id, 4, 'data', '04 / Data & integrations', 'Where the data already exists.', 4)
  ON CONFLICT (template_id, slug) DO NOTHING
  RETURNING id INTO v_section_id;
  IF v_section_id IS NULL THEN SELECT id INTO v_section_id FROM public.questionnaire_sections WHERE template_id = v_template_id AND slug = 'data'; END IF;
  INSERT INTO public.questionnaire_questions (section_id, template_id, position, slug, kind, label, required) VALUES
    (v_section_id, v_template_id, 1, 'data.sensors', 'boolean', 'Do you have IoT sensors on-site?', false),
    (v_section_id, v_template_id, 2, 'data.history', 'long_text', 'How much historical data is reachable, roughly?', false)
  ON CONFLICT (template_id, slug) DO NOTHING;

  -- 05–09 (lighter pass for v1 — Phase 3b expands these)
  INSERT INTO public.questionnaire_sections (template_id, number, slug, title, description, position)
  VALUES (v_template_id, 5, 'users', '05 / Users & permissions', 'Who needs which view.', 5)
  ON CONFLICT (template_id, slug) DO NOTHING
  RETURNING id INTO v_section_id;
  IF v_section_id IS NULL THEN SELECT id INTO v_section_id FROM public.questionnaire_sections WHERE template_id = v_template_id AND slug = 'users'; END IF;
  INSERT INTO public.questionnaire_questions (section_id, template_id, position, slug, kind, label, required) VALUES
    (v_section_id, v_template_id, 1, 'usr.audience', 'long_text', 'Who are the primary dashboard users?', true)
  ON CONFLICT (template_id, slug) DO NOTHING;

  INSERT INTO public.questionnaire_sections (template_id, number, slug, title, description, position)
  VALUES (v_template_id, 6, 'security', '06 / Compliance & security', 'Audit, residency, posture.', 6)
  ON CONFLICT (template_id, slug) DO NOTHING
  RETURNING id INTO v_section_id;
  IF v_section_id IS NULL THEN SELECT id INTO v_section_id FROM public.questionnaire_sections WHERE template_id = v_template_id AND slug = 'security'; END IF;
  INSERT INTO public.questionnaire_questions (section_id, template_id, position, slug, kind, label, required) VALUES
    (v_section_id, v_template_id, 1, 'sec.frameworks', 'long_text', 'Frameworks you need to meet (FSMS, ISO, GMP, etc.)', false)
  ON CONFLICT (template_id, slug) DO NOTHING;

  INSERT INTO public.questionnaire_sections (template_id, number, slug, title, description, position)
  VALUES (v_template_id, 7, 'deployment', '07 / Deployment', 'Where this lands.', 7)
  ON CONFLICT (template_id, slug) DO NOTHING
  RETURNING id INTO v_section_id;
  IF v_section_id IS NULL THEN SELECT id INTO v_section_id FROM public.questionnaire_sections WHERE template_id = v_template_id AND slug = 'deployment'; END IF;
  INSERT INTO public.questionnaire_questions (section_id, template_id, position, slug, kind, label, required) VALUES
    (v_section_id, v_template_id, 1, 'dep.preference', 'single_select', 'Preferred deployment', true)
  ON CONFLICT (template_id, slug) DO NOTHING;

  INSERT INTO public.questionnaire_options (question_id, value, label, position)
  SELECT id, v, l, p FROM (
    VALUES
      ('cloud', 'Cloud', 1),
      ('sovereign_cloud', 'Sovereign cloud', 2),
      ('on_prem', 'On-prem', 3),
      ('not_sure', 'Not sure yet', 4)
  ) AS opt(v, l, p), public.questionnaire_questions q
  WHERE q.template_id = v_template_id AND q.slug = 'dep.preference'
  ON CONFLICT (question_id, value) DO NOTHING;

  INSERT INTO public.questionnaire_sections (template_id, number, slug, title, description, position)
  VALUES (v_template_id, 8, 'timeline', '08 / Timeline & budget', 'When and how much.', 8)
  ON CONFLICT (template_id, slug) DO NOTHING
  RETURNING id INTO v_section_id;
  IF v_section_id IS NULL THEN SELECT id INTO v_section_id FROM public.questionnaire_sections WHERE template_id = v_template_id AND slug = 'timeline'; END IF;
  INSERT INTO public.questionnaire_questions (section_id, template_id, position, slug, kind, label, required) VALUES
    (v_section_id, v_template_id, 1, 'tl.target', 'single_select', 'When do you want this live?', true)
  ON CONFLICT (template_id, slug) DO NOTHING;

  INSERT INTO public.questionnaire_options (question_id, value, label, position)
  SELECT id, v, l, p FROM (
    VALUES
      ('within_quarter',   'This quarter',          1),
      ('within_year',      'Within a year',         2),
      ('exploratory',      'Exploratory',           3)
  ) AS opt(v, l, p), public.questionnaire_questions q
  WHERE q.template_id = v_template_id AND q.slug = 'tl.target'
  ON CONFLICT (question_id, value) DO NOTHING;

  INSERT INTO public.questionnaire_sections (template_id, number, slug, title, description, position)
  VALUES (v_template_id, 9, 'success', '09 / Success criteria', 'How we''ll know.', 9)
  ON CONFLICT (template_id, slug) DO NOTHING
  RETURNING id INTO v_section_id;
  IF v_section_id IS NULL THEN SELECT id INTO v_section_id FROM public.questionnaire_sections WHERE template_id = v_template_id AND slug = 'success'; END IF;
  INSERT INTO public.questionnaire_questions (section_id, template_id, position, slug, kind, label, required) VALUES
    (v_section_id, v_template_id, 1, 'suc.win', 'long_text', 'How would you describe a win?', true),
    (v_section_id, v_template_id, 2, 'suc.email', 'short_text', 'Best email to reach you on', true)
  ON CONFLICT (template_id, slug) DO NOTHING;

END $$;
