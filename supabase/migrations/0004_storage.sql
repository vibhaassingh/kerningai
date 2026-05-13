-- =============================================================================
-- Migration 0004 — Storage buckets + RLS policies
-- =============================================================================
-- Creates the seven canonical buckets and policies that enforce per-org
-- access. Object paths follow the convention:
--     <bucket>/<organization_id>/<resource>/<filename>
-- The first path segment after the bucket is parsed as the owning org id.
-- =============================================================================

-- ---------------------------------------------------------------------------
-- Helper: extract org id from a storage object path.
-- Returns NULL if the path doesn't start with a uuid-shaped folder.
-- ---------------------------------------------------------------------------
CREATE OR REPLACE FUNCTION app.storage_org_id(p_name text)
RETURNS uuid
LANGUAGE plpgsql STABLE
AS $$
DECLARE
  v_first text;
BEGIN
  v_first := split_part(p_name, '/', 1);
  IF v_first ~ '^[0-9a-fA-F]{8}-[0-9a-fA-F]{4}-[0-9a-fA-F]{4}-[0-9a-fA-F]{4}-[0-9a-fA-F]{12}$' THEN
    RETURN v_first::uuid;
  END IF;
  RETURN NULL;
END;
$$;

GRANT EXECUTE ON FUNCTION app.storage_org_id(text) TO authenticated, anon;

-- ---------------------------------------------------------------------------
-- Buckets
-- ---------------------------------------------------------------------------
INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types) VALUES
  ('cms-media',             'cms-media',             true,  20 * 1024 * 1024, ARRAY['image/png','image/jpeg','image/webp','image/svg+xml','image/gif','video/mp4','video/webm']),
  ('questionnaire-uploads', 'questionnaire-uploads', false, 50 * 1024 * 1024, NULL),
  ('client-documents',      'client-documents',      false, 50 * 1024 * 1024, NULL),
  ('compliance-evidence',   'compliance-evidence',   false, 50 * 1024 * 1024, NULL),
  ('reports',               'reports',               false, 25 * 1024 * 1024, ARRAY['application/pdf','text/csv','application/json']),
  ('contracts',             'contracts',             false, 25 * 1024 * 1024, ARRAY['application/pdf']),
  ('support-attachments',   'support-attachments',   false, 25 * 1024 * 1024, NULL)
ON CONFLICT (id) DO NOTHING;

-- ---------------------------------------------------------------------------
-- cms-media — public read of published assets; only CMS editors / super_admin write
-- ---------------------------------------------------------------------------
CREATE POLICY "cms_media_public_read"
  ON storage.objects FOR SELECT
  USING (bucket_id = 'cms-media');

CREATE POLICY "cms_media_cms_editor_write"
  ON storage.objects FOR INSERT
  WITH CHECK (
    bucket_id = 'cms-media'
    AND (app.is_super_admin() OR app.has_permission_any('manage_cms'))
  );

CREATE POLICY "cms_media_cms_editor_update"
  ON storage.objects FOR UPDATE
  USING (
    bucket_id = 'cms-media'
    AND (app.is_super_admin() OR app.has_permission_any('manage_cms'))
  );

CREATE POLICY "cms_media_cms_editor_delete"
  ON storage.objects FOR DELETE
  USING (
    bucket_id = 'cms-media'
    AND (app.is_super_admin() OR app.has_permission_any('manage_cms'))
  );

-- ---------------------------------------------------------------------------
-- questionnaire-uploads — owners of the submission's org or internal staff
-- For anonymous prospects, uploads route through service-role server actions
-- with the submitter's session cookie binding them to the submission.
-- ---------------------------------------------------------------------------
CREATE POLICY "questionnaire_uploads_read"
  ON storage.objects FOR SELECT
  USING (
    bucket_id = 'questionnaire-uploads'
    AND (
      app.is_super_admin()
      OR app.is_internal_staff()
      OR app.is_member_of(app.storage_org_id(name))
    )
  );

CREATE POLICY "questionnaire_uploads_write"
  ON storage.objects FOR INSERT
  WITH CHECK (
    bucket_id = 'questionnaire-uploads'
    AND (
      app.is_super_admin()
      OR app.is_internal_staff()
      OR app.is_member_of(app.storage_org_id(name))
    )
  );

-- ---------------------------------------------------------------------------
-- client-documents — members of the owning org only
-- ---------------------------------------------------------------------------
CREATE POLICY "client_documents_read"
  ON storage.objects FOR SELECT
  USING (
    bucket_id = 'client-documents'
    AND (
      app.is_super_admin()
      OR app.is_internal_staff()
      OR app.is_member_of(app.storage_org_id(name))
    )
  );

CREATE POLICY "client_documents_write"
  ON storage.objects FOR INSERT
  WITH CHECK (
    bucket_id = 'client-documents'
    AND (
      app.is_super_admin()
      OR app.is_internal_staff()
      OR app.is_member_of(app.storage_org_id(name))
    )
  );

CREATE POLICY "client_documents_update"
  ON storage.objects FOR UPDATE
  USING (
    bucket_id = 'client-documents'
    AND (
      app.is_super_admin()
      OR app.is_internal_staff()
      OR app.is_member_of(app.storage_org_id(name))
    )
  );

CREATE POLICY "client_documents_delete"
  ON storage.objects FOR DELETE
  USING (
    bucket_id = 'client-documents'
    AND (
      app.is_super_admin()
      OR app.is_internal_staff()
      OR (app.is_member_of(app.storage_org_id(name)) AND app.has_permission(
        'manage_documents',
        app.storage_org_id(name)
      ))
    )
  );

-- ---------------------------------------------------------------------------
-- compliance-evidence — compliance officers + internal staff
-- ---------------------------------------------------------------------------
CREATE POLICY "compliance_evidence_read"
  ON storage.objects FOR SELECT
  USING (
    bucket_id = 'compliance-evidence'
    AND (
      app.is_super_admin()
      OR app.is_internal_staff()
      OR (app.is_member_of(app.storage_org_id(name)) AND app.has_permission(
        'view_compliance',
        app.storage_org_id(name)
      ))
    )
  );

CREATE POLICY "compliance_evidence_write"
  ON storage.objects FOR INSERT
  WITH CHECK (
    bucket_id = 'compliance-evidence'
    AND (
      app.is_super_admin()
      OR app.is_internal_staff()
      OR (app.is_member_of(app.storage_org_id(name)) AND app.has_permission(
        'manage_audits',
        app.storage_org_id(name)
      ))
    )
  );

-- ---------------------------------------------------------------------------
-- reports — members of org with export_reports permission
-- ---------------------------------------------------------------------------
CREATE POLICY "reports_read"
  ON storage.objects FOR SELECT
  USING (
    bucket_id = 'reports'
    AND (
      app.is_super_admin()
      OR app.is_internal_staff()
      OR (app.is_member_of(app.storage_org_id(name)) AND app.has_permission(
        'export_reports',
        app.storage_org_id(name)
      ))
    )
  );

-- ---------------------------------------------------------------------------
-- contracts — finance admins + super_admin + client_owner only
-- ---------------------------------------------------------------------------
CREATE POLICY "contracts_read"
  ON storage.objects FOR SELECT
  USING (
    bucket_id = 'contracts'
    AND (
      app.is_super_admin()
      OR app.is_internal_staff()
      OR (app.is_member_of(app.storage_org_id(name)) AND app.has_permission(
        'view_billing',
        app.storage_org_id(name)
      ))
    )
  );

CREATE POLICY "contracts_write"
  ON storage.objects FOR INSERT
  WITH CHECK (
    bucket_id = 'contracts'
    AND (
      app.is_super_admin()
      OR (app.is_internal_staff() AND app.has_permission_any('manage_billing'))
    )
  );

-- ---------------------------------------------------------------------------
-- support-attachments — ticket participants + support team
-- For Phase 1 we keep this permissive (org members or internal staff).
-- Phase 2 tightens to per-ticket participants.
-- ---------------------------------------------------------------------------
CREATE POLICY "support_attachments_read"
  ON storage.objects FOR SELECT
  USING (
    bucket_id = 'support-attachments'
    AND (
      app.is_super_admin()
      OR app.is_internal_staff()
      OR app.is_member_of(app.storage_org_id(name))
    )
  );

CREATE POLICY "support_attachments_write"
  ON storage.objects FOR INSERT
  WITH CHECK (
    bucket_id = 'support-attachments'
    AND (
      app.is_super_admin()
      OR app.is_internal_staff()
      OR app.is_member_of(app.storage_org_id(name))
    )
  );
