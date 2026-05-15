"use client";

import { useActionState, useEffect } from "react";
import { useRouter } from "next/navigation";

import { AuthField } from "@/components/auth/AuthField";
import { LiquidPillButton } from "@/components/primitives/LiquidPill";
import { convertLeadToPartner } from "@/lib/admin/lead-actions";
import type { ActionResult } from "@/lib/auth/actions";

interface ConvertLeadToPartnerFormProps {
  leadId: string;
  defaultName: string;
  defaultSlug: string;
}

const initialState: ActionResult<{ partnerId: string }> = {
  ok: false,
  error: "",
};

export function ConvertLeadToPartnerForm({
  leadId,
  defaultName,
  defaultSlug,
}: ConvertLeadToPartnerFormProps) {
  const [state, formAction, pending] = useActionState(
    convertLeadToPartner,
    initialState,
  );
  const router = useRouter();

  useEffect(() => {
    if (state.ok && state.data?.partnerId) {
      router.push(`/admin/partners/${state.data.partnerId}`);
    }
  }, [state, router]);

  return (
    <form action={formAction} className="grid gap-6 sm:grid-cols-2">
      <input type="hidden" name="leadId" value={leadId} />

      <AuthField
        label="Partner organisation name"
        name="organizationName"
        defaultValue={defaultName}
        required
        error={
          !state.ok && state.field === "organizationName"
            ? state.error
            : undefined
        }
      />
      <AuthField
        label="Slug"
        name="slug"
        defaultValue={defaultSlug}
        required
        error={!state.ok && state.field === "slug" ? state.error : undefined}
      />

      <div className="sm:col-span-2 flex items-center justify-between gap-4">
        {!state.ok && state.error && !state.field && (
          <p className="text-[13px] text-[var(--color-signal)]" role="alert">
            {state.error}
          </p>
        )}
        {state.ok && (
          <p className="text-[13px] text-[var(--color-signal)]" role="status">
            Partner created. Redirecting…
          </p>
        )}
        <LiquidPillButton type="submit" variant="accent" disabled={pending}>
          {pending ? "Creating…" : "Convert to partner"}
        </LiquidPillButton>
      </div>
    </form>
  );
}
