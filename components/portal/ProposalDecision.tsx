"use client";

import { useActionState, useEffect } from "react";
import { useRouter } from "next/navigation";

import { decideProposal } from "@/lib/admin/proposal-actions";
import type { ActionResult } from "@/lib/auth/actions";

const initialState: ActionResult = { ok: false, error: "" };

export function ProposalDecision({ proposalId }: { proposalId: string }) {
  const [state, formAction, pending] = useActionState(
    decideProposal,
    initialState,
  );
  const router = useRouter();

  useEffect(() => {
    if (state.ok) router.refresh();
  }, [state, router]);

  return (
    <div className="space-y-3 rounded-2xl border border-hairline bg-bg-elev/30 p-6">
      <p className="font-mono text-[10.5px] uppercase tracking-[0.14em] text-[var(--color-text-muted)]">
        Your decision
      </p>
      <p className="text-[14px] leading-relaxed text-[var(--color-text-faded)]">
        Accepting moves this engagement into implementation. You can discuss
        changes with your Kerning contact before deciding.
      </p>
      <div className="flex flex-wrap items-center gap-3 pt-1">
        <form action={formAction}>
          <input type="hidden" name="proposalId" value={proposalId} />
          <input type="hidden" name="decision" value="accepted" />
          <button
            type="submit"
            disabled={pending}
            className="rounded-full bg-[var(--color-signal)] px-6 py-2.5 font-mono text-[10.5px] uppercase tracking-[0.14em] text-[var(--color-bg)] hover:opacity-90 disabled:opacity-50"
          >
            {pending ? "Working…" : "Accept proposal"}
          </button>
        </form>
        <form action={formAction}>
          <input type="hidden" name="proposalId" value={proposalId} />
          <input type="hidden" name="decision" value="declined" />
          <button
            type="submit"
            disabled={pending}
            className="rounded-full border border-hairline px-6 py-2.5 font-mono text-[10.5px] uppercase tracking-[0.14em] text-[var(--color-text-faded)] hover:border-[var(--color-canvas-pain)] hover:text-[var(--color-canvas-pain)] disabled:opacity-50"
          >
            Decline
          </button>
        </form>
        {!state.ok && state.error && (
          <p className="font-mono text-[10px] uppercase tracking-[0.14em] text-[var(--color-canvas-pain)]">
            {state.error}
          </p>
        )}
      </div>
    </div>
  );
}
