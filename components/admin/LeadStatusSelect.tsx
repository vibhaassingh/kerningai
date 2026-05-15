"use client";

import { useActionState } from "react";
import { useRouter } from "next/navigation";

import { updateLeadStatus } from "@/lib/admin/lead-actions";
import type { ActionResult } from "@/lib/auth/actions";

interface LeadStatusSelectProps {
  leadId: string;
  current: string;
  stages: { slug: string; name: string; is_won: boolean; is_lost: boolean }[];
}

const initialState: ActionResult = { ok: false, error: "" };

export function LeadStatusSelect({
  leadId,
  current,
  stages,
}: LeadStatusSelectProps) {
  const [state, formAction, pending] = useActionState(
    updateLeadStatus,
    initialState,
  );
  const router = useRouter();

  return (
    <form
      action={(fd) => {
        formAction(fd);
        // Refresh to pick up the new activity entry.
        setTimeout(() => router.refresh(), 200);
      }}
      className="space-y-2"
    >
      <input type="hidden" name="leadId" value={leadId} />
      <select
        name="status"
        defaultValue={current}
        disabled={pending}
        onChange={(e) => {
          (e.target.form as HTMLFormElement).requestSubmit();
        }}
        className="w-full appearance-none rounded-full border border-hairline-strong bg-bg-elev/60 px-3 py-1.5 font-mono text-[12px] uppercase tracking-[0.1em] text-text outline-none transition-colors focus:border-[var(--color-signal)]"
      >
        {stages.map((s) => (
          <option key={s.slug} value={s.slug} className="bg-bg">
            {s.name}
          </option>
        ))}
      </select>
      {!state.ok && state.error && (
        <p className="text-[11px] text-[var(--color-signal)]" role="alert">
          {state.error}
        </p>
      )}
    </form>
  );
}
