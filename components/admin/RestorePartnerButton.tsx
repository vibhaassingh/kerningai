"use client";

import { useActionState, useEffect } from "react";
import { useRouter } from "next/navigation";

import { restorePartnerOrg } from "@/lib/admin/partner-org-actions";
import type { ActionResult } from "@/lib/auth/actions";

interface RestorePartnerButtonProps {
  partnerId: string;
  /** Where to send the user after a successful restore. */
  redirectTo?: string;
}

const initialState: ActionResult = { ok: false, error: "" };

export function RestorePartnerButton({
  partnerId,
  redirectTo,
}: RestorePartnerButtonProps) {
  const [state, formAction, pending] = useActionState(
    restorePartnerOrg,
    initialState,
  );
  const router = useRouter();

  useEffect(() => {
    if (state.ok) {
      if (redirectTo) router.push(redirectTo);
      else router.refresh();
    }
  }, [state, router, redirectTo]);

  return (
    <form action={formAction} className="inline-flex items-center gap-3">
      <input type="hidden" name="partnerId" value={partnerId} />
      <button
        type="submit"
        disabled={pending}
        className="rounded-full border border-[var(--color-signal-deep)] px-4 py-1.5 font-mono text-[10.5px] uppercase tracking-[0.14em] text-[var(--color-signal-soft)] hover:border-[var(--color-signal)] hover:text-[var(--color-signal)] disabled:opacity-50"
      >
        {pending ? "Restoring…" : "Restore"}
      </button>
      {!state.ok && state.error && (
        <span className="font-mono text-[10px] uppercase tracking-[0.14em] text-[var(--color-canvas-pain)]">
          {state.error}
        </span>
      )}
    </form>
  );
}
