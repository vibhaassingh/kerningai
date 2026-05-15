"use server";

import { revalidatePath } from "next/cache";
import { z } from "zod";

import type { ActionResult } from "@/lib/auth/actions";
import { hasPermissionAny, requireUser } from "@/lib/auth/require";
import { withAudit } from "@/lib/audit/with-audit";
import { createServiceClient } from "@/lib/supabase/service";

const slugify = (s: string): string =>
  s
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .slice(0, 80) || "post";

const upsertSchema = z.object({
  id: z.string().uuid().optional(),
  slug: z.string().min(1).max(80).optional(),
  title: z.string().min(2).max(200),
  summary: z.string().min(2).max(500),
  body: z.string().max(100_000).optional(),
  author: z.string().max(120).optional(),
  tags: z.string().optional(), // comma-separated in the form
  readTime: z.coerce.number().int().min(0).max(120).optional(),
});

export async function upsertCmsPost(
  _prev: ActionResult<{ id: string }> | undefined,
  formData: FormData,
): Promise<ActionResult<{ id: string }>> {
  const parsed = upsertSchema.safeParse({
    id: formData.get("id") || undefined,
    slug: formData.get("slug") || undefined,
    title: formData.get("title"),
    summary: formData.get("summary"),
    body: formData.get("body") || undefined,
    author: formData.get("author") || undefined,
    tags: formData.get("tags") || undefined,
    readTime: formData.get("readTime") || undefined,
  });
  if (!parsed.success) {
    return { ok: false, error: parsed.error.issues[0].message };
  }
  if (!(await hasPermissionAny("manage_cms"))) {
    return { ok: false, error: "Not permitted to manage CMS." };
  }

  const user = await requireUser();
  const service = createServiceClient();
  const d = parsed.data;
  const tags = (d.tags ?? "")
    .split(",")
    .map((t) => t.trim())
    .filter(Boolean);

  if (d.id) {
    const { error } = await service
      .from("cms_posts")
      .update({
        title: d.title,
        summary: d.summary,
        body: d.body ?? "",
        author: d.author ?? "Kerning AI",
        tags,
        read_time: d.readTime ?? null,
        updated_by_id: user.id,
      })
      .eq("id", d.id);
    if (error) return { ok: false, error: error.message };

    await withAudit(
      {
        action: "cms_post.updated",
        resourceType: "cms_post",
        resourceId: d.id,
        after: { title: d.title },
      },
      async () => null,
    );
    revalidatePath("/admin/cms");
    return { ok: true, data: { id: d.id } };
  }

  // Create — ensure a unique slug.
  let slug = d.slug ? slugify(d.slug) : slugify(d.title);
  let n = 1;
  while (true) {
    const { data: clash } = await service
      .from("cms_posts")
      .select("id")
      .eq("slug", slug)
      .maybeSingle();
    if (!clash) break;
    n += 1;
    slug = `${slugify(d.slug ?? d.title)}-${n}`;
  }

  const { data: created, error } = await service
    .from("cms_posts")
    .insert({
      slug,
      title: d.title,
      summary: d.summary,
      body: d.body ?? "",
      author: d.author ?? "Kerning AI",
      tags,
      read_time: d.readTime ?? null,
      status: "draft",
      created_by_id: user.id,
      updated_by_id: user.id,
    })
    .select("id")
    .single();
  if (error || !created) {
    return { ok: false, error: error?.message ?? "Could not create post." };
  }

  await withAudit(
    {
      action: "cms_post.created",
      resourceType: "cms_post",
      resourceId: created.id,
      after: { slug, title: d.title },
    },
    async () => null,
  );
  revalidatePath("/admin/cms");
  return { ok: true, data: { id: created.id } };
}

const transitionSchema = z.object({
  id: z.string().uuid(),
  status: z.enum(["draft", "published", "archived"]),
});

export async function setCmsPostStatus(
  _prev: ActionResult | undefined,
  formData: FormData,
): Promise<ActionResult> {
  const parsed = transitionSchema.safeParse({
    id: formData.get("id"),
    status: formData.get("status"),
  });
  if (!parsed.success) return { ok: false, error: parsed.error.issues[0].message };
  if (!(await hasPermissionAny("manage_cms"))) {
    return { ok: false, error: "Not permitted." };
  }
  const user = await requireUser();
  const service = createServiceClient();

  const { error } = await service
    .from("cms_posts")
    .update({
      status: parsed.data.status,
      published_at:
        parsed.data.status === "published" ? new Date().toISOString() : null,
      updated_by_id: user.id,
    })
    .eq("id", parsed.data.id);
  if (error) return { ok: false, error: error.message };

  await withAudit(
    {
      action: `cms_post.${parsed.data.status}`,
      resourceType: "cms_post",
      resourceId: parsed.data.id,
      after: { status: parsed.data.status },
    },
    async () => null,
  );

  revalidatePath("/admin/cms");
  revalidatePath("/insights");
  return { ok: true };
}
