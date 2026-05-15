"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";

import { revokeInvite } from "@/lib/auth/invite-actions";

interface RevokeInviteButtonProps {
  inviteId: string;
}

export function RevokeInviteButton({ inviteId }: RevokeInviteButtonProps) {
  const router = useRouter();
  const [pending, startTransition] = useTransition();
  const [error, setError] = useState<string | null>(null);

  function onClick() {
    setError(null);
    startTransition(async () => {
      const result = await revokeInvite(inviteId);
      if (!result.ok) {
        setError(result.error);
        return;
      }
      router.refresh();
    });
  }

  return (
    <>
      <button
        type="button"
        onClick={onClick}
        disabled={pending}
        className="text-[11px] uppercase tracking-[0.12em] text-[var(--color-text-muted)] underline-offset-2 transition-colors hover:text-[var(--color-signal)] disabled:opacity-50"
      >
        {pending ? "Revoking…" : "Revoke"}
      </button>
      {error && (
        <p className="mt-1 text-[11px] text-[var(--color-signal)]">{error}</p>
      )}
    </>
  );
}
