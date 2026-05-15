-- =============================================================================
-- supabase/seed.sql — Local development seed data
-- =============================================================================
-- This file runs ONLY during `supabase db reset` on a local Supabase
-- instance. It is NEVER pushed to staging or production.
--
-- It seeds:
--   * 3 example client organizations (Meridian, Northline, CivicCare)
--   * 3 sites per client
--   * 10 example users (4 Kerning staff + 6 client users), all with the
--     local dev password "KerningSeed!2026" (bcrypt-hashed inline)
--   * Memberships connecting users to orgs with the right roles
--
-- After `supabase db reset`, you can sign in at http://localhost:3000/login
-- as any of the seeded users with the password above.
-- =============================================================================

-- ---------------------------------------------------------------------------
-- 3 client organizations
-- ---------------------------------------------------------------------------
INSERT INTO public.organizations (id, name, slug, type, region, billing_email, metadata) VALUES
  ('11111111-1111-1111-1111-111111110001'::uuid, 'Meridian Hospitality Group',     'meridian',   'client', 'eu-west-1',     'finance@meridian.example.com',  '{"industry": "hospitality"}'::jsonb),
  ('11111111-1111-1111-1111-111111110002'::uuid, 'Northline Components Plant',     'northline',  'client', 'eu-central-1',  'finance@northline.example.com', '{"industry": "manufacturing"}'::jsonb),
  ('11111111-1111-1111-1111-111111110003'::uuid, 'CivicCare Institutional Dining', 'civiccare',  'client', 'ap-south-1',    'finance@civiccare.example.com', '{"industry": "institutional"}'::jsonb)
ON CONFLICT (id) DO NOTHING;

-- client_settings
INSERT INTO public.client_settings (organization_id, industry, deployment_type, modules_enabled, health_score, mrr_cents, renewal_date) VALUES
  ('11111111-1111-1111-1111-111111110001'::uuid, 'hospitality',    'cloud',           ARRAY['predictive_maintenance','energy','compliance','decision_intelligence'],         88, 1200000, '2027-04-01'),
  ('11111111-1111-1111-1111-111111110002'::uuid, 'manufacturing',  'sovereign_cloud', ARRAY['operational_ontology','predictive_maintenance','energy','decision_intelligence'], 76, 2800000, '2026-11-15'),
  ('11111111-1111-1111-1111-111111110003'::uuid, 'institutional',  'on_prem',         ARRAY['compliance','energy','agentic_workflows','operational_ontology'],               82, 1800000, '2027-02-20')
ON CONFLICT (organization_id) DO NOTHING;

-- ---------------------------------------------------------------------------
-- Sites (3 per client)
-- ---------------------------------------------------------------------------
INSERT INTO public.sites (id, organization_id, name, slug, region, timezone, deployment_type, address, status) VALUES
  -- Meridian
  ('22222222-2222-2222-2222-222222220101'::uuid, '11111111-1111-1111-1111-111111110001'::uuid, 'Hotel Kitchen 01',     'hotel-kitchen-01',     'eu-west-1',     'Europe/Amsterdam', 'cloud', '{"city":"Amsterdam","country":"NL"}'::jsonb, 'active'),
  ('22222222-2222-2222-2222-222222220102'::uuid, '11111111-1111-1111-1111-111111110001'::uuid, 'Central Commissary',   'central-commissary',   'eu-west-1',     'Europe/Amsterdam', 'cloud', '{"city":"Amsterdam","country":"NL"}'::jsonb, 'active'),
  ('22222222-2222-2222-2222-222222220103'::uuid, '11111111-1111-1111-1111-111111110001'::uuid, 'Rooftop Venue',        'rooftop-venue',        'eu-west-1',     'Europe/Amsterdam', 'cloud', '{"city":"Amsterdam","country":"NL"}'::jsonb, 'active'),
  -- Northline
  ('22222222-2222-2222-2222-222222220201'::uuid, '11111111-1111-1111-1111-111111110002'::uuid, 'Plant 04',             'plant-04',             'eu-central-1',  'Europe/Berlin',    'sovereign_cloud', '{"city":"Stuttgart","country":"DE"}'::jsonb, 'active'),
  ('22222222-2222-2222-2222-222222220202'::uuid, '11111111-1111-1111-1111-111111110002'::uuid, 'Line 2',               'line-2',               'eu-central-1',  'Europe/Berlin',    'sovereign_cloud', '{"city":"Stuttgart","country":"DE"}'::jsonb, 'active'),
  ('22222222-2222-2222-2222-222222220203'::uuid, '11111111-1111-1111-1111-111111110002'::uuid, 'Packaging Cell',       'packaging-cell',       'eu-central-1',  'Europe/Berlin',    'sovereign_cloud', '{"city":"Stuttgart","country":"DE"}'::jsonb, 'active'),
  -- CivicCare
  ('22222222-2222-2222-2222-222222220301'::uuid, '11111111-1111-1111-1111-111111110003'::uuid, 'Campus Kitchen',       'campus-kitchen',       'ap-south-1',    'Asia/Kolkata',     'on_prem',  '{"city":"Bengaluru","country":"IN"}'::jsonb, 'active'),
  ('22222222-2222-2222-2222-222222220302'::uuid, '11111111-1111-1111-1111-111111110003'::uuid, 'Hospital Kitchen',     'hospital-kitchen',     'ap-south-1',    'Asia/Kolkata',     'on_prem',  '{"city":"Bengaluru","country":"IN"}'::jsonb, 'active'),
  ('22222222-2222-2222-2222-222222220303'::uuid, '11111111-1111-1111-1111-111111110003'::uuid, 'Cold Storage',         'cold-storage',         'ap-south-1',    'Asia/Kolkata',     'on_prem',  '{"city":"Bengaluru","country":"IN"}'::jsonb, 'active')
ON CONFLICT (id) DO NOTHING;

-- ---------------------------------------------------------------------------
-- Seed users
--
-- Password for every seed user: KerningSeed!2026
-- Hash generated via: SELECT crypt('KerningSeed!2026', gen_salt('bf', 10));
-- (Computed at apply-time so the hash is deterministic per-database.)
-- ---------------------------------------------------------------------------
DO $$
DECLARE
  v_password_hash text;
  v_user record;
BEGIN
  v_password_hash := crypt('KerningSeed!2026', gen_salt('bf', 10));

  -- Iterate over the seed user list. We insert into auth.users only if the
  -- email doesn't already exist; the on_auth_user_created trigger mirrors
  -- the row into app_users automatically.
  FOR v_user IN
    SELECT *
    FROM (VALUES
      ('aaaaaaaa-aaaa-aaaa-aaaa-aaaa00000001'::uuid, 'super.admin@kerning.ooo',                    'Kerning Super Admin',         'super_admin',              '00000000-0000-0000-0000-000000000001'::uuid),
      ('aaaaaaaa-aaaa-aaaa-aaaa-aaaa00000002'::uuid, 'sales.admin@kerning.ooo',                    'Kerning Sales Admin',         'sales_admin',              '00000000-0000-0000-0000-000000000001'::uuid),
      ('aaaaaaaa-aaaa-aaaa-aaaa-aaaa00000003'::uuid, 'success.manager@kerning.ooo',                'Kerning Client Success',      'client_success_manager',   '00000000-0000-0000-0000-000000000001'::uuid),
      ('aaaaaaaa-aaaa-aaaa-aaaa-aaaa00000004'::uuid, 'data.engineer@kerning.ooo',                  'Kerning Data Engineer',       'data_engineer',            '00000000-0000-0000-0000-000000000001'::uuid),
      ('bbbbbbbb-bbbb-bbbb-bbbb-bbbb00000001'::uuid, 'owner@meridian.example.com',                 'Maya Lindgren',               'client_owner',             '11111111-1111-1111-1111-111111110001'::uuid),
      ('bbbbbbbb-bbbb-bbbb-bbbb-bbbb00000002'::uuid, 'manager.kitchen01@meridian.example.com',     'Anders Holm',                 'site_manager',             '11111111-1111-1111-1111-111111110001'::uuid),
      ('bbbbbbbb-bbbb-bbbb-bbbb-bbbb00000003'::uuid, 'cfo@meridian.example.com',                   'Priya Subramanian',           'executive_cfo',            '11111111-1111-1111-1111-111111110001'::uuid),
      ('cccccccc-cccc-cccc-cccc-cccc00000001'::uuid, 'maintenance@northline.example.com',          'Jonas Bekker',                'maintenance_engineer',     '11111111-1111-1111-1111-111111110002'::uuid),
      ('cccccccc-cccc-cccc-cccc-cccc00000002'::uuid, 'operator@northline.example.com',             'Leo Marais',                  'operator',                 '11111111-1111-1111-1111-111111110002'::uuid),
      ('dddddddd-dddd-dddd-dddd-dddd00000001'::uuid, 'qa@civiccare.example.com',                   'Aditi Rao',                   'qa_compliance_officer',    '11111111-1111-1111-1111-111111110003'::uuid),
      -- Saurabh Arora (client) — Refined Oil Distribution / C&F Operations
      ('eeeeeeee-eeee-eeee-eeee-eeee00000001'::uuid, 'owner@saurabh-arora.example.com',            'Saurabh Arora',               'client_owner',             '22222222-2222-2222-2222-222222220002'::uuid),
      ('eeeeeeee-eeee-eeee-eeee-eeee00000002'::uuid, 'cfo@saurabh-arora.example.com',              'Rohan Mehra',                 'executive_cfo',            '22222222-2222-2222-2222-222222220002'::uuid),
      -- Avinash Group (partner referral)
      ('ffffffff-ffff-ffff-ffff-ffff00000001'::uuid, 'owner@avinash.example.com',                  'Avinash Sharma',              'partner_owner',            '22222222-2222-2222-2222-222222220001'::uuid)
    ) AS t(id, email, full_name, role_slug, org_id)
  LOOP
    -- Insert auth.users (skip if email already exists)
    -- GoTrue's scanner needs every nullable string column to be the empty
    -- string, not NULL — otherwise password sign-in throws a 500.
    INSERT INTO auth.users (
      instance_id, id, aud, role,
      email, encrypted_password,
      email_confirmed_at, raw_app_meta_data, raw_user_meta_data,
      created_at, updated_at, last_sign_in_at,
      confirmation_token, email_change, email_change_token_new,
      email_change_token_current, recovery_token,
      phone_change, phone_change_token, reauthentication_token,
      is_sso_user, is_anonymous,
      email_change_confirm_status
    ) VALUES (
      '00000000-0000-0000-0000-000000000000'::uuid,
      v_user.id,
      'authenticated',
      'authenticated',
      v_user.email,
      v_password_hash,
      now(),
      json_build_object('provider', 'email', 'providers', json_build_array('email'))::jsonb,
      json_build_object('full_name', v_user.full_name)::jsonb,
      now(), now(), now(),
      '', '', '',
      '', '',
      '', '', '',
      false, false,
      0
    )
    ON CONFLICT (id) DO NOTHING;

    -- Ensure app_users row exists (the auth trigger should do this, but
    -- be explicit since the trigger only fires on INSERT, not on conflict).
    INSERT INTO public.app_users (id, email, full_name, default_org_id)
    VALUES (v_user.id, v_user.email, v_user.full_name, v_user.org_id)
    ON CONFLICT (id) DO UPDATE
      SET full_name = EXCLUDED.full_name,
          default_org_id = EXCLUDED.default_org_id;

    -- Active membership in the appropriate org
    INSERT INTO public.organization_memberships (
      user_id, organization_id, role_slug, status, accepted_at
    ) VALUES (
      v_user.id, v_user.org_id, v_user.role_slug, 'active', now()
    )
    ON CONFLICT (user_id, organization_id) DO UPDATE
      SET role_slug = EXCLUDED.role_slug,
          status = 'active',
          accepted_at = COALESCE(public.organization_memberships.accepted_at, now());
  END LOOP;
END $$;

-- ---------------------------------------------------------------------------
-- Operational demo seed — assets, equipment health, agent recommendations
-- ---------------------------------------------------------------------------
DO $$
DECLARE
  v_meridian uuid := '11111111-1111-1111-1111-111111110001';
  v_northline uuid := '11111111-1111-1111-1111-111111110002';
  v_civiccare uuid := '11111111-1111-1111-1111-111111110003';

  v_hotel_kitchen uuid := '22222222-2222-2222-2222-222222220101';
  v_commissary    uuid := '22222222-2222-2222-2222-222222220102';
  v_plant04       uuid := '22222222-2222-2222-2222-222222220201';
  v_line2         uuid := '22222222-2222-2222-2222-222222220202';
  v_campus        uuid := '22222222-2222-2222-2222-222222220301';
  v_hospital      uuid := '22222222-2222-2222-2222-222222220302';
  v_cold_storage  uuid := '22222222-2222-2222-2222-222222220303';
BEGIN

  INSERT INTO public.assets (id, organization_id, site_id, name, asset_code, kind, status, manufacturer, model) VALUES
    ('33333333-3333-3333-3333-333333330001', v_meridian, v_hotel_kitchen, 'Combi oven #07',         'CO-007',  'combi_oven',         'watch',    'Rational',   'iCombi Pro 20-1/1'),
    ('33333333-3333-3333-3333-333333330002', v_meridian, v_commissary,    'Compressor cluster A',   'CC-A',    'compressor',         'at_risk',  'Bitzer',     '4CES-9Y'),
    ('33333333-3333-3333-3333-333333330003', v_meridian, v_hotel_kitchen, 'Hood motor — line 2',    'HM-L2',   'hood_motor',         'healthy',  'Halton',     'KSA-2.5'),
    ('33333333-3333-3333-3333-333333330011', v_northline, v_plant04,      'HVAC Zone 7',            'HVAC-Z7', 'hvac',               'watch',    'Daikin',     'VRV IV S'),
    ('33333333-3333-3333-3333-333333330012', v_northline, v_line2,        'Bearing rig — Line 2',   'BR-L2',   'bearing_rig',        'at_risk',  'SKF',        'SYJ 75 TF'),
    ('33333333-3333-3333-3333-333333330013', v_northline, v_plant04,      'Robotic cell #03',       'RC-03',   'robotic_cell',       'healthy',  'ABB',        'IRB 6700'),
    ('33333333-3333-3333-3333-333333330021', v_civiccare, v_campus,       'Cold room A',            'CR-A',    'cold_room',          'watch',    'Carrier',    'AquaSnap 30RB'),
    ('33333333-3333-3333-3333-333333330022', v_civiccare, v_hospital,     'Refrigeration rack 2',   'RR-02',   'refrigeration_rack', 'at_risk',  'Hussmann',   'PROTOCOL'),
    ('33333333-3333-3333-3333-333333330023', v_civiccare, v_cold_storage, 'Utility meter — main',   'UM-MAIN', 'utility_meter',      'healthy',  'Schneider',  'PowerLogic ION9000')
  ON CONFLICT (id) DO NOTHING;

  INSERT INTO public.equipment_health_scores (organization_id, asset_id, score, confidence, band, reason, forecast_event, forecast_days) VALUES
    (v_meridian,  '33333333-3333-3333-3333-333333330001', 72, 0.82, 'watch',    'Vibration delta on the fan motor up 7% MTD',                       'Bearing replacement',  21),
    (v_meridian,  '33333333-3333-3333-3333-333333330002', 41, 0.91, 'at_risk',  'Discharge temperature drift + amperage volatility',                'Compressor failure',   19),
    (v_meridian,  '33333333-3333-3333-3333-333333330003', 88, 0.74, 'healthy',  'Within baseline',                                                   NULL,                   NULL),
    (v_northline, '33333333-3333-3333-3333-333333330011', 67, 0.79, 'watch',    'Setpoint exceeded during tariff peak — efficiency drop 12%',       'HVAC optimization',    NULL),
    (v_northline, '33333333-3333-3333-3333-333333330012', 38, 0.94, 'at_risk',  'Vibration drift on bearing — high-frequency band rising',          'Bearing replacement',  14),
    (v_northline, '33333333-3333-3333-3333-333333330013', 91, 0.66, 'healthy',  'Within baseline; minor accuracy drift in z-axis',                  NULL,                   NULL),
    (v_civiccare, '33333333-3333-3333-3333-333333330021', 64, 0.88, 'watch',    'Cold room A temperature trailing setpoint during 14:00 shift',     'Cold-chain breach',    7),
    (v_civiccare, '33333333-3333-3333-3333-333333330022', 33, 0.93, 'at_risk',  'Compressor 2 short-cycling; discharge temp rising',                'Refrigeration failure',10),
    (v_civiccare, '33333333-3333-3333-3333-333333330023', 95, 0.71, 'healthy',  'Within baseline',                                                   NULL,                   NULL)
  ON CONFLICT DO NOTHING;

  INSERT INTO public.agent_runs (id, organization_id, template_slug, started_at, finished_at, status) VALUES
    ('44444444-4444-4444-4444-444444440001', v_meridian,  'maintenance_forecast', now() - interval '2 hours', now() - interval '2 hours' + interval '40 seconds', 'succeeded'),
    ('44444444-4444-4444-4444-444444440003', v_meridian,  'energy_optimization',  now() - interval '40 minutes', now() - interval '40 minutes' + interval '8 seconds', 'succeeded'),
    ('44444444-4444-4444-4444-444444440011', v_northline, 'maintenance_forecast', now() - interval '3 hours', now() - interval '3 hours' + interval '52 seconds', 'succeeded'),
    ('44444444-4444-4444-4444-444444440012', v_northline, 'energy_optimization',  now() - interval '30 minutes', now() - interval '30 minutes' + interval '14 seconds', 'succeeded'),
    ('44444444-4444-4444-4444-444444440021', v_civiccare, 'compliance_variance',  now() - interval '1 hour', now() - interval '1 hour' + interval '15 seconds', 'succeeded'),
    ('44444444-4444-4444-4444-444444440022', v_civiccare, 'cold_chain_monitor',   now() - interval '50 minutes', now() - interval '50 minutes' + interval '11 seconds', 'succeeded')
  ON CONFLICT (id) DO NOTHING;

  INSERT INTO public.agent_recommendations
    (id, organization_id, site_id, asset_id, run_id, template_slug, title, summary, reasoning, risk_level, confidence, expected_impact, evidence, proposed_action, status, expires_at)
  VALUES
    ('55555555-5555-5555-5555-555555550001',
     v_meridian, v_commissary, '33333333-3333-3333-3333-333333330002', '44444444-4444-4444-4444-444444440001',
     'maintenance_forecast',
     'Compressor cluster A likely failure in 19 days',
     'Discharge temperature has drifted 7°C above baseline over the last 14 days, paired with amperage volatility that fits the prior failure pattern from Q3 2025.',
     'Anomaly score 0.91 against the cluster-A baseline; same drift signature preceded the May 2025 compressor swap by 17 days.',
     'requires_approval', 0.91,
     'Avoid an estimated 22h unplanned downtime + €1,800 spoilage if scheduled now.',
     '[{"label":"Discharge temp drift","value":"+7°C MTD"},{"label":"Amperage sigma","value":"2.3x baseline"},{"label":"Prior similar event","value":"May 2025"}]'::jsonb,
     'Schedule a compressor swap for Saturday 04:00 maintenance window. Order spare today.',
     'pending', now() + interval '7 days'),

    ('55555555-5555-5555-5555-555555550002',
     v_meridian, v_hotel_kitchen, '33333333-3333-3333-3333-333333330001', '44444444-4444-4444-4444-444444440001',
     'maintenance_forecast',
     'Combi oven #07 fan motor needs attention',
     'Vibration delta on the fan motor is up 7% month-to-date. Still within tolerance, but trending toward intervention.',
     'Vibration high-band rising 0.06 mm/s per week; tolerance breach predicted in 21 days at current rate.',
     'operational', 0.82,
     'Pre-emptive 2h service vs. ~6h breakdown.',
     '[{"label":"Vibration delta","value":"+7% MTD"},{"label":"Time to breach","value":"~21 days"}]'::jsonb,
     'Book a 2h preventative service in the next maintenance window.',
     'pending', now() + interval '14 days'),

    ('55555555-5555-5555-5555-555555550003',
     v_meridian, v_commissary, NULL, '44444444-4444-4444-4444-444444440003',
     'energy_optimization',
     'Refrigeration setpoint can be raised 0.8C during tariff peak',
     'Tariff window 17:00-20:00 is 2.4x the day-rate. Cold-room A holds 1.6C below FSMS target with current load.',
     'Forecasted ambient + occupancy match the model that supported a similar peak-shave in Aug 2025 without HACCP impact.',
     'requires_approval', 0.84,
     '420 euro/month savings; HACCP envelope preserved.',
     '[{"label":"Peak tariff","value":"0.42/kWh"},{"label":"Day tariff","value":"0.17/kWh"}]'::jsonb,
     'Raise cold-room A setpoint by 0.8C during 17:00-20:00. Auto-revert at 20:00.',
     'pending', now() + interval '24 hours'),

    ('55555555-5555-5555-5555-555555550011',
     v_northline, v_line2, '33333333-3333-3333-3333-333333330012', '44444444-4444-4444-4444-444444440011',
     'maintenance_forecast',
     'Bearing rig — Line 2 vibration drift above baseline',
     'High-frequency vibration band has risen for 9 consecutive days. Confidence is high that this is the same envelope that preceded the December 2024 bearing failure.',
     'Spectral peak at 187 Hz growing 3.1% per day; envelope detection 0.94.',
     'critical_approval', 0.94,
     'Avoid an estimated 36h line stoppage + 12k euro of WIP rework.',
     '[{"label":"Drift band","value":"187 Hz"},{"label":"Growth","value":"+3.1%/day"},{"label":"Prior failure","value":"Dec 2024"}]'::jsonb,
     'Shut down Line 2 at next changeover and replace bearing assembly. Total ~5h.',
     'pending', now() + interval '7 days'),

    ('55555555-5555-5555-5555-555555550012',
     v_northline, v_plant04, '33333333-3333-3333-3333-333333330011', '44444444-4444-4444-4444-444444440012',
     'energy_optimization',
     'HVAC Zone 7 setpoint reducible during tariff peak',
     'Occupancy data shows Zone 7 averages 0.3 person/sqm during 17:00-19:00. Current setpoint is 0.8C tighter than required.',
     'Comfort model 0.79 confidence. Identical adjustment held without complaints in Zone 4 since March.',
     'requires_approval', 0.79,
     '12.4% energy reduction during peak; no impact on operations.',
     '[{"label":"Peak savings est.","value":"12.4%"},{"label":"Zone 4 precedent","value":"3 months, 0 complaints"}]'::jsonb,
     'Raise Zone 7 setpoint by 0.8C during 17:00-19:00 daily.',
     'pending', now() + interval '5 days'),

    ('55555555-5555-5555-5555-555555550021',
     v_civiccare, v_campus, '33333333-3333-3333-3333-333333330021', '44444444-4444-4444-4444-444444440022',
     'cold_chain_monitor',
     'Cold room A — 14:00 temperature log missing',
     'No reading captured for the 14:00 shift on cold room A. FSMS protocol requires manual sign-off.',
     'Operator did not check in. Door-open event count consistent with normal operation.',
     'operational', 0.99,
     'Stay compliant with the campus FSMS audit due Friday.',
     '[{"label":"Missing log","value":"14:00 shift today"},{"label":"Last reading","value":"-0.4C @ 10:00"}]'::jsonb,
     'Notify QA officer to record manual reading + capture sign-off in the audit checklist.',
     'pending', now() + interval '12 hours'),

    ('55555555-5555-5555-5555-555555550022',
     v_civiccare, v_hospital, '33333333-3333-3333-3333-333333330022', '44444444-4444-4444-4444-444444440022',
     'cold_chain_monitor',
     'Refrigeration rack 2 short-cycling',
     'Compressor 2 has short-cycled 14 times in the last 6 hours. Suction superheat rising.',
     'Cycling pattern + superheat signature matches an upcoming refrigerant charge event.',
     'requires_approval', 0.86,
     'Avoid an unplanned full-stack defrost during meal service.',
     '[{"label":"Short cycles 6h","value":"14"},{"label":"Suction SH","value":"+3.2 K"}]'::jsonb,
     'Dispatch a service technician within 24h to check refrigerant charge + expansion valve.',
     'pending', now() + interval '3 days'),

    ('55555555-5555-5555-5555-555555550023',
     v_civiccare, v_campus, NULL, '44444444-4444-4444-4444-444444440021',
     'compliance_variance',
     'FSMS variance detected on Line 2',
     'Yesterday''s audit checklist shows 3 unchecked steps in the chilling SOP. Draft corrective action ready.',
     'Audit row 47-49 unchecked. Audit closed without manager sign-off.',
     'requires_approval', 0.97,
     'Pre-empt non-conformance during Friday''s campus audit.',
     '[{"label":"Unchecked steps","value":"3"},{"label":"Audit","value":"#A-2231"}]'::jsonb,
     'Send the corrective action draft to the QA officer for review + sign-off.',
     'pending', now() + interval '2 days')
  ON CONFLICT (id) DO NOTHING;

  -- One historical approved decision so the action ledger isn't empty
  INSERT INTO public.agent_recommendations
    (id, organization_id, site_id, asset_id, template_slug, title, summary, risk_level, confidence,
     expected_impact, proposed_action, status, decided_at, decided_by_id, decision_reason)
  VALUES
    ('55555555-5555-5555-5555-555555550031',
     v_meridian, v_commissary, NULL, 'energy_optimization',
     'Peak-shave on cold-room A — Sep 2026',
     'Raised setpoint 0.8C during peak hours. Auto-reverted nightly.',
     'requires_approval', 0.84,
     '380 euro saved over the month.',
     'Raise cold-room A setpoint by 0.8C during 17:00-20:00.',
     'approved', now() - interval '14 days',
     (SELECT id FROM public.app_users WHERE email = 'owner@meridian.example.com' LIMIT 1),
     'Approved after FSMS review; auto-revert configured.')
  ON CONFLICT (id) DO NOTHING;

  INSERT INTO public.agent_actions (organization_id, recommendation_id, kind, actor_id, reason)
  SELECT v_meridian, '55555555-5555-5555-5555-555555550031', 'approved',
    (SELECT id FROM public.app_users WHERE email = 'owner@meridian.example.com' LIMIT 1),
    'Approved after FSMS review; auto-revert configured.'
  WHERE NOT EXISTS (
    SELECT 1 FROM public.agent_actions WHERE recommendation_id = '55555555-5555-5555-5555-555555550031'
  );

END $$;

-- ---------------------------------------------------------------------------
-- Energy, compliance, DI demo seed
-- ---------------------------------------------------------------------------
DO $$
DECLARE
  v_meridian uuid := '11111111-1111-1111-1111-111111110001';
  v_northline uuid := '11111111-1111-1111-1111-111111110002';
  v_civiccare uuid := '11111111-1111-1111-1111-111111110003';

  v_hotel_kitchen uuid := '22222222-2222-2222-2222-222222220101';
  v_commissary    uuid := '22222222-2222-2222-2222-222222220102';
  v_plant04       uuid := '22222222-2222-2222-2222-222222220201';
  v_campus        uuid := '22222222-2222-2222-2222-222222220301';
  v_hospital      uuid := '22222222-2222-2222-2222-222222220302';
  v_cold_storage  uuid := '22222222-2222-2222-2222-222222220303';

  v_meter_meri uuid := '66666666-6666-6666-6666-666666660001';
  v_meter_nort uuid := '66666666-6666-6666-6666-666666660002';
  v_meter_civi uuid := '66666666-6666-6666-6666-666666660003';
BEGIN
  -- Utility meters (one main meter per client for the demo)
  INSERT INTO public.utility_meters (id, organization_id, site_id, asset_id, name, meter_code, kind, unit, serial_number) VALUES
    (v_meter_meri, v_meridian,  v_commissary, NULL, 'Commissary main',  'M-001', 'electricity', 'kWh', 'SCHN-9000-A'),
    (v_meter_nort, v_northline, v_plant04,    NULL, 'Plant 04 main',    'P-001', 'electricity', 'kWh', 'SCHN-9000-B'),
    (v_meter_civi, v_civiccare, v_cold_storage, '33333333-3333-3333-3333-333333330023', 'Cold storage main', 'C-001', 'electricity', 'kWh', 'SCHN-9000-C')
  ON CONFLICT (id) DO NOTHING;

  -- Tariff windows — same for everyone in EU
  INSERT INTO public.tariff_windows (organization_id, site_id, name, start_local, end_local, rate_per_unit, currency, weekdays_only) VALUES
    (v_meridian,  v_commissary, 'Off-peak',     '22:00', '07:00', 0.11, 'EUR', false),
    (v_meridian,  v_commissary, 'Day',          '07:00', '17:00', 0.17, 'EUR', false),
    (v_meridian,  v_commissary, 'Peak',         '17:00', '20:00', 0.42, 'EUR', true),
    (v_northline, v_plant04,    'Off-peak',     '22:00', '07:00', 0.10, 'EUR', false),
    (v_northline, v_plant04,    'Day',          '07:00', '17:00', 0.16, 'EUR', false),
    (v_northline, v_plant04,    'Peak',         '17:00', '20:00', 0.39, 'EUR', true),
    (v_civiccare, v_cold_storage, 'Day',        '06:00', '22:00', 0.09, 'EUR', false),
    (v_civiccare, v_cold_storage, 'Night',      '22:00', '06:00', 0.06, 'EUR', false)
  ON CONFLICT DO NOTHING;

  -- Daily readings — last 7 days per meter
  INSERT INTO public.utility_readings (organization_id, meter_id, period_start, period_end, consumption, cost, currency)
  SELECT m.organization_id, m.id,
    (current_date - g.i)::timestamptz,
    (current_date - g.i + 1)::timestamptz,
    420 + (random() * 80)::numeric,
    65 + (random() * 18)::numeric,
    'EUR'
  FROM public.utility_meters m
  CROSS JOIN generate_series(0, 6) AS g(i)
  WHERE m.id IN (v_meter_meri, v_meter_nort, v_meter_civi)
  ON CONFLICT DO NOTHING;

  -- A couple of anomalies
  INSERT INTO public.energy_anomalies (organization_id, meter_id, site_id, detected_at, kind, severity, description) VALUES
    (v_meridian,  v_meter_meri, v_commissary, now() - interval '6 hours',  'spike',    'medium', 'Consumption spike at 11:20 — 1.8× baseline, no operational explanation logged.'),
    (v_meridian,  v_meter_meri, v_commissary, now() - interval '2 days',   'tariff_overlap','high','Cold-room A holding setpoint into the peak tariff window 17:00-20:00 again.'),
    (v_northline, v_meter_nort, v_plant04,    now() - interval '11 hours', 'drift',    'low',    'Slow upward drift on Line 2 background load over 9 days.'),
    (v_civiccare, v_meter_civi, v_cold_storage, now() - interval '3 days', 'baseline_breach','medium','Cold-storage daytime baseline up 7% week-over-week.')
  ON CONFLICT DO NOTHING;

  -- Audit runs — recent + upcoming
  INSERT INTO public.audit_runs (id, organization_id, site_id, framework_slug, name, scheduled_for, status, score, completed_at) VALUES
    ('77777777-7777-7777-7777-777777770001', v_meridian, v_hotel_kitchen, 'fsms_iso22000', 'Q3 FSMS audit',         current_date - 14, 'passed',  92, now() - interval '14 days'),
    ('77777777-7777-7777-7777-777777770002', v_meridian, v_commissary,    'haccp',         'HACCP weekly walk',     current_date - 2,  'flagged', 78, now() - interval '2 days'),
    ('77777777-7777-7777-7777-777777770003', v_meridian, v_hotel_kitchen, 'fsms_iso22000', 'October FSMS audit',    current_date + 6,  'scheduled', NULL, NULL),
    ('77777777-7777-7777-7777-777777770011', v_northline, v_plant04,      'iso9001',       'Quality system audit',  current_date - 3,  'passed',  88, now() - interval '3 days'),
    ('77777777-7777-7777-7777-777777770012', v_northline, v_plant04,      'gmp',           'GMP line audit',        current_date + 4,  'scheduled', NULL, NULL),
    ('77777777-7777-7777-7777-777777770021', v_civiccare, v_campus,       'fsms_iso22000', 'Campus FSMS audit',     current_date + 2,  'scheduled', NULL, NULL),
    ('77777777-7777-7777-7777-777777770022', v_civiccare, v_hospital,     'haccp',         'Hospital cold-chain check', current_date - 1, 'flagged', 71, now() - interval '1 day')
  ON CONFLICT (id) DO NOTHING;

  -- Findings
  INSERT INTO public.audit_findings (organization_id, audit_run_id, severity, description) VALUES
    (v_meridian,  '77777777-7777-7777-7777-777777770002', 'medium', 'Chilling SOP rows 47-49 unchecked; manager sign-off missing.'),
    (v_meridian,  '77777777-7777-7777-7777-777777770002', 'low',    'Receiving log undated on 2 of 14 entries.'),
    (v_civiccare, '77777777-7777-7777-7777-777777770022', 'high',   'Refrigeration rack 2 short-cycling not investigated.'),
    (v_civiccare, '77777777-7777-7777-7777-777777770022', 'medium', '14:00 temperature log missing on cold room A.')
  ON CONFLICT DO NOTHING;

  -- Corrective actions
  INSERT INTO public.corrective_actions (organization_id, site_id, title, description, status, due_at) VALUES
    (v_meridian,  v_commissary, 'Close chilling SOP rows 47-49',         'Re-walk the chilling SOP with the shift lead.',  'in_progress', current_date + 2),
    (v_meridian,  v_commissary, 'Restate receiving log discipline',      'Brief receiving team on dating every entry.',    'open',        current_date + 5),
    (v_northline, v_plant04,    'Replace bearing assembly Line 2',       'Schedule for next changeover.',                  'open',        current_date + 4),
    (v_civiccare, v_hospital,   'Investigate rack 2 short-cycling',      'Dispatch refrigeration technician.',             'in_progress', current_date + 1),
    (v_civiccare, v_campus,     'Capture missing temperature log',       'QA officer sign-off + manual reading.',          'closed',      current_date - 1)
  ON CONFLICT DO NOTHING;

  -- Temperature logs — last 24h on cold rooms
  INSERT INTO public.temperature_logs (organization_id, site_id, asset_id, recorded_at, temperature_c, setpoint_c, in_envelope)
  SELECT v_civiccare, v_campus, '33333333-3333-3333-3333-333333330021',
    now() - (g.i * interval '4 hours'),
    -0.4 + (random() * 0.6 - 0.3)::numeric,
    -0.5,
    true
  FROM generate_series(0, 5) AS g(i)
  ON CONFLICT DO NOTHING;

  -- One temperature breach
  INSERT INTO public.temperature_logs (organization_id, site_id, asset_id, recorded_at, temperature_c, setpoint_c, in_envelope)
  VALUES (v_civiccare, v_hospital, '33333333-3333-3333-3333-333333330022',
    now() - interval '6 hours', 2.1, 0.0, false)
  ON CONFLICT DO NOTHING;

  -- Incidents
  INSERT INTO public.incidents (organization_id, site_id, occurred_at, category, severity, title, description, status) VALUES
    (v_meridian,  v_hotel_kitchen, now() - interval '3 days', 'equipment', 'low',    'Hood motor restart',           'Tripped breaker; restored within 4 minutes.', 'closed'),
    (v_northline, v_plant04,       now() - interval '1 day',  'safety',    'medium', 'Near-miss on Line 2',          'Operator stepped into safety zone during changeover.', 'investigating'),
    (v_civiccare, v_hospital,      now() - interval '6 hours','cold_chain','high',   'Rack 2 temperature breach',    'Setpoint exceeded by 2.1C for 38 minutes.',     'open')
  ON CONFLICT DO NOTHING;

  -- Metric snapshots — current month per client
  INSERT INTO public.metric_snapshots (organization_id, site_id, metric_slug, period, period_start, value, delta_pct, target_value)
  VALUES
    (v_meridian,  NULL, 'revenue',           'month', date_trunc('month', current_date), 184500, 6.4,  175000),
    (v_meridian,  NULL, 'cogs',              'month', date_trunc('month', current_date), 92300,  2.1,  95000),
    (v_meridian,  NULL, 'contribution',      'month', date_trunc('month', current_date), 49.9,   1.8,  47.5),
    (v_meridian,  NULL, 'downtime_hours',    'month', date_trunc('month', current_date), 11.2,  -23.0, 14.0),
    (v_meridian,  NULL, 'energy_kwh',        'month', date_trunc('month', current_date), 31200, -4.1,  32500),
    (v_meridian,  NULL, 'food_safety_score', 'month', date_trunc('month', current_date), 88,     2.0,  90),
    (v_meridian,  NULL, 'agent_savings',     'month', date_trunc('month', current_date), 1820,   18.4, NULL),

    (v_northline, NULL, 'revenue',           'month', date_trunc('month', current_date), 412000, 3.2,  420000),
    (v_northline, NULL, 'oee',               'month', date_trunc('month', current_date), 76.4,   1.9,  80.0),
    (v_northline, NULL, 'downtime_hours',    'month', date_trunc('month', current_date), 28.6,  -8.0,  32.0),
    (v_northline, NULL, 'energy_kwh',        'month', date_trunc('month', current_date), 92400, -2.2,  95000),
    (v_northline, NULL, 'emissions_scope2',  'month', date_trunc('month', current_date), 38400, -3.1,  40000),
    (v_northline, NULL, 'agent_savings',     'month', date_trunc('month', current_date), 9200,   12.0, NULL),

    (v_civiccare, NULL, 'revenue',           'month', date_trunc('month', current_date), 96000,  1.4,  100000),
    (v_civiccare, NULL, 'food_safety_score', 'month', date_trunc('month', current_date), 82,    -1.0,  88),
    (v_civiccare, NULL, 'downtime_hours',    'month', date_trunc('month', current_date), 6.4,   -12.0, 8.0),
    (v_civiccare, NULL, 'energy_kwh',        'month', date_trunc('month', current_date), 21800,  1.4,  21500),
    (v_civiccare, NULL, 'agent_savings',     'month', date_trunc('month', current_date), 1100,   25.6, NULL)
  ON CONFLICT DO NOTHING;

END $$;

-- ---------------------------------------------------------------------------
-- Print a summary so `supabase db reset` operators see what's available
-- ---------------------------------------------------------------------------
DO $$
BEGIN
  RAISE NOTICE '';
  RAISE NOTICE '================================================================';
  RAISE NOTICE 'Kerning AI dev seed loaded.';
  RAISE NOTICE '  13 users, password: KerningSeed!2026';
  RAISE NOTICE '  Super admin:    super.admin@kerning.ooo';
  RAISE NOTICE '  Saurabh client: owner@saurabh-arora.example.com';
  RAISE NOTICE '  Avinash partner: owner@avinash.example.com';
  RAISE NOTICE '  Client owner: owner@meridian.example.com';
  RAISE NOTICE '  Operator:     operator@northline.example.com';
  RAISE NOTICE '================================================================';
  RAISE NOTICE '';
END $$;
