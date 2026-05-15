"use client";

import { useActionState, useEffect } from "react";
import { useRouter } from "next/navigation";

import { AuthField } from "@/components/auth/AuthField";
import { LiquidPillButton } from "@/components/primitives/LiquidPill";
import { createSupportTicket } from "@/lib/admin/support-actions";
import type { ActionResult } from "@/lib/auth/actions";

interface CreateTicketFormProps {
  clients: { id: string; name: string }[];
}

const initialState: ActionResult<{ ticketId: string }> = {
  ok: false,
  error: "",
};

export function CreateTicketForm({ clients }: CreateTicketFormProps) {
  const [state, formAction, pending] = useActionState(
    createSupportTicket,
    initialState,
  );
  const router = useRouter();

  useEffect(() => {
    if (state.ok && state.data?.ticketId) {
      router.push(`/admin/support/${state.data.ticketId}`);
    }
  }, [state, router]);

  if (clients.length === 0) {
    return (
      <p className="rounded-2xl border border-hairline bg-bg-elev/30 px-5 py-4 text-[13px] text-[var(--color-text-muted)]">
        No client organisations yet — convert a lead to a client first.
      </p>
    );
  }

  return (
    <form action={formAction} className="grid gap-6 sm:grid-cols-2">
      <label className="block space-y-2">
        <span className="block text-[11px] uppercase tracking-[0.14em] text-[var(--color-text-muted)]">
          Client
        </span>
        <select
          name="organizationId"
          required
          defaultValue=""
          className="w-full appearance-none border-0 border-b border-hairline bg-transparent pb-2 text-[16px] text-text outline-none transition-colors focus:border-[var(--color-signal)]"
        >
          <option value="" disabled className="bg-bg">
            Pick a client…
          </option>
          {clients.map((c) => (
            <option key={c.id} value={c.id} className="bg-bg">
              {c.name}
            </option>
          ))}
        </select>
        {!state.ok && state.field === "organizationId" && (
          <span className="block text-[12px] text-[var(--color-signal)]">
            {state.error}
          </span>
        )}
      </label>

      <label className="block space-y-2">
        <span className="block text-[11px] uppercase tracking-[0.14em] text-[var(--color-text-muted)]">
          Severity
        </span>
        <select
          name="severity"
          defaultValue="p3"
          className="w-full appearance-none border-0 border-b border-hairline bg-transparent pb-2 text-[16px] text-text outline-none transition-colors focus:border-[var(--color-signal)]"
        >
          <option value="p1" className="bg-bg">P1 — Critical</option>
          <option value="p2" className="bg-bg">P2 — High</option>
          <option value="p3" className="bg-bg">P3 — Normal</option>
          <option value="p4" className="bg-bg">P4 — Low</option>
        </select>
      </label>

      <AuthField
        label="Title"
        name="title"
        required
        className="sm:col-span-2"
        error={!state.ok && state.field === "title" ? state.error : undefined}
      />
      <AuthField
        label="Module (optional)"
        name="module"
        placeholder="e.g. predictive_maintenance"
        className="sm:col-span-2"
      />
      <label className="block space-y-2 sm:col-span-2">
        <span className="block text-[11px] uppercase tracking-[0.14em] text-[var(--color-text-muted)]">
          Description
        </span>
        <textarea
          name="description"
          required
          rows={4}
          maxLength={8000}
          className="w-full rounded-md border border-hairline bg-bg px-3 py-2 text-[14px] text-text"
        />
        {!state.ok && state.field === "description" && (
          <span className="block text-[12px] text-[var(--color-signal)]">
            {state.error}
          </span>
        )}
      </label>

      <div className="sm:col-span-2 flex items-center justify-between gap-4">
        {!state.ok && state.error && !state.field && (
          <p className="text-[13px] text-[var(--color-signal)]" role="alert">
            {state.error}
          </p>
        )}
        {state.ok && (
          <p className="text-[13px] text-[var(--color-signal)]" role="status">
            Ticket created. Opening it…
          </p>
        )}
        <LiquidPillButton
          type="submit"
          variant="accent"
          disabled={pending}
          className="ml-auto"
        >
          {pending ? "Creating…" : "Create ticket"}
        </LiquidPillButton>
      </div>
    </form>
  );
}
