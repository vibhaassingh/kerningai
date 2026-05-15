"use client";

import { useActionState, useEffect, useRef } from "react";
import { useRouter } from "next/navigation";

import { AuthField } from "@/components/auth/AuthField";
import { LiquidPillButton } from "@/components/primitives/LiquidPill";
import { uploadAdminDocument } from "@/lib/admin/document-actions";
import type { ActionResult } from "@/lib/auth/actions";

interface UploadDocumentFormProps {
  clients: { id: string; name: string }[];
}

const initialState: ActionResult<{ documentId: string }> = {
  ok: false,
  error: "",
};

const KINDS = [
  "general",
  "contract",
  "sow",
  "evidence",
  "report",
  "sop",
  "other",
];

export function UploadDocumentForm({ clients }: UploadDocumentFormProps) {
  const [state, formAction, pending] = useActionState(
    uploadAdminDocument,
    initialState,
  );
  const router = useRouter();
  const formRef = useRef<HTMLFormElement | null>(null);

  useEffect(() => {
    if (state.ok) {
      formRef.current?.reset();
      router.refresh();
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
    <form
      ref={formRef}
      action={formAction}
      className="grid gap-6 sm:grid-cols-2"
    >
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
          Kind
        </span>
        <select
          name="kind"
          defaultValue="general"
          className="w-full appearance-none border-0 border-b border-hairline bg-transparent pb-2 text-[16px] text-text outline-none transition-colors focus:border-[var(--color-signal)]"
        >
          {KINDS.map((k) => (
            <option key={k} value={k} className="bg-bg">
              {k}
            </option>
          ))}
        </select>
      </label>

      <AuthField
        label="Display name (optional — defaults to filename)"
        name="name"
        className="sm:col-span-2"
      />

      <label className="block space-y-2 sm:col-span-2">
        <span className="block text-[11px] uppercase tracking-[0.14em] text-[var(--color-text-muted)]">
          File (max 50 MB)
        </span>
        <input
          type="file"
          name="file"
          required
          className="block w-full text-[13px] text-[var(--color-text-faded)] file:mr-4 file:rounded-full file:border file:border-hairline-strong file:bg-bg file:px-4 file:py-2 file:font-mono file:text-[10.5px] file:uppercase file:tracking-[0.14em] file:text-text hover:file:border-[var(--color-signal)]"
        />
        {!state.ok && state.field === "file" && (
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
            Document uploaded.
          </p>
        )}
        <LiquidPillButton
          type="submit"
          variant="accent"
          disabled={pending}
          className="ml-auto"
        >
          {pending ? "Uploading…" : "Upload document"}
        </LiquidPillButton>
      </div>
    </form>
  );
}
