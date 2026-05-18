"use client";

import { useActionState, useEffect } from "react";
import { useRouter } from "next/navigation";

import { transitionProposalStatus } from "@/lib/admin/proposal-actions";
import type { ActionResult } from "@/lib/auth/actions";

type Target = "draft" | "internal_review" | "sent" | "archived";

const NEXT: Record<string, { target: Target; label: string; accent?: boolean }[]> =
  {
    draft: [
      { target: "internal_review", label: "Send to internal review" },
      { target: "archived", label: "Archive" },
    ],
    internal_review: [
      { target: "sent", label: "Send to client", accent: true },
      { target: "draft", label: "Back to draft" },
      { target: "archived", label: "Archive" },
    ],
    sent: [{ target: "archived", label: "Archive" }],
    declined: [
      { target: "draft", label: "Reopen as draft" },
      { target: "archived", label: "Archive" },
    ],
    expired: [
      { target: "draft", label: "Reopen as draft" },
      { target: "archived", label: "Archive" },
    ],
    accepted: [{ target: "archived", label: "Archive" }],
  };

const initialState: ActionResult = { ok: false, error: "" };

export function ProposalStatusControls({
  proposalId,
  status,
}: {
  proposalId: string;
  status: string;
}) {
  const [state, formAction, pending] = useActionState(
    transitionProposalStatus,
    initialState,
  );
  const router = useRouter();

  useEffect(() => {
    if (state.ok) router.refresh();
  }, [state, router]);

  const actions = NEXT[status] ?? [];
  if (actions.length === 0) {
    return (
      <p className="font-mono text-[10.5px] uppercase tracking-[0.14em] text-[var(--color-text-muted)]">
        No further transitions from {status.replace("_", " ")}.
      </p>
    );
  }

  return (
    <div className="flex flex-wrap items-center gap-3">
      {actions.map((a) => (
        <form key={a.target} action={formAction}>
          <input type="hidden" name="proposalId" value={proposalId} />
          <input type="hidden" name="target" value={a.target} />
          <button
            type="submit"
            disabled={pending}
            className={
              a.accent
                ? "rounded-full bg-[var(--color-signal)] px-5 py-2 font-mono text-[10.5px] uppercase tracking-[0.14em] text-[var(--color-bg)] hover:opacity-90 disabled:opacity-50"
                : "rounded-full border border-hairline px-5 py-2 font-mono text-[10.5px] uppercase tracking-[0.14em] text-[var(--color-text-faded)] hover:border-[var(--color-signal)] hover:text-[var(--color-signal)] disabled:opacity-50"
            }
          >
            {pending ? "Working…" : a.label}
          </button>
        </form>
      ))}
      {!state.ok && state.error && (
        <p className="font-mono text-[10px] uppercase tracking-[0.14em] text-[var(--color-canvas-pain)]">
          {state.error}
        </p>
      )}
    </div>
  );
}
