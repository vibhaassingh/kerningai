"use client";

import { useActionState, useEffect, useRef } from "react";
import { useRouter } from "next/navigation";

import { LiquidPillButton } from "@/components/primitives/LiquidPill";
import { addLeadNote } from "@/lib/admin/lead-actions";
import type { ActionResult } from "@/lib/auth/actions";

interface AddLeadNoteFormProps {
  leadId: string;
}

const initialState: ActionResult = { ok: false, error: "" };

export function AddLeadNoteForm({ leadId }: AddLeadNoteFormProps) {
  const [state, formAction, pending] = useActionState(
    addLeadNote,
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
    <form ref={ref} action={formAction} className="space-y-4">
      <input type="hidden" name="leadId" value={leadId} />
      <label className="block space-y-2">
        <span className="block text-[11px] uppercase tracking-[0.14em] text-[var(--color-text-muted)]">
          Add an internal note
        </span>
        <textarea
          name="body"
          rows={3}
          required
          placeholder="Discovery call booked for Tuesday. Champion: Maya."
          className="w-full border-0 border-b border-hairline bg-transparent pb-2 text-[15px] text-text placeholder:text-[var(--color-text-faint)] outline-none transition-colors focus:border-[var(--color-signal)] resize-none"
        />
      </label>
      {!state.ok && state.error && (
        <p className="text-[12px] text-[var(--color-signal)]" role="alert">
          {state.error}
        </p>
      )}
      <div className="flex justify-end">
        <LiquidPillButton type="submit" variant="accent" disabled={pending}>
          {pending ? "Saving…" : "Save note"}
        </LiquidPillButton>
      </div>
    </form>
  );
}
