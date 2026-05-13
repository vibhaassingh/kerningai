"use client";

import Link from "next/link";
import { useActionState, useState } from "react";

import { AuthField } from "@/components/auth/AuthField";
import { GoogleConnectButton } from "@/components/auth/GoogleConnectButton";
import { LiquidPillButton } from "@/components/primitives/LiquidPill";
import {
  signInWithGoogle,
  signInWithPassword,
  type ActionResult,
} from "@/lib/auth/actions";

interface LoginFormProps {
  returnTo?: string;
  googleEnabled: boolean;
}

const initialState: ActionResult = { ok: false, error: "" };

export function LoginForm({ returnTo, googleEnabled }: LoginFormProps) {
  const [state, formAction, pending] = useActionState(
    signInWithPassword,
    initialState,
  );
  const [googleError, setGoogleError] = useState<string | null>(null);

  async function onGoogle() {
    setGoogleError(null);
    const result = await signInWithGoogle(returnTo);
    if (!result.ok) {
      setGoogleError(result.error);
      return;
    }
    window.location.assign(result.data!.url);
  }

  return (
    <form action={formAction} className="space-y-8">
      {returnTo && (
        <input type="hidden" name="returnTo" value={returnTo} />
      )}

      <div className="space-y-6">
        <AuthField
          label="Email"
          name="email"
          type="email"
          autoComplete="email"
          required
          error={!state.ok && state.field === "email" ? state.error : undefined}
        />
        <AuthField
          label="Password"
          name="password"
          type="password"
          autoComplete="current-password"
          required
          error={!state.ok && state.field === "password" ? state.error : undefined}
        />
      </div>

      {!state.ok && state.error && !state.field && (
        <p className="text-[13px] text-[var(--color-signal)]" role="alert">
          {state.error}
        </p>
      )}

      <div className="flex items-center justify-between gap-4 pt-2">
        <Link
          href="/forgot-password"
          className="nav-link text-[12px] uppercase tracking-[0.12em] text-[var(--color-text-muted)]"
        >
          Forgot password
        </Link>
        <LiquidPillButton type="submit" variant="accent" disabled={pending}>
          {pending ? "Signing in…" : "Sign in"}
        </LiquidPillButton>
      </div>

      {googleEnabled && (
        <div className="space-y-3 pt-6">
          <div className="flex items-center gap-3 text-[11px] uppercase tracking-[0.16em] text-[var(--color-text-faint)]">
            <span className="h-px flex-1 bg-hairline" />
            or
            <span className="h-px flex-1 bg-hairline" />
          </div>
          <GoogleConnectButton onClick={onGoogle} label="Continue with Google" />
          {googleError && (
            <p className="text-[12px] text-[var(--color-signal)]">
              {googleError}
            </p>
          )}
        </div>
      )}
    </form>
  );
}
