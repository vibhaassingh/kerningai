"use client";

import { useActionState, useEffect, useRef } from "react";
import { useRouter } from "next/navigation";

import { LiquidPillButton } from "@/components/primitives/LiquidPill";
import { uploadDocument } from "@/lib/portal/document-actions";
import type { ActionResult } from "@/lib/auth/actions";

const initialState: ActionResult = { ok: false, error: "" };

const KINDS = [
  { value: "general", label: "General" },
  { value: "contract", label: "Contract" },
  { value: "sow", label: "SOW" },
  { value: "evidence", label: "Compliance evidence" },
  { value: "report", label: "Report" },
  { value: "sop", label: "SOP / runbook" },
  { value: "other", label: "Other" },
];

export function UploadDocumentForm() {
  const [state, formAction, pending] = useActionState(uploadDocument, initialState);
  const ref = useRef<HTMLFormElement | null>(null);
  const router = useRouter();

  useEffect(() => {
    if (state.ok) {
      ref.current?.reset();
      router.refresh();
    }
  }, [state, router]);

  return (
    <form ref={ref} action={formAction} className="grid gap-6 sm:grid-cols-2">
      <label className="block space-y-2 sm:col-span-2">
        <span className="block text-[11px] uppercase tracking-[0.14em] text-[var(--color-text-muted)]">
          File · max 50 MB
        </span>
        <input
          type="file"
          name="file"
          required
          className="w-full text-[14px] text-text file:mr-4 file:rounded-full file:border file:border-hairline-strong file:bg-bg-elev/60 file:px-4 file:py-2 file:text-[12px] file:uppercase file:tracking-[0.12em] file:text-text hover:file:border-[var(--color-signal)]"
        />
      </label>

      <label className="block space-y-2">
        <span className="block text-[11px] uppercase tracking-[0.14em] text-[var(--color-text-muted)]">
          Display name *
        </span>
        <input
          name="name"
          type="text"
          required
          minLength={2}
          className="w-full border-0 border-b border-hairline bg-transparent pb-2 text-[16px] text-text outline-none transition-colors focus:border-[var(--color-signal)]"
        />
      </label>

      <label className="block space-y-2">
        <span className="block text-[11px] uppercase tracking-[0.14em] text-[var(--color-text-muted)]">
          Kind
        </span>
        <select
          name="kind"
          defaultValue="general"
          className="w-full appearance-none border-0 border-b border-hairline bg-transparent pb-2 text-[16px] text-text outline-none transition-colors focus:border-[var(--color-signal)]"
        >
          {KINDS.map((k) => (
            <option key={k.value} value={k.value} className="bg-bg">
              {k.label}
            </option>
          ))}
        </select>
      </label>

      <label className="block space-y-2 sm:col-span-2">
        <span className="block text-[11px] uppercase tracking-[0.14em] text-[var(--color-text-muted)]">
          Description (optional)
        </span>
        <textarea
          name="description"
          rows={2}
          className="w-full resize-none border-0 border-b border-hairline bg-transparent pb-2 text-[15px] text-text outline-none transition-colors focus:border-[var(--color-signal)]"
        />
      </label>

      <div className="flex items-center justify-between gap-4 sm:col-span-2">
        {state.ok ? (
          <p className="text-[13px] text-[var(--color-signal)]" role="status">
            Document uploaded.
          </p>
        ) : !state.ok && state.error ? (
          <p className="text-[13px] text-[var(--color-signal)]" role="alert">
            {state.error}
          </p>
        ) : (
          <span />
        )}
        <LiquidPillButton type="submit" variant="accent" disabled={pending}>
          {pending ? "Uploading…" : "Upload"}
        </LiquidPillButton>
      </div>
    </form>
  );
}
