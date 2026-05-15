-- =============================================================================
-- Migration 0023 — CMS (dual-mode content)
-- =============================================================================
-- Phase 2 CMS. Insights/posts can live in TWO places:
--   * code: content/insights/*.mdx  (the existing code registry)
--   * db:   public.cms_posts        (this table, editable from /admin/cms)
--
-- The `cms_dual_mode` feature flag (seeded in 0003) governs the merge.
-- Resolution rule, enforced in lib/cms/resolver.ts: CODE WINS on slug
-- collision — a DB post never shadows a shipped MDX file. The DB layer
-- only adds NEW slugs (or is the sole source when no MDX exists).
--
-- Public read is limited to `status = 'published'`. Internal staff with
-- `manage_cms` manage everything via service-role server actions.
-- =============================================================================

CREATE TYPE public.cms_post_status AS ENUM ('draft', 'published', 'archived');

CREATE TABLE public.cms_posts (
  id              uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  slug            text NOT NULL UNIQUE,
  title           text NOT NULL,
  summary         text NOT NULL,
  body            text NOT NULL DEFAULT '',
  author          text NOT NULL DEFAULT 'Kerning AI',
  tags            text[] NOT NULL DEFAULT ARRAY[]::text[],
  read_time       integer,
  status          public.cms_post_status NOT NULL DEFAULT 'draft',
  published_at    timestamptz,
  created_by_id   uuid REFERENCES public.app_users(id) ON DELETE SET NULL,
  updated_by_id   uuid REFERENCES public.app_users(id) ON DELETE SET NULL,
  created_at      timestamptz NOT NULL DEFAULT now(),
  updated_at      timestamptz NOT NULL DEFAULT now(),
  metadata        jsonb NOT NULL DEFAULT '{}'::jsonb
);

CREATE INDEX idx_cms_posts_status ON public.cms_posts (status, published_at DESC);
CREATE INDEX idx_cms_posts_slug ON public.cms_posts (slug);

CREATE TRIGGER trg_cms_posts_updated_at
  BEFORE UPDATE ON public.cms_posts
  FOR EACH ROW EXECUTE FUNCTION app.set_updated_at();

-- ---------------------------------------------------------------------------
-- RLS
-- ---------------------------------------------------------------------------
-- Public (anon + authenticated) may read PUBLISHED posts only — this powers
-- the marketing /insights pages. Internal staff with manage_cms read all.
-- Writes always go through service-role server actions (manage_cms gated
-- in app code), so no INSERT/UPDATE policy is exposed to clients.
-- ---------------------------------------------------------------------------
ALTER TABLE public.cms_posts ENABLE ROW LEVEL SECURITY;

CREATE POLICY "cms_posts_public_read_published" ON public.cms_posts
  FOR SELECT
  USING (status = 'published');

CREATE POLICY "cms_posts_staff_read_all" ON public.cms_posts
  FOR SELECT
  USING (
    app.is_super_admin()
    OR app.is_internal_staff()
    OR app.has_permission_any('manage_cms')
  );

-- Allow anon role to read published posts (marketing site is unauthenticated).
GRANT SELECT ON public.cms_posts TO anon;
