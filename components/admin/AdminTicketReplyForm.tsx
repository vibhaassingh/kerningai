"use client";

import { useActionState, useEffect, useRef } from "react";
import { useRouter } from "next/navigation";

import { LiquidPillButton } from "@/components/primitives/LiquidPill";
import { adminReplyToTicket } from "@/lib/admin/support-actions";
import type { ActionResult } from "@/lib/auth/actions";

interface AdminTicketReplyFormProps {
  ticketId: string;
  organizationId: string;
}

const initialState: ActionResult = { ok: false, error: "" };

export function AdminTicketReplyForm({
  ticketId,
  organizationId,
}: AdminTicketReplyFormProps) {
  const [state, formAction, pending] = useActionState(adminReplyToTicket, initialState);
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
      <input type="hidden" name="organizationId" value={organizationId} />

      <label className="block space-y-2">
        <span className="block text-[11px] uppercase tracking-[0.14em] text-[var(--color-text-muted)]">
          Reply
        </span>
        <textarea
          name="body"
          rows={4}
          required
          className="w-full resize-none border-0 border-b border-hairline bg-transparent pb-2 text-[15px] text-text outline-none transition-colors focus:border-[var(--color-signal)]"
          placeholder="Reply directly to the client, or check the box below to leave an internal-only note."
        />
      </label>

      <label className="flex items-center gap-2 text-[12.5px] text-[var(--color-text-faded)]">
        <input
          type="checkbox"
          name="isInternal"
          className="h-4 w-4 rounded border-hairline accent-[var(--color-signal)]"
        />
        Internal-only note (hidden from client members)
      </label>

      {!state.ok && state.error && (
        <p className="text-[12px] text-[var(--color-signal)]" role="alert">
          {state.error}
        </p>
      )}

      <div className="flex justify-end">
        <LiquidPillButton type="submit" variant="accent" disabled={pending}>
          {pending ? "Sending…" : "Send"}
        </LiquidPillButton>
      </div>
    </form>
  );
}
