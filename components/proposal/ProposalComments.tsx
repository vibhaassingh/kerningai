"use client";

import { useActionState, useEffect, useRef } from "react";
import { useRouter } from "next/navigation";

import { Eyebrow } from "@/components/primitives/Eyebrow";
import { LiquidPillButton } from "@/components/primitives/LiquidPill";
import { addProposalComment } from "@/lib/admin/proposal-comment-actions";
import { formatRelative } from "@/lib/admin/format";
import type { ProposalComment } from "@/lib/admin/proposals";
import type { ActionResult } from "@/lib/auth/actions";

const initialState: ActionResult = { ok: false, error: "" };

export function ProposalComments({
  proposalId,
  comments,
  eyebrow = "08",
}: {
  proposalId: string;
  comments: ProposalComment[];
  eyebrow?: string;
}) {
  const [state, formAction, pending] = useActionState(
    addProposalComment,
    initialState,
  );
  const ref = useRef<HTMLFormElement | null>(null);
  const router = useRouter();

  useEffect(() => {
    if (state.ok) {
      ref.current?.reset();
      router.refresh();
    }
  }, [state, router]);

  return (
    <section className="space-y-4 print:hidden">
      <Eyebrow number={eyebrow}>Comments</Eyebrow>

      <ul className="space-y-3">
        {comments.length === 0 && (
          <li className="rounded-2xl border border-hairline bg-bg-elev/30 px-5 py-6 text-[13px] text-[var(--color-text-muted)]">
            No comments yet. The Kerning team, the client, and the
            referring partner can all post here.
          </li>
        )}
        {comments.map((c) => (
          <li
            key={c.id}
            className="space-y-1.5 rounded-2xl border border-hairline bg-bg-elev/30 px-5 py-4"
          >
            <div className="flex items-baseline justify-between gap-3">
              <span className="text-[13.5px] text-text">{c.author_name}</span>
              <span className="font-mono text-[10.5px] uppercase tracking-[0.12em] text-[var(--color-text-faint)]">
                {formatRelative(c.created_at)}
              </span>
            </div>
            <p className="whitespace-pre-line text-[13.5px] leading-relaxed text-[var(--color-text-faded)]">
              {c.body}
            </p>
          </li>
        ))}
      </ul>

      <form ref={ref} action={formAction} className="space-y-3">
        <input type="hidden" name="proposalId" value={proposalId} />
        <textarea
          name="body"
          rows={3}
          required
          placeholder="Add a comment on this proposal…"
          className="w-full resize-none rounded-lg border border-hairline bg-bg px-3 py-2 text-[14px] text-text outline-none transition-colors focus:border-[var(--color-signal-deep)]"
        />
        {!state.ok && state.error && (
          <p className="text-[12px] text-[var(--color-canvas-pain)]" role="alert">
            {state.error}
          </p>
        )}
        <div className="flex justify-end">
          <LiquidPillButton type="submit" variant="accent" disabled={pending}>
            {pending ? "Posting…" : "Post comment"}
          </LiquidPillButton>
        </div>
      </form>
    </section>
  );
}
