"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";

import { resendInvite } from "@/lib/auth/invite-actions";

interface ResendInviteButtonProps {
  inviteId: string;
}

export function ResendInviteButton({ inviteId }: ResendInviteButtonProps) {
  const router = useRouter();
  const [pending, startTransition] = useTransition();
  const [error, setError] = useState<string | null>(null);
  const [link, setLink] = useState<string | null>(null);
  const [copied, setCopied] = useState(false);

  function onClick() {
    setError(null);
    setCopied(false);
    startTransition(async () => {
      const result = await resendInvite(inviteId);
      if (!result.ok) {
        setError(result.error);
        return;
      }
      setLink(result.data?.acceptUrl ?? null);
      router.refresh();
    });
  }

  async function copy() {
    if (!link) return;
    try {
      await navigator.clipboard.writeText(link);
      setCopied(true);
    } catch {
      setCopied(false);
    }
  }

  return (
    <span className="inline-flex flex-col items-end gap-1">
      <span className="inline-flex items-center gap-3">
        <button
          type="button"
          onClick={onClick}
          disabled={pending}
          className="text-[11px] uppercase tracking-[0.12em] text-[var(--color-text-muted)] underline-offset-2 transition-colors hover:text-[var(--color-signal)] disabled:opacity-50"
        >
          {pending ? "Sending…" : link ? "Resent ✓" : "Resend"}
        </button>
        {link && (
          <button
            type="button"
            onClick={copy}
            className="text-[11px] uppercase tracking-[0.12em] text-[var(--color-text-muted)] underline-offset-2 transition-colors hover:text-[var(--color-signal)]"
          >
            {copied ? "Copied" : "Copy link"}
          </button>
        )}
      </span>
      {error && (
        <span className="text-[11px] text-[var(--color-signal)]">{error}</span>
      )}
    </span>
  );
}
