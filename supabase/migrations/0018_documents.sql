-- =============================================================================
-- Migration 0018 — Documents (per-org folder + file metadata)
-- =============================================================================
-- File bytes live in Supabase Storage (`client-documents` bucket); this
-- table mirrors metadata so we can render fast lists, audit downloads,
-- and gate access through RLS without having to enumerate the bucket.
-- =============================================================================

CREATE TYPE public.document_kind AS ENUM (
  'general',
  'contract',
  'sow',
  'evidence',
  'report',
  'sop',
  'other'
);

CREATE TABLE public.documents (
  id              uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id uuid NOT NULL REFERENCES public.organizations(id) ON DELETE CASCADE,
  site_id         uuid REFERENCES public.sites(id) ON DELETE SET NULL,
  kind            public.document_kind NOT NULL DEFAULT 'general',
  name            text NOT NULL,
  description     text,
  bucket          text NOT NULL DEFAULT 'client-documents',
  storage_path    text NOT NULL,
  mime_type       text,
  size_bytes      bigint,
  uploaded_by_id  uuid REFERENCES public.app_users(id) ON DELETE SET NULL,
  created_at      timestamptz NOT NULL DEFAULT now(),
  updated_at      timestamptz NOT NULL DEFAULT now(),
  metadata        jsonb NOT NULL DEFAULT '{}'::jsonb,
  UNIQUE (organization_id, storage_path)
);

CREATE INDEX idx_documents_org_kind ON public.documents (organization_id, kind);
CREATE INDEX idx_documents_org_created ON public.documents (organization_id, created_at DESC);

CREATE TRIGGER trg_documents_updated_at
  BEFORE UPDATE ON public.documents
  FOR EACH ROW EXECUTE FUNCTION app.set_updated_at();

ALTER TABLE public.documents ENABLE ROW LEVEL SECURITY;
CREATE POLICY "documents_member_read" ON public.documents
  FOR SELECT
  USING (app.is_member_of(organization_id) OR app.is_internal_staff() OR app.is_super_admin());

CREATE POLICY "documents_member_write" ON public.documents
  FOR INSERT
  WITH CHECK (
    (app.is_member_of(organization_id) AND app.has_permission('manage_documents', organization_id))
    OR app.is_super_admin()
    OR app.is_internal_staff()
  );

CREATE POLICY "documents_member_update" ON public.documents
  FOR UPDATE
  USING (
    (app.is_member_of(organization_id) AND app.has_permission('manage_documents', organization_id))
    OR app.is_super_admin()
    OR app.is_internal_staff()
  );

CREATE POLICY "documents_member_delete" ON public.documents
  FOR DELETE
  USING (
    (app.is_member_of(organization_id) AND app.has_permission('manage_documents', organization_id))
    OR app.is_super_admin()
  );
