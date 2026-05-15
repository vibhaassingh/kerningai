"use client";

import { useActionState } from "react";

import { AuthField } from "@/components/auth/AuthField";
import { LiquidPillButton } from "@/components/primitives/LiquidPill";
import { acceptInvite } from "@/lib/auth/invite-actions";
import type { ActionResult } from "@/lib/auth/actions";

const initialState: ActionResult = { ok: false, error: "" };

interface AcceptInviteFormProps {
  token: string;
  email: string;
}

export function AcceptInviteForm({ token, email }: AcceptInviteFormProps) {
  const [state, formAction, pending] = useActionState(
    acceptInvite,
    initialState,
  );

  return (
    <form action={formAction} className="space-y-8">
      <input type="hidden" name="token" value={token} />

      <AuthField
        label="Email"
        name="email"
        type="email"
        value={email}
        readOnly
        autoComplete="email"
      />

      <AuthField
        label="Full name"
        name="fullName"
        type="text"
        autoComplete="name"
        required
        error={!state.ok && state.field === "fullName" ? state.error : undefined}
      />

      <AuthField
        label="Choose a password"
        name="password"
        type="password"
        autoComplete="new-password"
        required
        minLength={12}
        error={!state.ok && state.field === "password" ? state.error : undefined}
      />

      <p className="text-[12px] text-[var(--color-text-muted)]">
        Minimum 12 characters with upper, lower, and a number.
      </p>

      {!state.ok && state.error && !state.field && (
        <p className="text-[13px] text-[var(--color-signal)]" role="alert">
          {state.error}
        </p>
      )}

      <div className="flex justify-end">
        <LiquidPillButton type="submit" variant="accent" disabled={pending}>
          {pending ? "Setting up…" : "Accept invite"}
        </LiquidPillButton>
      </div>
    </form>
  );
}
