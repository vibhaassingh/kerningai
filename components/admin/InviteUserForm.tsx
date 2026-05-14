"use client";

import { useActionState, useEffect, useRef } from "react";
import { useRouter } from "next/navigation";

import { AuthField } from "@/components/auth/AuthField";
import { LiquidPillButton } from "@/components/primitives/LiquidPill";
import { inviteUser } from "@/lib/auth/invite-actions";
import type { ActionResult } from "@/lib/auth/actions";

interface InviteUserFormProps {
  organizationId: string;
  organizationLabel: string;
  roles: { slug: string; name: string }[];
}

const initialState: ActionResult<{ inviteId: string }> = { ok: false, error: "" };

export function InviteUserForm({
  organizationId,
  organizationLabel,
  roles,
}: InviteUserFormProps) {
  const [state, formAction, pending] = useActionState(
    inviteUser,
    initialState,
  );
  const router = useRouter();
  const formRef = useRef<HTMLFormElement | null>(null);

  useEffect(() => {
    if (state.ok) {
      formRef.current?.reset();
      router.refresh();
    }
  }, [state, router]);

  return (
    <form ref={formRef} action={formAction} className="grid gap-6 sm:grid-cols-[1fr_1fr_auto] sm:items-end">
      <input type="hidden" name="organizationId" value={organizationId} />

      <AuthField
        label={`Email · ${organizationLabel}`}
        name="email"
        type="email"
        required
        autoComplete="off"
        error={!state.ok && state.field === "email" ? state.error : undefined}
      />

      <label className="block space-y-2">
        <span className="block text-[11px] uppercase tracking-[0.14em] text-[var(--color-text-muted)]">
          Role
        </span>
        <select
          name="roleSlug"
          required
          defaultValue=""
          className="w-full appearance-none border-0 border-b border-hairline bg-transparent pb-2 text-[16px] text-text outline-none transition-colors focus:border-[var(--color-signal)]"
        >
          <option value="" disabled className="bg-bg">
            Pick a role…
          </option>
          {roles.map((r) => (
            <option key={r.slug} value={r.slug} className="bg-bg">
              {r.name}
            </option>
          ))}
        </select>
        {!state.ok && state.field === "roleSlug" && (
          <span className="block text-[12px] text-[var(--color-signal)]">
            {state.error}
          </span>
        )}
      </label>

      <LiquidPillButton type="submit" variant="accent" disabled={pending}>
        {pending ? "Sending…" : "Send invite"}
      </LiquidPillButton>

      <div className="sm:col-span-3">
        {state.ok && (
          <p className="text-[13px] text-[var(--color-signal)]" role="status">
            Invite sent. The recipient will get an email with the next step.
          </p>
        )}
        {!state.ok && state.error && !state.field && (
          <p className="text-[13px] text-[var(--color-signal)]" role="alert">
            {state.error}
          </p>
        )}
      </div>
    </form>
  );
}
