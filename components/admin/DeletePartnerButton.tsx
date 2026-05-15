"use client";

import { useActionState, useEffect, useState } from "react";
import { useRouter } from "next/navigation";

import { deletePartnerOrg } from "@/lib/admin/partner-org-actions";
import type { ActionResult } from "@/lib/auth/actions";

interface DeletePartnerButtonProps {
  partnerId: string;
  partnerName: string;
}

const initialState: ActionResult = { ok: false, error: "" };

export function DeletePartnerButton({
  partnerId,
  partnerName,
}: DeletePartnerButtonProps) {
  const [state, formAction, pending] = useActionState(
    deletePartnerOrg,
    initialState,
  );
  const router = useRouter();
  const [armed, setArmed] = useState(false);

  useEffect(() => {
    if (state.ok) router.push("/admin/partners");
  }, [state, router]);

  if (!armed) {
    return (
      <button
        type="button"
        onClick={() => setArmed(true)}
        className="rounded-full border border-[var(--color-canvas-pain)] px-4 py-1.5 font-mono text-[10.5px] uppercase tracking-[0.14em] text-[var(--color-canvas-pain)] hover:bg-[var(--color-canvas-pain)]/10"
      >
        Delete partner
      </button>
    );
  }

  return (
    <form action={formAction} className="space-y-3">
      <input type="hidden" name="partnerId" value={partnerId} />
      <p className="text-[13px] text-[var(--color-text-faded)]">
        This removes <span className="text-text">{partnerName}</span> from every
        partner list, picker and dashboard. It&apos;s reversible — a deleted
        partner can be restored from the Partners page. Referred projects keep
        their attribution. Type{" "}
        <span className="font-mono text-[var(--color-canvas-pain)]">DELETE</span>{" "}
        to confirm.
      </p>
      <div className="flex flex-wrap items-center gap-3">
        <input
          name="confirm"
          autoComplete="off"
          placeholder="DELETE"
          className="w-40 rounded-md border border-hairline-strong bg-bg px-3 py-2 font-mono text-[13px] uppercase tracking-[0.14em] text-text"
        />
        <button
          type="submit"
          disabled={pending}
          className="rounded-full border border-[var(--color-canvas-pain)] bg-[var(--color-canvas-pain)]/10 px-4 py-1.5 font-mono text-[10.5px] uppercase tracking-[0.14em] text-[var(--color-canvas-pain)] hover:bg-[var(--color-canvas-pain)]/20 disabled:opacity-50"
        >
          {pending ? "Deleting…" : "Confirm delete"}
        </button>
        <button
          type="button"
          onClick={() => setArmed(false)}
          className="font-mono text-[10.5px] uppercase tracking-[0.14em] text-[var(--color-text-muted)] hover:text-text"
        >
          Cancel
        </button>
      </div>
      {!state.ok && state.error && (
        <p className="font-mono text-[10px] uppercase tracking-[0.14em] text-[var(--color-canvas-pain)]">
          {state.error}
        </p>
      )}
    </form>
  );
}
