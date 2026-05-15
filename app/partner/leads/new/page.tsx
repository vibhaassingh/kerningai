"use client";

import { useActionState } from "react";

import { Eyebrow } from "@/components/primitives/Eyebrow";
import { submitPartnerLead } from "@/lib/partner/partner-actions";
import type { ActionResult } from "@/lib/auth/actions";

export default function PartnerLeadNewPage() {
  const [result, dispatch, pending] = useActionState<
    ActionResult<{ leadId: string }> | undefined,
    FormData
  >(submitPartnerLead, undefined);

  return (
    <div className="space-y-8">
      <header className="space-y-2">
        <Eyebrow number="01">Submit a new lead</Eyebrow>
        <h1 className="font-display text-[1.6rem] tracking-[-0.01em] text-text">
          Refer a prospect to Kerning AI
        </h1>
        <p className="text-[14px] text-[var(--color-text-faded)]">
          The Kerning team will pick up the lead and keep you in the loop on
          status. You&apos;ll see referred projects in My Projects once they land.
        </p>
      </header>

      {result?.ok ? (
        <p className="rounded-2xl border border-[var(--color-signal-deep)] bg-[var(--color-signal)]/10 px-5 py-5 text-[13.5px] text-text">
          Lead submitted. Reference: <span className="font-mono">{result.data?.leadId}</span>
        </p>
      ) : (
        <form
          action={dispatch}
          className="grid gap-3 rounded-2xl border border-hairline bg-bg-elev/30 p-5 sm:grid-cols-2"
        >
          <label className="space-y-1.5">
            <span className="font-mono text-[10px] uppercase tracking-[0.14em] text-[var(--color-text-muted)]">
              Contact name
            </span>
            <input
              required
              name="contactName"
              minLength={2}
              maxLength={120}
              className="w-full rounded-md border border-hairline bg-bg px-3 py-2 text-[13px] text-text"
            />
          </label>
          <label className="space-y-1.5">
            <span className="font-mono text-[10px] uppercase tracking-[0.14em] text-[var(--color-text-muted)]">
              Company name
            </span>
            <input
              required
              name="companyName"
              minLength={2}
              maxLength={200}
              className="w-full rounded-md border border-hairline bg-bg px-3 py-2 text-[13px] text-text"
            />
          </label>
          <label className="space-y-1.5">
            <span className="font-mono text-[10px] uppercase tracking-[0.14em] text-[var(--color-text-muted)]">
              Contact email
            </span>
            <input
              required
              type="email"
              name="contactEmail"
              className="w-full rounded-md border border-hairline bg-bg px-3 py-2 text-[13px] text-text"
            />
          </label>
          <label className="space-y-1.5">
            <span className="font-mono text-[10px] uppercase tracking-[0.14em] text-[var(--color-text-muted)]">
              Phone (optional)
            </span>
            <input
              name="phone"
              className="w-full rounded-md border border-hairline bg-bg px-3 py-2 text-[13px] text-text"
            />
          </label>
          <label className="space-y-1.5 sm:col-span-2">
            <span className="font-mono text-[10px] uppercase tracking-[0.14em] text-[var(--color-text-muted)]">
              Notes
            </span>
            <textarea
              name="notes"
              rows={4}
              maxLength={2000}
              className="w-full rounded-md border border-hairline bg-bg px-3 py-2 text-[13px] text-text"
            />
          </label>
          <div className="flex items-center justify-end gap-3 sm:col-span-2">
            <button
              type="submit"
              disabled={pending}
              className="rounded-full border border-[var(--color-signal-deep)] px-4 py-1.5 font-mono text-[10.5px] uppercase tracking-[0.14em] text-[var(--color-signal-soft)] hover:border-[var(--color-signal)] hover:text-[var(--color-signal)] disabled:opacity-50"
            >
              {pending ? "Submitting…" : "Submit lead"}
            </button>
          </div>
          {result && !result.ok && (
            <p className="font-mono text-[10px] uppercase tracking-[0.14em] text-[var(--color-canvas-pain)] sm:col-span-2">
              {result.error}
            </p>
          )}
        </form>
      )}
    </div>
  );
}
