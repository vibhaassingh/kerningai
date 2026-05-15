"use client";

import { useActionState, useEffect, useRef } from "react";

import { AuthField } from "@/components/auth/AuthField";
import { LiquidPillButton } from "@/components/primitives/LiquidPill";
import { Eyebrow } from "@/components/primitives/Eyebrow";
import { changePassword, type ActionResult } from "@/lib/auth/actions";

const initialState: ActionResult = { ok: false, error: "" };

export function ChangePasswordForm() {
  const [state, formAction, pending] = useActionState(
    changePassword,
    initialState,
  );
  const formRef = useRef<HTMLFormElement | null>(null);

  // Reset the form on success.
  useEffect(() => {
    if (state.ok) formRef.current?.reset();
  }, [state]);

  return (
    <section className="rounded-2xl border border-hairline bg-bg-elev/30 p-8">
      <header className="space-y-2">
        <Eyebrow number="01">Password</Eyebrow>
        <h2 className="text-display text-[clamp(1.4rem,3vw,1.8rem)] font-medium tracking-[-0.02em]">
          Change password.
        </h2>
        <p className="text-[14px] text-[var(--color-text-faded)]">
          You'll be asked for your current password before setting a new one.
        </p>
      </header>

      <form ref={formRef} action={formAction} className="mt-8 space-y-6">
        <AuthField
          label="Current password"
          name="currentPassword"
          type="password"
          autoComplete="current-password"
          required
          error={!state.ok && state.field === "currentPassword" ? state.error : undefined}
        />
        <AuthField
          label="New password"
          name="newPassword"
          type="password"
          autoComplete="new-password"
          required
          minLength={12}
          error={!state.ok && state.field === "newPassword" ? state.error : undefined}
        />

        <p className="text-[12px] text-[var(--color-text-muted)]">
          Minimum 12 characters with upper, lower, and a number.
        </p>

        {state.ok && (
          <p className="text-[13px] text-[var(--color-signal)]" role="status">
            Password updated. Other sessions remain active.
          </p>
        )}
        {!state.ok && state.error && !state.field && (
          <p className="text-[13px] text-[var(--color-signal)]" role="alert">
            {state.error}
          </p>
        )}

        <div className="flex justify-end">
          <LiquidPillButton type="submit" variant="accent" disabled={pending}>
            {pending ? "Saving…" : "Update password"}
          </LiquidPillButton>
        </div>
      </form>
    </section>
  );
}
