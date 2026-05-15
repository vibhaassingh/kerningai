"use client";

import { useActionState, useEffect, useRef } from "react";
import { useRouter } from "next/navigation";

import { addPartnerCanvasRemark } from "@/lib/partner/partner-actions";
import type { ActionResult } from "@/lib/auth/actions";

interface PartnerRemarkFormProps {
  projectId: string;
  canvasId: string;
}

const initialState: ActionResult = { ok: false, error: "" };

export function PartnerRemarkForm({
  projectId,
  canvasId,
}: PartnerRemarkFormProps) {
  const [state, dispatch, pending] = useActionState(
    addPartnerCanvasRemark,
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

  return (
    <form
      ref={formRef}
      action={dispatch}
      className="space-y-3 rounded-2xl border border-hairline bg-bg-elev/30 p-5"
    >
      <input type="hidden" name="projectId" value={projectId} />
      <input type="hidden" name="canvasId" value={canvasId} />
      <label className="space-y-1.5">
        <span className="font-mono text-[10px] uppercase tracking-[0.16em] text-[var(--color-signal)]">
          Add a remark
        </span>
        <p className="text-[12px] text-[var(--color-text-muted)]">
          Visible to your team and Kerning staff only — the client never
          sees partner remarks.
        </p>
        <textarea
          name="body"
          required
          rows={3}
          maxLength={2000}
          placeholder="Context, risks, or anything Kerning should know about this workflow…"
          className="w-full rounded-md border border-hairline bg-bg px-3 py-2 text-[13px] text-text"
        />
      </label>
      <div className="flex items-center justify-between gap-3">
        {!state.ok && state.error && (
          <p className="font-mono text-[10px] uppercase tracking-[0.14em] text-[var(--color-canvas-pain)]">
            {state.error}
          </p>
        )}
        {state.ok && (
          <p className="font-mono text-[10px] uppercase tracking-[0.14em] text-[var(--color-signal)]">
            Remark added.
          </p>
        )}
        <button
          type="submit"
          disabled={pending}
          className="ml-auto rounded-full border border-[var(--color-signal-deep)] px-4 py-1.5 font-mono text-[10.5px] uppercase tracking-[0.14em] text-[var(--color-signal-soft)] hover:border-[var(--color-signal)] hover:text-[var(--color-signal)] disabled:opacity-50"
        >
          {pending ? "Posting…" : "Post remark"}
        </button>
      </div>
    </form>
  );
}
