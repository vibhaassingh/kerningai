"use client";

import Link from "next/link";
import { useActionState } from "react";

import { AuthField } from "@/components/auth/AuthField";
import { LiquidPillButton } from "@/components/primitives/LiquidPill";
import { requestPasswordReset, type ActionResult } from "@/lib/auth/actions";

const initialState: ActionResult = { ok: false, error: "" };

export function ForgotPasswordForm() {
  const [state, formAction, pending] = useActionState(
    requestPasswordReset,
    initialState,
  );

  if (state.ok) {
    return (
      <div className="space-y-6">
        <p className="text-[15px] text-[var(--color-text-faded)]">
          If an account with that email exists, a reset link has been sent.
          Check your inbox.
        </p>
        <Link
          href="/login"
          className="nav-link text-[12px] uppercase tracking-[0.12em] text-[var(--color-text-muted)]"
        >
          Back to sign in
        </Link>
      </div>
    );
  }

  return (
    <form action={formAction} className="space-y-8">
      <AuthField
        label="Email"
        name="email"
        type="email"
        autoComplete="email"
        required
        error={!state.ok && state.field === "email" ? state.error : undefined}
      />

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
          {pending ? "Sending…" : "Send reset link"}
        </LiquidPillButton>
      </div>
    </form>
  );
}
