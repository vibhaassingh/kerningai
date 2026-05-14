"use client";

import { useActionState, useEffect, useRef } from "react";
import { useRouter } from "next/navigation";

import { LiquidPillButton } from "@/components/primitives/LiquidPill";
import { addTicketComment } from "@/lib/portal/support-actions";
import type { ActionResult } from "@/lib/auth/actions";

interface AddTicketCommentFormProps {
  ticketId: string;
}

const initialState: ActionResult = { ok: false, error: "" };

export function AddTicketCommentForm({ ticketId }: AddTicketCommentFormProps) {
  const [state, formAction, pending] = useActionState(addTicketComment, initialState);
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
      <input type="hidden" name="ticketId" value={ticketId} />
      <label className="block space-y-2">
        <span className="block text-[11px] uppercase tracking-[0.14em] text-[var(--color-text-muted)]">
          Reply
        </span>
        <textarea
          name="body"
          rows={3}
          required
          placeholder="Add an update visible to the Kerning support team."
          className="w-full resize-none border-0 border-b border-hairline bg-transparent pb-2 text-[15px] text-text outline-none transition-colors focus:border-[var(--color-signal)]"
        />
      </label>
      {!state.ok && state.error && (
        <p className="text-[12px] text-[var(--color-signal)]" role="alert">
          {state.error}
        </p>
      )}
      <div className="flex justify-end">
        <LiquidPillButton type="submit" variant="accent" disabled={pending}>
          {pending ? "Sending…" : "Send reply"}
        </LiquidPillButton>
      </div>
    </form>
  );
}
