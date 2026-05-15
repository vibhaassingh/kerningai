"use client";

import { useActionState, useEffect, useState, useTransition } from "react";

import {
  enrolMfa,
  revokeMfa,
  verifyMfaSetup,
} from "@/lib/mfa/mfa-actions";
import type { ActionResult } from "@/lib/auth/actions";
import type { MfaFactorSummary } from "@/lib/mfa/mfa";

interface MfaEnrolCardProps {
  current: MfaFactorSummary | null;
}

export function MfaEnrolCard({ current }: MfaEnrolCardProps) {
  const [enrolment, setEnrolment] = useState<{
    factorId: string;
    secret: string;
    otpauthUrl: string;
    qrDataUrl: string | null;
    backupCodes: string[];
  } | null>(null);
  const [pending, startTransition] = useTransition();
  const [error, setError] = useState<string | null>(null);

  const [verifyResult, verifyDispatch, verifyPending] = useActionState<
    ActionResult | undefined,
    FormData
  >(verifyMfaSetup, undefined);
  const [revokeResult, revokeDispatch, revokePending] = useActionState<
    ActionResult | undefined,
    FormData
  >(revokeMfa, undefined);

  // After successful verify, drop the temporary enrolment state.
  useEffect(() => {
    if (verifyResult?.ok) setEnrolment(null);
  }, [verifyResult]);

  function startEnrol() {
    setError(null);
    startTransition(async () => {
      const result = await enrolMfa();
      if (!result.ok) {
        setError(result.error);
        return;
      }
      // Generate QR data URL on the client to keep the secret out of
      // any server-rendered HTML cache.
      const QRCode = (await import("qrcode")).default;
      const qrDataUrl = await QRCode.toDataURL(result.data!.otpauthUrl, {
        margin: 1,
        width: 220,
        color: { dark: "#ece9e2", light: "#0c0c0e" },
      });
      setEnrolment({ ...result.data!, qrDataUrl });
    });
  }

  if (current?.status === "active" && !enrolment) {
    return (
      <section className="space-y-4 rounded-2xl border border-hairline bg-bg-elev/30 px-6 py-5">
        <header className="flex items-center justify-between">
          <h3 className="font-display text-[1.05rem] tracking-[-0.01em] text-text">
            Two-factor authentication
          </h3>
          <span className="rounded-full bg-[var(--color-canvas-erp-module)]/15 px-2.5 py-0.5 font-mono text-[10px] uppercase tracking-[0.14em] text-[var(--color-canvas-erp-module)]">
            Active
          </span>
        </header>
        <p className="text-[13px] text-[var(--color-text-faded)]">
          {current.label} enrolled{" "}
          {current.activated_at
            ? `on ${new Date(current.activated_at).toLocaleDateString()}`
            : ""}
          . {current.remaining_backup_codes} backup code
          {current.remaining_backup_codes === 1 ? "" : "s"} remaining.
        </p>
        <form action={revokeDispatch}>
          <input type="hidden" name="factorId" value={current.id} />
          <button
            type="submit"
            disabled={revokePending}
            className="rounded-full border border-[var(--color-canvas-pain)] px-4 py-1.5 font-mono text-[10.5px] uppercase tracking-[0.14em] text-[var(--color-canvas-pain)] hover:bg-[var(--color-canvas-pain)]/10 disabled:opacity-50"
          >
            {revokePending ? "Revoking…" : "Disable 2FA"}
          </button>
          {revokeResult && !revokeResult.ok && (
            <p className="mt-2 font-mono text-[10px] uppercase tracking-[0.14em] text-[var(--color-canvas-pain)]">
              {revokeResult.error}
            </p>
          )}
        </form>
      </section>
    );
  }

  return (
    <section className="space-y-5 rounded-2xl border border-hairline bg-bg-elev/30 px-6 py-5">
      <header className="space-y-1">
        <h3 className="font-display text-[1.05rem] tracking-[-0.01em] text-text">
          Two-factor authentication
        </h3>
        <p className="text-[13px] text-[var(--color-text-faded)]">
          Add an authenticator app (Google Authenticator, 1Password, Authy,
          Raycast) for a second login factor. Recommended for super-admin and
          finance roles.
        </p>
      </header>

      {!enrolment && (
        <button
          type="button"
          onClick={startEnrol}
          disabled={pending}
          className="rounded-full border border-[var(--color-signal-deep)] px-4 py-1.5 font-mono text-[10.5px] uppercase tracking-[0.14em] text-[var(--color-signal-soft)] hover:border-[var(--color-signal)] hover:text-[var(--color-signal)] disabled:opacity-50"
        >
          {pending ? "Generating…" : "Enable 2FA"}
        </button>
      )}

      {enrolment && (
        <div className="space-y-5">
          <div className="grid gap-5 sm:grid-cols-[220px_1fr]">
            {enrolment.qrDataUrl && (
              // Data URL — no benefit from next/image optimization.
              // eslint-disable-next-line @next/next/no-img-element
              <img
                src={enrolment.qrDataUrl}
                alt="Scan with your authenticator app"
                width={220}
                height={220}
                className="rounded-xl border border-hairline"
              />
            )}
            <div className="space-y-2">
              <p className="font-mono text-[10px] uppercase tracking-[0.14em] text-[var(--color-text-muted)]">
                Or paste this secret manually
              </p>
              <code className="block break-all rounded-md border border-hairline bg-bg px-3 py-2 font-mono text-[12px] text-text">
                {enrolment.secret}
              </code>
              <p className="font-mono text-[10px] uppercase tracking-[0.14em] text-[var(--color-text-muted)]">
                Then enter the 6-digit code below
              </p>
            </div>
          </div>

          <div className="space-y-2 rounded-xl border border-[var(--color-signal-deep)] bg-[var(--color-signal)]/5 px-4 py-3">
            <p className="font-mono text-[10px] uppercase tracking-[0.14em] text-[var(--color-signal)]">
              Backup codes — copy these now
            </p>
            <p className="text-[11.5px] text-[var(--color-text-faded)]">
              Store these somewhere safe (1Password, sealed envelope). Each
              code works once if you lose your authenticator. Codes are not
              shown again.
            </p>
            <ul className="grid grid-cols-2 gap-1 font-mono text-[12px] text-text sm:grid-cols-5">
              {enrolment.backupCodes.map((c) => (
                <li key={c}>· {c}</li>
              ))}
            </ul>
          </div>

          <form action={verifyDispatch} className="flex items-end gap-3">
            <input type="hidden" name="factorId" value={enrolment.factorId} />
            <label className="space-y-1.5">
              <span className="font-mono text-[10px] uppercase tracking-[0.14em] text-[var(--color-text-muted)]">
                Verification code
              </span>
              <input
                required
                name="token"
                inputMode="numeric"
                pattern="[0-9]{6}"
                placeholder="123456"
                maxLength={6}
                className="w-32 rounded-md border border-hairline bg-bg px-3 py-2 font-mono text-[14px] text-text"
              />
            </label>
            <button
              type="submit"
              disabled={verifyPending}
              className="rounded-full border border-[var(--color-signal-deep)] px-4 py-1.5 font-mono text-[10.5px] uppercase tracking-[0.14em] text-[var(--color-signal-soft)] hover:border-[var(--color-signal)] hover:text-[var(--color-signal)] disabled:opacity-50"
            >
              {verifyPending ? "Verifying…" : "Activate 2FA"}
            </button>
          </form>

          {verifyResult && !verifyResult.ok && (
            <p className="font-mono text-[10px] uppercase tracking-[0.14em] text-[var(--color-canvas-pain)]">
              {verifyResult.error}
            </p>
          )}
        </div>
      )}

      {error && (
        <p className="font-mono text-[10px] uppercase tracking-[0.14em] text-[var(--color-canvas-pain)]">
          {error}
        </p>
      )}
    </section>
  );
}
