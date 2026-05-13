"use client";

import Link from "next/link";
import { useActionState } from "react";

import { AuthField } from "@/components/auth/AuthField";
import { LiquidPillButton } from "@/components/primitives/LiquidPill";
import { resetPassword, type ActionResult } from "@/lib/auth/actions";

const initialState: ActionResult = { ok: false, error: "" };

export function ResetPasswordForm() {
  const [state, formAction, pending] = useActionState(
    resetPassword,
    initialState,
  );

  return (
    <form action={formAction} className="space-y-8">
      <AuthField
        label="New password"
        name="password"
        type="password"
        autoComplete="new-password"
        required
        minLength={12}
        error={!state.ok && state.field === "password" ? state.error : undefined}
      />

      <p className="text-[12px] text-[var(--color-text-muted)]">
        Use at least 12 characters with a mix of upper- and lower-case
        letters and a number.
      </p>

      {!state.ok && state.error && !state.field && (
        <p className="text-[13px] text-[var(--color-signal)]" role="alert">
          {state.error}
        </p>
      )}

      <div className="flex items-center justify-between gap-4">
        <Link
          href="/login"
          className="nav-link text-[12px] uppercase tracking-[0.12em] text-[var(--color-text-muted)]"
        >
          Back to sign in
        </Link>
        <LiquidPillButton type="submit" variant="accent" disabled={pending}>
          {pending ? "Saving…" : "Set new password"}
        </LiquidPillButton>
      </div>
    </form>
  );
}
