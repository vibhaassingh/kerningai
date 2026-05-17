"use client";

import { useActionState, useEffect } from "react";
import { useRouter } from "next/navigation";

import { saveProposalBasics } from "@/lib/admin/proposal-actions";
import type { ActionResult } from "@/lib/auth/actions";

interface ProposalBasicsFormProps {
  proposalId: string;
  title: string;
  summary: string | null;
  executiveBrief: string | null;
  currency: string;
  validUntil: string | null;
}

const initialState: ActionResult = { ok: false, error: "" };

const inputClass =
  "w-full rounded-lg border border-hairline bg-bg px-3 py-2 text-[14px] text-text outline-none focus:border-[var(--color-signal-deep)]";
const labelClass =
  "font-mono text-[10px] uppercase tracking-[0.14em] text-[var(--color-text-faint)]";

export function ProposalBasicsForm({
  proposalId,
  title,
  summary,
  executiveBrief,
  currency,
  validUntil,
}: ProposalBasicsFormProps) {
  const [state, formAction, pending] = useActionState(
    saveProposalBasics,
    initialState,
  );
  const router = useRouter();

  useEffect(() => {
    if (state.ok) router.refresh();
  }, [state, router]);

  return (
    <form action={formAction} className="space-y-5">
      <input type="hidden" name="proposalId" value={proposalId} />

      <div className="space-y-1.5">
        <label className={labelClass} htmlFor="p-title">
          Title
        </label>
        <input
          id="p-title"
          name="title"
          defaultValue={title}
          className={inputClass}
          required
        />
      </div>

      <div className="grid gap-4 sm:grid-cols-[1fr_180px]">
        <div className="space-y-1.5">
          <label className={labelClass} htmlFor="p-currency">
            Currency
          </label>
          <input
            id="p-currency"
            name="currency"
            defaultValue={currency}
            className={inputClass}
            required
          />
        </div>
        <div className="space-y-1.5">
          <label className={labelClass} htmlFor="p-valid">
            Valid until
          </label>
          <input
            id="p-valid"
            name="valid_until"
            type="date"
            defaultValue={validUntil ?? ""}
            className={inputClass}
          />
        </div>
      </div>

      <div className="space-y-1.5">
        <label className={labelClass} htmlFor="p-summary">
          Summary
        </label>
        <textarea
          id="p-summary"
          name="summary"
          defaultValue={summary ?? ""}
          rows={3}
          className={inputClass}
        />
      </div>

      <div className="space-y-1.5">
        <label className={labelClass} htmlFor="p-brief">
          Executive brief
        </label>
        <textarea
          id="p-brief"
          name="executive_brief"
          defaultValue={executiveBrief ?? ""}
          rows={6}
          className={inputClass}
        />
      </div>

      <div className="flex items-center justify-end gap-4">
        {!state.ok && state.error && (
          <p className="font-mono text-[10px] uppercase tracking-[0.14em] text-[var(--color-canvas-pain)]">
            {state.error}
          </p>
        )}
        {state.ok && (
          <p className="font-mono text-[10px] uppercase tracking-[0.14em] text-[var(--color-signal)]">
            Saved.
          </p>
        )}
        <button
          type="submit"
          disabled={pending}
          className="rounded-full border border-[var(--color-signal-deep)] px-5 py-2 font-mono text-[10.5px] uppercase tracking-[0.14em] text-[var(--color-signal-soft)] hover:border-[var(--color-signal)] hover:text-[var(--color-signal)] disabled:opacity-50"
        >
          {pending ? "Saving…" : "Save basics"}
        </button>
      </div>
    </form>
  );
}
