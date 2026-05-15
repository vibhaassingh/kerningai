"use client";

import { useActionState } from "react";

import { setCmsPostStatus } from "@/lib/cms/post-actions";
import type { ActionResult } from "@/lib/auth/actions";
import type { CmsPostStatus } from "@/lib/cms/posts";

interface CmsStatusButtonsProps {
  postId: string;
  status: CmsPostStatus;
}

const NEXT: Record<CmsPostStatus, { label: string; to: CmsPostStatus }[]> = {
  draft: [{ label: "Publish", to: "published" }],
  published: [
    { label: "Unpublish", to: "draft" },
    { label: "Archive", to: "archived" },
  ],
  archived: [{ label: "Restore to draft", to: "draft" }],
};

export function CmsStatusButtons({ postId, status }: CmsStatusButtonsProps) {
  const [result, dispatch, pending] = useActionState<
    ActionResult | undefined,
    FormData
  >(setCmsPostStatus, undefined);

  return (
    <div className="flex flex-wrap items-center gap-2">
      {NEXT[status].map((opt) => (
        <form key={opt.to} action={dispatch} className="inline">
          <input type="hidden" name="id" value={postId} />
          <input type="hidden" name="status" value={opt.to} />
          <button
            type="submit"
            disabled={pending}
            className="rounded-full border border-hairline px-3 py-1 font-mono text-[10px] uppercase tracking-[0.14em] text-[var(--color-text-faded)] hover:border-[var(--color-signal)] hover:text-[var(--color-signal)] disabled:opacity-50"
          >
            {opt.label}
          </button>
        </form>
      ))}
      {result && !result.ok && (
        <span className="font-mono text-[10px] uppercase tracking-[0.14em] text-[var(--color-canvas-pain)]">
          {result.error}
        </span>
      )}
    </div>
  );
}
