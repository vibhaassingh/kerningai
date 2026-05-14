"use client";

import { useActionState, useEffect } from "react";
import { useRouter } from "next/navigation";

import { AuthField } from "@/components/auth/AuthField";
import { LiquidPillButton } from "@/components/primitives/LiquidPill";
import { convertLeadToClient } from "@/lib/admin/lead-actions";
import type { ActionResult } from "@/lib/auth/actions";

interface ConvertLeadFormProps {
  leadId: string;
  defaultName: string;
  defaultSlug: string;
}

const initialState: ActionResult<{ clientId: string }> = {
  ok: false,
  error: "",
};

export function ConvertLeadForm({
  leadId,
  defaultName,
  defaultSlug,
}: ConvertLeadFormProps) {
  const [state, formAction, pending] = useActionState(
    convertLeadToClient,
    initialState,
  );
  const router = useRouter();

  useEffect(() => {
    if (state.ok && state.data?.clientId) {
      router.push(`/admin/clients/${state.data.clientId}`);
    }
  }, [state, router]);

  return (
    <form action={formAction} className="grid gap-6 sm:grid-cols-2">
      <input type="hidden" name="leadId" value={leadId} />

      <AuthField
        label="Client organization name"
        name="organizationName"
        defaultValue={defaultName}
        required
        error={!state.ok && state.field === "organizationName" ? state.error : undefined}
      />
      <AuthField
        label="Slug"
        name="slug"
        defaultValue={defaultSlug}
        required
        error={!state.ok && state.field === "slug" ? state.error : undefined}
      />
      <AuthField
        label="Industry (optional)"
        name="industry"
        placeholder="hospitality, manufacturing, institutional…"
        error={!state.ok && state.field === "industry" ? state.error : undefined}
      />
      <AuthField
        label="Owner invite (optional)"
        name="ownerEmail"
        type="email"
        placeholder="Defaults to lead's contact email"
        error={!state.ok && state.field === "ownerEmail" ? state.error : undefined}
      />

      <div className="sm:col-span-2 flex items-center justify-between gap-4">
        {!state.ok && state.error && !state.field && (
          <p className="text-[13px] text-[var(--color-signal)]" role="alert">
            {state.error}
          </p>
        )}
        {state.ok && (
          <p className="text-[13px] text-[var(--color-signal)]" role="status">
            Client created. Redirecting…
          </p>
        )}
        <LiquidPillButton type="submit" variant="accent" disabled={pending}>
          {pending ? "Creating…" : "Convert to client"}
        </LiquidPillButton>
      </div>
    </form>
  );
}
