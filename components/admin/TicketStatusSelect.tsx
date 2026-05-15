"use client";

import { useActionState } from "react";
import { useRouter } from "next/navigation";

import { setTicketStatus } from "@/lib/admin/support-actions";
import type { ActionResult } from "@/lib/auth/actions";

interface TicketStatusSelectProps {
  ticketId: string;
  organizationId: string;
  current: "open" | "in_progress" | "waiting_on_client" | "closed";
}

const STATUSES: TicketStatusSelectProps["current"][] = [
  "open",
  "in_progress",
  "waiting_on_client",
  "closed",
];

const initialState: ActionResult = { ok: false, error: "" };

export function TicketStatusSelect({
  ticketId,
  organizationId,
  current,
}: TicketStatusSelectProps) {
  const [state, formAction, pending] = useActionState(setTicketStatus, initialState);
  const router = useRouter();

  return (
    <form
      action={(fd) => {
        formAction(fd);
        setTimeout(() => router.refresh(), 200);
      }}
      className="space-y-1"
    >
      <input type="hidden" name="ticketId" value={ticketId} />
      <input type="hidden" name="organizationId" value={organizationId} />
      <select
        name="status"
        defaultValue={current}
        disabled={pending}
        onChange={(e) => (e.target.form as HTMLFormElement).requestSubmit()}
        className="w-full appearance-none rounded-full border border-hairline-strong bg-bg-elev/60 px-3 py-1.5 font-mono text-[12px] uppercase tracking-[0.1em] text-text outline-none transition-colors focus:border-[var(--color-signal)]"
      >
        {STATUSES.map((s) => (
          <option key={s} value={s} className="bg-bg">
            {s.replace(/_/g, " ")}
          </option>
        ))}
      </select>
      {!state.ok && state.error && (
        <p className="text-[11px] text-[var(--color-signal)]">{state.error}</p>
      )}
    </form>
  );
}
