"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";

import { GoogleConnectButton } from "@/components/auth/GoogleConnectButton";
import { linkGoogleStart, unlinkGoogle } from "@/lib/auth/actions";

interface ConnectedAccountsActionsProps {
  googleLinked: boolean;
  hasPassword: boolean;
}

export function ConnectedAccountsActions({
  googleLinked,
  hasPassword,
}: ConnectedAccountsActionsProps) {
  const router = useRouter();
  const [error, setError] = useState<string | null>(null);
  const [pending, startTransition] = useTransition();

  async function onLink() {
    setError(null);
    const result = await linkGoogleStart();
    if (!result.ok) {
      setError(result.error);
      return;
    }
    window.location.assign(result.data!.url);
  }

  function onUnlink() {
    setError(null);
    startTransition(async () => {
      const result = await unlinkGoogle();
      if (!result.ok) {
        setError(result.error);
        return;
      }
      router.refresh();
    });
  }

  return (
    <div className="space-y-3">
      {googleLinked ? (
        <>
          <button
            type="button"
            onClick={onUnlink}
            disabled={pending || !hasPassword}
            className="rounded-full border border-hairline-strong px-5 py-2.5 text-[13px] text-text transition-colors hover:border-[var(--color-signal)] disabled:opacity-50 disabled:hover:border-hairline-strong"
          >
            {pending ? "Disconnecting…" : "Disconnect Google"}
          </button>
          {!hasPassword && (
            <p className="text-[12px] text-[var(--color-text-muted)]">
              Set a password first so you keep at least one way to sign in.
            </p>
          )}
        </>
      ) : (
        <GoogleConnectButton onClick={onLink} label="Link Google account" />
      )}

      {error && (
        <p className="text-[12px] text-[var(--color-signal)]" role="alert">
          {error}
        </p>
      )}
    </div>
  );
}
