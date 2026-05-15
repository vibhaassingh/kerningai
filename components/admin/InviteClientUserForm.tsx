"use client";

import { useActionState, useEffect, useRef } from "react";
import { useRouter } from "next/navigation";

import { AuthField } from "@/components/auth/AuthField";
import { LiquidPillButton } from "@/components/primitives/LiquidPill";
import { inviteUser } from "@/lib/auth/invite-actions";
import type { ActionResult } from "@/lib/auth/actions";

interface InviteClientUserFormProps {
  /** All client orgs an admin may invite into. */
  clients: { id: string; name: string }[];
  /** Selectable client roles. */
  roles: { slug: string; name: string }[];
}

const initialState: ActionResult<{ inviteId: string }> = {
  ok: false,
  error: "",
};

/**
 * One-screen client invite: pick the client org, the role, type an email,
 * send. Same `inviteUser` Server Action as the per-client People tab —
 * this just removes the navigate-into-a-client step.
 */
export function InviteClientUserForm({
  clients,
  roles,
}: InviteClientUserFormProps) {
  const [state, formAction, pending] = useActionState(inviteUser, initialState);
  const router = useRouter();
  const formRef = useRef<HTMLFormElement | null>(null);

  useEffect(() => {
    if (state.ok) {
      formRef.current?.reset();
      router.refresh();
    }
  }, [state, router]);

  if (clients.length === 0) {
    return (
      <p className="rounded-2xl border border-hairline bg-bg-elev/30 px-5 py-4 text-[13px] text-[var(--color-text-muted)]">
        No client organisations yet. Convert a lead to a client first.
      </p>
    );
  }

  return (
    <form
      ref={formRef}
      action={formAction}
      className="grid gap-6 sm:grid-cols-2"
    >
      <label className="block space-y-2">
        <span className="block text-[11px] uppercase tracking-[0.14em] text-[var(--color-text-muted)]">
          Client organisation
        </span>
        <select
          name="organizationId"
          required
          defaultValue=""
          className="w-full appearance-none border-0 border-b border-hairline bg-transparent pb-2 text-[16px] text-text outline-none transition-colors focus:border-[var(--color-signal)]"
        >
          <option value="" disabled className="bg-bg">
            Pick a client…
          </option>
          {clients.map((c) => (
            <option key={c.id} value={c.id} className="bg-bg">
              {c.name}
            </option>
          ))}
        </select>
        {!state.ok && state.field === "organizationId" && (
          <span className="block text-[12px] text-[var(--color-signal)]">
            {state.error}
          </span>
        )}
      </label>

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

      <AuthField
        label="Email"
        name="email"
        type="email"
        required
        autoComplete="off"
        className="sm:col-span-2"
        error={!state.ok && state.field === "email" ? state.error : undefined}
      />

      <div className="sm:col-span-2 flex items-center justify-between gap-4">
        {state.ok && (
          <p className="text-[13px] text-[var(--color-signal)]" role="status">
            Invite sent. They&apos;ll get an email with a single-use link.
          </p>
        )}
        {!state.ok && state.error && !state.field && (
          <p className="text-[13px] text-[var(--color-signal)]" role="alert">
            {state.error}
          </p>
        )}
        <LiquidPillButton
          type="submit"
          variant="accent"
          disabled={pending}
          className="ml-auto"
        >
          {pending ? "Sending…" : "Send client invite"}
        </LiquidPillButton>
      </div>
    </form>
  );
}
