"use client";

import { useActionState, useEffect } from "react";
import { useRouter } from "next/navigation";

import { AuthField } from "@/components/auth/AuthField";
import { LiquidPillButton } from "@/components/primitives/LiquidPill";
import { updatePartnerOrg } from "@/lib/admin/partner-org-actions";
import type { ActionResult } from "@/lib/auth/actions";

interface EditPartnerFormProps {
  partner: {
    id: string;
    name: string;
    slug: string;
    billing_email: string | null;
    region: string;
    status: "active" | "suspended" | "archived";
  };
}

const initialState: ActionResult = { ok: false, error: "" };

export function EditPartnerForm({ partner }: EditPartnerFormProps) {
  const [state, formAction, pending] = useActionState(
    updatePartnerOrg,
    initialState,
  );
  const router = useRouter();

  useEffect(() => {
    if (state.ok) router.refresh();
  }, [state, router]);

  return (
    <form action={formAction} className="grid gap-6 sm:grid-cols-2">
      <input type="hidden" name="partnerId" value={partner.id} />

      <AuthField
        label="Partner organisation name"
        name="name"
        defaultValue={partner.name}
        required
        error={!state.ok && state.field === "name" ? state.error : undefined}
      />
      <AuthField
        label="Slug"
        name="slug"
        defaultValue={partner.slug}
        required
        error={!state.ok && state.field === "slug" ? state.error : undefined}
      />
      <AuthField
        label="Billing / contact email"
        name="billingEmail"
        type="email"
        defaultValue={partner.billing_email ?? ""}
        placeholder="ops@partner.example.com"
        error={
          !state.ok && state.field === "billingEmail" ? state.error : undefined
        }
      />
      <AuthField
        label="Region"
        name="region"
        defaultValue={partner.region}
        required
        error={!state.ok && state.field === "region" ? state.error : undefined}
      />

      <label className="block space-y-2 sm:col-span-2">
        <span className="block text-[11px] uppercase tracking-[0.14em] text-[var(--color-text-muted)]">
          Status
        </span>
        <select
          name="status"
          defaultValue={partner.status}
          className="w-full appearance-none border-0 border-b border-hairline bg-transparent pb-2 text-[16px] text-text outline-none transition-colors focus:border-[var(--color-signal)]"
        >
          <option value="active" className="bg-bg">
            Active — can sign in and refer
          </option>
          <option value="suspended" className="bg-bg">
            Suspended — access paused
          </option>
          <option value="archived" className="bg-bg">
            Archived — kept for history, hidden from pickers
          </option>
        </select>
      </label>

      <div className="sm:col-span-2 flex items-center justify-between gap-4">
        {!state.ok && state.error && !state.field && (
          <p className="text-[13px] text-[var(--color-signal)]" role="alert">
            {state.error}
          </p>
        )}
        {state.ok && (
          <p className="text-[13px] text-[var(--color-signal)]" role="status">
            Saved.
          </p>
        )}
        <LiquidPillButton
          type="submit"
          variant="accent"
          disabled={pending}
          className="ml-auto"
        >
          {pending ? "Saving…" : "Save changes"}
        </LiquidPillButton>
      </div>
    </form>
  );
}
