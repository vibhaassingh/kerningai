"use client";

import { useActionState, useEffect } from "react";
import { useRouter } from "next/navigation";

import { LiquidPillButton } from "@/components/primitives/LiquidPill";
import { createTicket } from "@/lib/portal/support-actions";
import type { ActionResult } from "@/lib/auth/actions";

const initialState: ActionResult<{ ticketId: string }> = { ok: false, error: "" };

const SEVERITY = [
  { value: "p1", label: "P1 — outage / blocker" },
  { value: "p2", label: "P2 — major impact" },
  { value: "p3", label: "P3 — normal" },
  { value: "p4", label: "P4 — minor / question" },
];

const MODULES = [
  { value: "", label: "Pick a module (optional)" },
  { value: "predictive_maintenance", label: "Predictive Maintenance" },
  { value: "energy", label: "Energy" },
  { value: "compliance", label: "Compliance" },
  { value: "decision_intelligence", label: "Decision Intelligence" },
  { value: "agentic_workflows", label: "Agents" },
  { value: "operational_ontology", label: "Ontology" },
  { value: "platform", label: "Platform / general" },
];

export function CreateTicketForm() {
  const [state, formAction, pending] = useActionState(createTicket, initialState);
  const router = useRouter();

  useEffect(() => {
    if (state.ok && state.data?.ticketId) {
      router.push(`/portal/support/${state.data.ticketId}`);
    }
  }, [state, router]);

  return (
    <form action={formAction} className="grid gap-6 sm:grid-cols-2">
      <label className="block space-y-2 sm:col-span-2">
        <span className="block text-[11px] uppercase tracking-[0.14em] text-[var(--color-text-muted)]">
          Title *
        </span>
        <input
          name="title"
          type="text"
          required
          className="w-full border-0 border-b border-hairline bg-transparent pb-2 text-[16px] text-text outline-none transition-colors focus:border-[var(--color-signal)]"
        />
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
          {SEVERITY.map((s) => (
            <option key={s.value} value={s.value} className="bg-bg">
              {s.label}
            </option>
          ))}
        </select>
      </label>

      <label className="block space-y-2">
        <span className="block text-[11px] uppercase tracking-[0.14em] text-[var(--color-text-muted)]">
          Module
        </span>
        <select
          name="module"
          defaultValue=""
          className="w-full appearance-none border-0 border-b border-hairline bg-transparent pb-2 text-[16px] text-text outline-none transition-colors focus:border-[var(--color-signal)]"
        >
          {MODULES.map((m) => (
            <option key={m.value} value={m.value} className="bg-bg">
              {m.label}
            </option>
          ))}
        </select>
      </label>

      <label className="block space-y-2 sm:col-span-2">
        <span className="block text-[11px] uppercase tracking-[0.14em] text-[var(--color-text-muted)]">
          Description *
        </span>
        <textarea
          name="description"
          rows={4}
          required
          minLength={8}
          placeholder="What did you see? What did you expect? When did it start?"
          className="w-full resize-none border-0 border-b border-hairline bg-transparent pb-2 text-[15px] text-text outline-none transition-colors focus:border-[var(--color-signal)]"
        />
      </label>

      <div className="flex items-center justify-between gap-4 sm:col-span-2">
        {!state.ok && state.error && (
          <p className="text-[13px] text-[var(--color-signal)]" role="alert">
            {state.error}
          </p>
        )}
        <LiquidPillButton type="submit" variant="accent" disabled={pending}>
          {pending ? "Opening…" : "Open ticket"}
        </LiquidPillButton>
      </div>
    </form>
  );
}
