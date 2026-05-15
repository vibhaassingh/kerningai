"use client";

import { useActionState, useEffect, useRef } from "react";
import { useRouter } from "next/navigation";

import { AuthField } from "@/components/auth/AuthField";
import { LiquidPillButton } from "@/components/primitives/LiquidPill";
import { createSite } from "@/lib/admin/site-actions";
import type { ActionResult } from "@/lib/auth/actions";

interface CreateSiteFormProps {
  clientId: string;
}

const initialState: ActionResult = { ok: false, error: "" };

const DEPLOYMENT_OPTIONS = [
  { value: "cloud", label: "Cloud" },
  { value: "sovereign_cloud", label: "Sovereign cloud" },
  { value: "on_prem", label: "On-prem" },
  { value: "air_gapped", label: "Air-gapped" },
];

export function CreateSiteForm({ clientId }: CreateSiteFormProps) {
  const [state, formAction, pending] = useActionState(
    createSite,
    initialState,
  );
  const router = useRouter();
  const ref = useRef<HTMLFormElement | null>(null);

  useEffect(() => {
    if (state.ok) {
      ref.current?.reset();
      router.refresh();
    }
  }, [state, router]);

  return (
    <form
      ref={ref}
      action={formAction}
      className="grid gap-6 sm:grid-cols-2"
    >
      <input type="hidden" name="clientId" value={clientId} />

      <AuthField
        label="Name"
        name="name"
        required
        autoComplete="off"
        error={!state.ok && state.field === "name" ? state.error : undefined}
      />
      <AuthField
        label="Slug"
        name="slug"
        required
        autoComplete="off"
        placeholder="e.g. hotel-kitchen-01"
        error={!state.ok && state.field === "slug" ? state.error : undefined}
      />
      <AuthField
        label="Region"
        name="region"
        required
        defaultValue="eu-central-1"
        autoComplete="off"
        error={!state.ok && state.field === "region" ? state.error : undefined}
      />
      <AuthField
        label="Timezone"
        name="timezone"
        required
        defaultValue="Europe/Amsterdam"
        autoComplete="off"
        error={!state.ok && state.field === "timezone" ? state.error : undefined}
      />
      <label className="block space-y-2">
        <span className="block text-[11px] uppercase tracking-[0.14em] text-[var(--color-text-muted)]">
          Deployment type
        </span>
        <select
          name="deploymentType"
          defaultValue=""
          className="w-full appearance-none border-0 border-b border-hairline bg-transparent pb-2 text-[16px] text-text outline-none transition-colors focus:border-[var(--color-signal)]"
        >
          <option value="" className="bg-bg">
            Inherit from client
          </option>
          {DEPLOYMENT_OPTIONS.map((o) => (
            <option key={o.value} value={o.value} className="bg-bg">
              {o.label}
            </option>
          ))}
        </select>
      </label>
      <AuthField
        label="City"
        name="city"
        autoComplete="off"
        error={!state.ok && state.field === "city" ? state.error : undefined}
      />
      <AuthField
        label="Country (ISO-2)"
        name="country"
        autoComplete="off"
        placeholder="NL, DE, IN…"
        error={!state.ok && state.field === "country" ? state.error : undefined}
      />

      <div className="sm:col-span-2 flex items-center justify-between gap-4">
        {state.ok ? (
          <p className="text-[13px] text-[var(--color-signal)]" role="status">
            Site added.
          </p>
        ) : state.error && !state.field ? (
          <p className="text-[13px] text-[var(--color-signal)]" role="alert">
            {state.error}
          </p>
        ) : (
          <span />
        )}
        <LiquidPillButton type="submit" variant="accent" disabled={pending}>
          {pending ? "Saving…" : "Add site"}
        </LiquidPillButton>
      </div>
    </form>
  );
}
