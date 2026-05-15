"use client";

import { useActionState, useEffect, useRef } from "react";
import { useRouter } from "next/navigation";

import { AuthField } from "@/components/auth/AuthField";
import { LiquidPillButton } from "@/components/primitives/LiquidPill";
import { createLead } from "@/lib/admin/lead-actions";
import type { ActionResult } from "@/lib/auth/actions";

const initialState: ActionResult<{ leadId: string }> = {
  ok: false,
  error: "",
};

const SOURCES = [
  { v: "outbound", l: "Outbound" },
  { v: "referral", l: "Referral" },
  { v: "inbound_email", l: "Inbound email" },
  { v: "event", l: "Event" },
  { v: "other", l: "Other" },
];

export function CreateLeadForm() {
  const [state, formAction, pending] = useActionState(createLead, initialState);
  const router = useRouter();
  const formRef = useRef<HTMLFormElement | null>(null);

  useEffect(() => {
    if (state.ok && state.data?.leadId) {
      router.push(`/admin/leads/${state.data.leadId}`);
    }
  }, [state, router]);

  return (
    <form
      ref={formRef}
      action={formAction}
      className="grid gap-6 sm:grid-cols-2"
    >
      <AuthField
        label="Contact name"
        name="contactName"
        required
        error={
          !state.ok && state.field === "contactName" ? state.error : undefined
        }
      />
      <AuthField
        label="Contact email"
        name="contactEmail"
        type="email"
        required
        error={
          !state.ok && state.field === "contactEmail" ? state.error : undefined
        }
      />
      <AuthField
        label="Company (optional)"
        name="companyName"
        error={
          !state.ok && state.field === "companyName" ? state.error : undefined
        }
      />
      <AuthField
        label="Role / title (optional)"
        name="contactRole"
        error={
          !state.ok && state.field === "contactRole" ? state.error : undefined
        }
      />
      <label className="block space-y-2">
        <span className="block text-[11px] uppercase tracking-[0.14em] text-[var(--color-text-muted)]">
          Source
        </span>
        <select
          name="source"
          defaultValue="outbound"
          className="w-full appearance-none border-0 border-b border-hairline bg-transparent pb-2 text-[16px] text-text outline-none transition-colors focus:border-[var(--color-signal)]"
        >
          {SOURCES.map((s) => (
            <option key={s.v} value={s.v} className="bg-bg">
              {s.l}
            </option>
          ))}
        </select>
      </label>
      <AuthField
        label="Lead score 0–100 (optional)"
        name="score"
        type="number"
        error={!state.ok && state.field === "score" ? state.error : undefined}
      />
      <label className="block space-y-2 sm:col-span-2">
        <span className="block text-[11px] uppercase tracking-[0.14em] text-[var(--color-text-muted)]">
          What they want (optional)
        </span>
        <textarea
          name="intentSummary"
          rows={3}
          maxLength={4000}
          className="w-full rounded-md border border-hairline bg-bg px-3 py-2 text-[14px] text-text"
        />
      </label>

      <div className="sm:col-span-2 flex items-center justify-between gap-4">
        {!state.ok && state.error && !state.field && (
          <p className="text-[13px] text-[var(--color-signal)]" role="alert">
            {state.error}
          </p>
        )}
        {state.ok && (
          <p className="text-[13px] text-[var(--color-signal)]" role="status">
            Lead created. Opening it…
          </p>
        )}
        <LiquidPillButton
          type="submit"
          variant="accent"
          disabled={pending}
          className="ml-auto"
        >
          {pending ? "Adding…" : "Add lead"}
        </LiquidPillButton>
      </div>
    </form>
  );
}
