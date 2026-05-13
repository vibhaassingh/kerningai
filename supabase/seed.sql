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
  ('11111111-1111-1111-1111-1111meri0001'::uuid, 'Meridian Hospitality Group',     'meridian',   'client', 'eu-west-1',     'finance@meridian.example.com',  '{"industry": "hospitality"}'::jsonb),
  ('11111111-1111-1111-1111-1111nort0002'::uuid, 'Northline Components Plant',     'northline',  'client', 'eu-central-1',  'finance@northline.example.com', '{"industry": "manufacturing"}'::jsonb),
  ('11111111-1111-1111-1111-1111civi0003'::uuid, 'CivicCare Institutional Dining', 'civiccare',  'client', 'ap-south-1',    'finance@civiccare.example.com', '{"industry": "institutional"}'::jsonb)
ON CONFLICT (id) DO NOTHING;

-- client_settings
INSERT INTO public.client_settings (organization_id, industry, deployment_type, modules_enabled, health_score, mrr_cents, renewal_date) VALUES
  ('11111111-1111-1111-1111-1111meri0001'::uuid, 'hospitality',    'cloud',           ARRAY['predictive_maintenance','energy','compliance','decision_intelligence'],         88, 1200000, '2027-04-01'),
  ('11111111-1111-1111-1111-1111nort0002'::uuid, 'manufacturing',  'sovereign_cloud', ARRAY['operational_ontology','predictive_maintenance','energy','decision_intelligence'], 76, 2800000, '2026-11-15'),
  ('11111111-1111-1111-1111-1111civi0003'::uuid, 'institutional',  'on_prem',         ARRAY['compliance','energy','agentic_workflows','operational_ontology'],               82, 1800000, '2027-02-20')
ON CONFLICT (organization_id) DO NOTHING;

-- ---------------------------------------------------------------------------
-- Sites (3 per client)
-- ---------------------------------------------------------------------------
INSERT INTO public.sites (id, organization_id, name, slug, region, timezone, deployment_type, address, status) VALUES
  -- Meridian
  ('22222222-2222-2222-2222-2222hotk0101'::uuid, '11111111-1111-1111-1111-1111meri0001'::uuid, 'Hotel Kitchen 01',     'hotel-kitchen-01',     'eu-west-1',     'Europe/Amsterdam', 'cloud', '{"city":"Amsterdam","country":"NL"}'::jsonb, 'active'),
  ('22222222-2222-2222-2222-2222comy0102'::uuid, '11111111-1111-1111-1111-1111meri0001'::uuid, 'Central Commissary',   'central-commissary',   'eu-west-1',     'Europe/Amsterdam', 'cloud', '{"city":"Amsterdam","country":"NL"}'::jsonb, 'active'),
  ('22222222-2222-2222-2222-2222roft0103'::uuid, '11111111-1111-1111-1111-1111meri0001'::uuid, 'Rooftop Venue',        'rooftop-venue',        'eu-west-1',     'Europe/Amsterdam', 'cloud', '{"city":"Amsterdam","country":"NL"}'::jsonb, 'active'),
  -- Northline
  ('22222222-2222-2222-2222-2222plnt0201'::uuid, '11111111-1111-1111-1111-1111nort0002'::uuid, 'Plant 04',             'plant-04',             'eu-central-1',  'Europe/Berlin',    'sovereign_cloud', '{"city":"Stuttgart","country":"DE"}'::jsonb, 'active'),
  ('22222222-2222-2222-2222-2222lin20202'::uuid, '11111111-1111-1111-1111-1111nort0002'::uuid, 'Line 2',               'line-2',               'eu-central-1',  'Europe/Berlin',    'sovereign_cloud', '{"city":"Stuttgart","country":"DE"}'::jsonb, 'active'),
  ('22222222-2222-2222-2222-2222pkg00203'::uuid, '11111111-1111-1111-1111-1111nort0002'::uuid, 'Packaging Cell',       'packaging-cell',       'eu-central-1',  'Europe/Berlin',    'sovereign_cloud', '{"city":"Stuttgart","country":"DE"}'::jsonb, 'active'),
  -- CivicCare
  ('22222222-2222-2222-2222-2222campk0301'::uuid, '11111111-1111-1111-1111-1111civi0003'::uuid, 'Campus Kitchen',       'campus-kitchen',       'ap-south-1',    'Asia/Kolkata',     'on_prem',  '{"city":"Bengaluru","country":"IN"}'::jsonb, 'active'),
  ('22222222-2222-2222-2222-2222hospk0302'::uuid, '11111111-1111-1111-1111-1111civi0003'::uuid, 'Hospital Kitchen',     'hospital-kitchen',     'ap-south-1',    'Asia/Kolkata',     'on_prem',  '{"city":"Bengaluru","country":"IN"}'::jsonb, 'active'),
  ('22222222-2222-2222-2222-2222clds0303'::uuid, '11111111-1111-1111-1111-1111civi0003'::uuid, 'Cold Storage',         'cold-storage',         'ap-south-1',    'Asia/Kolkata',     'on_prem',  '{"city":"Bengaluru","country":"IN"}'::jsonb, 'active')
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
      ('aaaaaaaa-aaaa-aaaa-aaaa-aaaa00000001'::uuid, 'super.admin@kerning.ooo',                    'Kerning Super Admin',         'super_admin',              '00000000-0000-0000-0000-00000000ke00'::uuid),
      ('aaaaaaaa-aaaa-aaaa-aaaa-aaaa00000002'::uuid, 'sales.admin@kerning.ooo',                    'Kerning Sales Admin',         'sales_admin',              '00000000-0000-0000-0000-00000000ke00'::uuid),
      ('aaaaaaaa-aaaa-aaaa-aaaa-aaaa00000003'::uuid, 'success.manager@kerning.ooo',                'Kerning Client Success',      'client_success_manager',   '00000000-0000-0000-0000-00000000ke00'::uuid),
      ('aaaaaaaa-aaaa-aaaa-aaaa-aaaa00000004'::uuid, 'data.engineer@kerning.ooo',                  'Kerning Data Engineer',       'data_engineer',            '00000000-0000-0000-0000-00000000ke00'::uuid),
      ('bbbbbbbb-bbbb-bbbb-bbbb-bbbb00000001'::uuid, 'owner@meridian.example.com',                 'Maya Lindgren',               'client_owner',             '11111111-1111-1111-1111-1111meri0001'::uuid),
      ('bbbbbbbb-bbbb-bbbb-bbbb-bbbb00000002'::uuid, 'manager.kitchen01@meridian.example.com',     'Anders Holm',                 'site_manager',             '11111111-1111-1111-1111-1111meri0001'::uuid),
      ('bbbbbbbb-bbbb-bbbb-bbbb-bbbb00000003'::uuid, 'cfo@meridian.example.com',                   'Priya Subramanian',           'executive_cfo',            '11111111-1111-1111-1111-1111meri0001'::uuid),
      ('cccccccc-cccc-cccc-cccc-cccc00000001'::uuid, 'maintenance@northline.example.com',          'Jonas Bekker',                'maintenance_engineer',     '11111111-1111-1111-1111-1111nort0002'::uuid),
      ('cccccccc-cccc-cccc-cccc-cccc00000002'::uuid, 'operator@northline.example.com',             'Leo Marais',                  'operator',                 '11111111-1111-1111-1111-1111nort0002'::uuid),
      ('dddddddd-dddd-dddd-dddd-dddd00000001'::uuid, 'qa@civiccare.example.com',                   'Aditi Rao',                   'qa_compliance_officer',    '11111111-1111-1111-1111-1111civi0003'::uuid)
    ) AS t(id, email, full_name, role_slug, org_id)
  LOOP
    -- Insert auth.users (skip if email already exists)
    INSERT INTO auth.users (
      instance_id, id, aud, role,
      email, encrypted_password,
      email_confirmed_at, raw_app_meta_data, raw_user_meta_data,
      created_at, updated_at, last_sign_in_at,
      confirmation_token, email_change_token_new, recovery_token
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
      '', '', ''
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
-- Print a summary so `supabase db reset` operators see what's available
-- ---------------------------------------------------------------------------
DO $$
BEGIN
  RAISE NOTICE '';
  RAISE NOTICE '================================================================';
  RAISE NOTICE 'Kerning AI dev seed loaded.';
  RAISE NOTICE '  10 users, password: KerningSeed!2026';
  RAISE NOTICE '  Super admin: super.admin@kerning.ooo';
  RAISE NOTICE '  Client owner: owner@meridian.example.com';
  RAISE NOTICE '  Operator:     operator@northline.example.com';
  RAISE NOTICE '================================================================';
  RAISE NOTICE '';
END $$;
