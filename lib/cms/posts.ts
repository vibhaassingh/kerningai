import "server-only";

import { createServiceClient } from "@/lib/supabase/service";

export type CmsPostStatus = "draft" | "published" | "archived";

export interface CmsPost {
  id: string;
  slug: string;
  title: string;
  summary: string;
  body: string;
  author: string;
  tags: string[];
  read_time: number | null;
  status: CmsPostStatus;
  published_at: string | null;
  created_by_id: string | null;
  updated_by_id: string | null;
  created_at: string;
  updated_at: string;
  metadata: Record<string, unknown>;
}

const COLS =
  "id, slug, title, summary, body, author, tags, read_time, status, published_at, created_by_id, updated_by_id, created_at, updated_at, metadata";

/** All posts (any status) — admin only; service-role read. */
export async function listAllCmsPosts(): Promise<CmsPost[]> {
  const service = createServiceClient();
  const { data } = await service
    .from("cms_posts")
    .select(COLS)
    .order("updated_at", { ascending: false });
  return (data ?? []) as CmsPost[];
}

export async function getCmsPostById(id: string): Promise<CmsPost | null> {
  const service = createServiceClient();
  const { data } = await service
    .from("cms_posts")
    .select(COLS)
    .eq("id", id)
    .maybeSingle();
  return (data as CmsPost) ?? null;
}

/**
 * Published posts — public read path. Uses the cookie-free service
 * client (with an explicit `status = 'published'` filter, so drafts
 * never leak) so the marketing pages can call this from
 * `generateStaticParams` at build time, where there is no request /
 * cookie context.
 */
export async function listPublishedCmsPosts(): Promise<CmsPost[]> {
  const service = createServiceClient();
  const { data } = await service
    .from("cms_posts")
    .select(COLS)
    .eq("status", "published")
    .order("published_at", { ascending: false });
  return (data ?? []) as CmsPost[];
}

export async function getPublishedCmsPostBySlug(
  slug: string,
): Promise<CmsPost | null> {
  const service = createServiceClient();
  const { data } = await service
    .from("cms_posts")
    .select(COLS)
    .eq("slug", slug)
    .eq("status", "published")
    .maybeSingle();
  return (data as CmsPost) ?? null;
}
