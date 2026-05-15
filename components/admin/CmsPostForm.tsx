"use client";

import { useActionState } from "react";

import { upsertCmsPost } from "@/lib/cms/post-actions";
import type { ActionResult } from "@/lib/auth/actions";
import type { CmsPost } from "@/lib/cms/posts";

interface CmsPostFormProps {
  post?: CmsPost;
}

export function CmsPostForm({ post }: CmsPostFormProps) {
  const [result, dispatch, pending] = useActionState<
    ActionResult<{ id: string }> | undefined,
    FormData
  >(upsertCmsPost, undefined);

  return (
    <form
      action={dispatch}
      className="grid gap-3 rounded-2xl border border-hairline bg-bg-elev/30 p-5 sm:grid-cols-2"
    >
      {post && <input type="hidden" name="id" value={post.id} />}
      <label className="space-y-1.5 sm:col-span-2">
        <span className="font-mono text-[10px] uppercase tracking-[0.14em] text-[var(--color-text-muted)]">
          Title
        </span>
        <input
          required
          name="title"
          defaultValue={post?.title}
          minLength={2}
          maxLength={200}
          className="w-full rounded-md border border-hairline bg-bg px-3 py-2 text-[13px] text-text"
        />
      </label>
      {!post && (
        <label className="space-y-1.5">
          <span className="font-mono text-[10px] uppercase tracking-[0.14em] text-[var(--color-text-muted)]">
            Slug (optional)
          </span>
          <input
            name="slug"
            maxLength={80}
            placeholder="auto from title"
            className="w-full rounded-md border border-hairline bg-bg px-3 py-2 text-[13px] text-text"
          />
        </label>
      )}
      <label className="space-y-1.5">
        <span className="font-mono text-[10px] uppercase tracking-[0.14em] text-[var(--color-text-muted)]">
          Author
        </span>
        <input
          name="author"
          defaultValue={post?.author ?? "Kerning AI"}
          maxLength={120}
          className="w-full rounded-md border border-hairline bg-bg px-3 py-2 text-[13px] text-text"
        />
      </label>
      <label className="space-y-1.5">
        <span className="font-mono text-[10px] uppercase tracking-[0.14em] text-[var(--color-text-muted)]">
          Read time (min)
        </span>
        <input
          name="readTime"
          type="number"
          min={0}
          max={120}
          defaultValue={post?.read_time ?? undefined}
          className="w-full rounded-md border border-hairline bg-bg px-3 py-2 text-[13px] text-text"
        />
      </label>
      <label className="space-y-1.5 sm:col-span-2">
        <span className="font-mono text-[10px] uppercase tracking-[0.14em] text-[var(--color-text-muted)]">
          Summary
        </span>
        <textarea
          required
          name="summary"
          rows={2}
          defaultValue={post?.summary}
          maxLength={500}
          className="w-full rounded-md border border-hairline bg-bg px-3 py-2 text-[13px] text-text"
        />
      </label>
      <label className="space-y-1.5 sm:col-span-2">
        <span className="font-mono text-[10px] uppercase tracking-[0.14em] text-[var(--color-text-muted)]">
          Tags (comma-separated)
        </span>
        <input
          name="tags"
          defaultValue={post?.tags.join(", ")}
          className="w-full rounded-md border border-hairline bg-bg px-3 py-2 text-[13px] text-text"
        />
      </label>
      <label className="space-y-1.5 sm:col-span-2">
        <span className="font-mono text-[10px] uppercase tracking-[0.14em] text-[var(--color-text-muted)]">
          Body (Markdown / MDX)
        </span>
        <textarea
          name="body"
          rows={12}
          defaultValue={post?.body}
          maxLength={100_000}
          className="w-full rounded-md border border-hairline bg-bg px-3 py-2 font-mono text-[12.5px] text-text"
        />
      </label>
      <div className="flex items-center justify-between gap-3 sm:col-span-2">
        <p className="font-mono text-[10px] uppercase tracking-[0.14em] text-[var(--color-text-muted)]">
          {post ? "Editing existing post" : "New posts start as draft"}
        </p>
        <button
          type="submit"
          disabled={pending}
          className="rounded-full border border-[var(--color-signal-deep)] px-4 py-1.5 font-mono text-[10.5px] uppercase tracking-[0.14em] text-[var(--color-signal-soft)] hover:border-[var(--color-signal)] hover:text-[var(--color-signal)] disabled:opacity-50"
        >
          {pending ? "Saving…" : post ? "Save changes" : "Create post"}
        </button>
      </div>
      {result && !result.ok && (
        <p className="font-mono text-[10px] uppercase tracking-[0.14em] text-[var(--color-canvas-pain)] sm:col-span-2">
          {result.error}
        </p>
      )}
      {result?.ok && (
        <p className="font-mono text-[10px] uppercase tracking-[0.14em] text-[var(--color-signal)] sm:col-span-2">
          Saved.
        </p>
      )}
    </form>
  );
}
