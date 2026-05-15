import "server-only";

import { isFeatureEnabled } from "@/lib/feature-flags";
import {
  getPublishedCmsPostBySlug,
  listPublishedCmsPosts,
} from "@/lib/cms/posts";
import { getAllInsights, getInsight } from "@/lib/mdx";

/**
 * Dual-mode content resolver.
 *
 * Two sources of insights:
 *   1. code  — content/insights/*.mdx (lib/mdx.ts)
 *   2. db    — public.cms_posts (lib/cms/posts.ts), editable in /admin/cms
 *
 * Rule (governed by the `cms_dual_mode` feature flag, per migration 0003
 * description "Code wins on slug collision"):
 *   - Code MDX is always authoritative.
 *   - DB posts only contribute slugs the code registry does NOT define.
 *   - If `cms_dual_mode` is OFF, the DB layer is ignored entirely and
 *     behaviour is identical to the pre-CMS site (pure code registry).
 *
 * This guarantees a DB edit can never silently shadow or break a shipped
 * MDX article, and the marketing site degrades safely if the DB is down.
 */

export interface ResolvedInsightMeta {
  slug: string;
  title: string;
  summary: string;
  date: Date;
  author: string;
  tags?: string[];
  readTime?: number;
  source: "code" | "db";
}

export interface ResolvedInsightDoc extends ResolvedInsightMeta {
  content: string;
}

export async function getResolvedInsights(): Promise<ResolvedInsightMeta[]> {
  const codeDocs = await getAllInsights();
  const codeMeta: ResolvedInsightMeta[] = codeDocs.map((d) => ({
    slug: d.slug,
    title: d.title,
    summary: d.summary,
    date: d.date,
    author: d.author,
    tags: d.tags,
    readTime: d.readTime,
    source: "code",
  }));

  if (!(await isFeatureEnabled("cms_dual_mode"))) {
    return codeMeta.sort((a, b) => b.date.getTime() - a.date.getTime());
  }

  const codeSlugs = new Set(codeMeta.map((m) => m.slug));
  const dbPosts = await listPublishedCmsPosts();
  const dbMeta: ResolvedInsightMeta[] = dbPosts
    .filter((p) => !codeSlugs.has(p.slug)) // code wins on collision
    .map((p) => ({
      slug: p.slug,
      title: p.title,
      summary: p.summary,
      date: new Date(p.published_at ?? p.created_at),
      author: p.author,
      tags: p.tags,
      readTime: p.read_time ?? undefined,
      source: "db",
    }));

  return [...codeMeta, ...dbMeta].sort(
    (a, b) => b.date.getTime() - a.date.getTime(),
  );
}

export async function getResolvedInsight(
  slug: string,
): Promise<ResolvedInsightDoc | null> {
  // Code first — always authoritative.
  const codeDoc = await getInsight(slug);
  if (codeDoc) {
    return {
      slug: codeDoc.slug,
      title: codeDoc.title,
      summary: codeDoc.summary,
      date: codeDoc.date,
      author: codeDoc.author,
      tags: codeDoc.tags,
      readTime: codeDoc.readTime,
      content: codeDoc.content,
      source: "code",
    };
  }

  if (!(await isFeatureEnabled("cms_dual_mode"))) return null;

  const dbPost = await getPublishedCmsPostBySlug(slug);
  if (!dbPost) return null;
  return {
    slug: dbPost.slug,
    title: dbPost.title,
    summary: dbPost.summary,
    date: new Date(dbPost.published_at ?? dbPost.created_at),
    author: dbPost.author,
    tags: dbPost.tags,
    readTime: dbPost.read_time ?? undefined,
    content: dbPost.body,
    source: "db",
  };
}
