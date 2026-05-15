"use client";

import { useActionState, useState, useTransition } from "react";
import { useRouter } from "next/navigation";

import { LiquidPillButton } from "@/components/primitives/LiquidPill";
import {
  approveRecommendation,
  rejectRecommendation,
} from "@/lib/portal/agent-actions";
import type { ActionResult } from "@/lib/auth/actions";

interface AgentDecisionFormProps {
  recommendationId: string;
}

const initialState: ActionResult = { ok: false, error: "" };

export function AgentDecisionForm({ recommendationId }: AgentDecisionFormProps) {
  const [approveState, approveAction, approvePending] = useActionState(
    approveRecommendation,
    initialState,
  );
  const [rejectState, rejectAction, rejectPending] = useActionState(
    rejectRecommendation,
    initialState,
  );
  const [reason, setReason] = useState("");
  const [, startTransition] = useTransition();
  const router = useRouter();

  function refresh() {
    startTransition(() => router.refresh());
  }

  const error =
    (!approveState.ok && approveState.error) ||
    (!rejectState.ok && rejectState.error) ||
    null;

  return (
    <div className="space-y-5">
      <label className="block space-y-2">
        <span className="block text-[11px] uppercase tracking-[0.14em] text-[var(--color-text-muted)]">
          Decision note (optional)
        </span>
        <textarea
          name="reason"
          rows={3}
          value={reason}
          onChange={(e) => setReason(e.target.value)}
          placeholder="Approving — keep auto-revert at 20:00. Notify QA."
          className="w-full resize-none border-0 border-b border-hairline bg-transparent pb-2 text-[15px] text-text placeholder:text-[var(--color-text-faint)] outline-none transition-colors focus:border-[var(--color-signal)]"
        />
      </label>

      {error && (
        <p className="text-[12.5px] text-[var(--color-signal)]" role="alert">
          {error}
        </p>
      )}

      <div className="flex flex-wrap items-center gap-3">
        <form
          action={(fd) => {
            approveAction(fd);
            setTimeout(refresh, 200);
          }}
        >
          <input type="hidden" name="recommendationId" value={recommendationId} />
          <input type="hidden" name="reason" value={reason} />
          <LiquidPillButton
            type="submit"
            variant="accent"
            disabled={approvePending || rejectPending}
          >
            {approvePending ? "Approving…" : "Approve"}
          </LiquidPillButton>
        </form>

        <form
          action={(fd) => {
            rejectAction(fd);
            setTimeout(refresh, 200);
          }}
        >
          <input type="hidden" name="recommendationId" value={recommendationId} />
          <input type="hidden" name="reason" value={reason} />
          <button
            type="submit"
            disabled={approvePending || rejectPending}
            className="rounded-full border border-hairline-strong px-5 py-2.5 text-[13px] text-text transition-colors hover:border-[var(--color-signal)] disabled:opacity-50"
          >
            {rejectPending ? "Rejecting…" : "Reject"}
          </button>
        </form>
      </div>
    </div>
  );
}
