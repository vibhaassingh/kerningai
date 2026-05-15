"use client";

import { useActionState, useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";

import { AuthField } from "@/components/auth/AuthField";
import { LiquidPillButton } from "@/components/primitives/LiquidPill";
import { createPartnerOrg } from "@/lib/admin/partner-org-actions";
import type { ActionResult } from "@/lib/auth/actions";

const initialState: ActionResult<{ partnerId: string }> = {
  ok: false,
  error: "",
};

function slugify(s: string): string {
  return s
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .slice(0, 48);
}

export function CreatePartnerForm() {
  const [state, formAction, pending] = useActionState(
    createPartnerOrg,
    initialState,
  );
  const router = useRouter();
  const [name, setName] = useState("");
  const [slug, setSlug] = useState("");
  const slugTouched = useRef(false);

  useEffect(() => {
    if (state.ok && state.data?.partnerId) {
      router.push(`/admin/partners/${state.data.partnerId}`);
    }
  }, [state, router]);

  return (
    <form action={formAction} className="grid gap-6 sm:grid-cols-2">
      <AuthField
        label="Partner organisation name"
        name="name"
        value={name}
        onChange={(e) => {
          setName(e.target.value);
          if (!slugTouched.current) setSlug(slugify(e.target.value));
        }}
        required
        placeholder="e.g. Avinash Group — Partner Referral"
        error={!state.ok && state.field === "name" ? state.error : undefined}
      />
      <AuthField
        label="Slug"
        name="slug"
        value={slug}
        onChange={(e) => {
          slugTouched.current = true;
          setSlug(e.target.value);
        }}
        required
        placeholder="avinash-partner"
        error={!state.ok && state.field === "slug" ? state.error : undefined}
      />
      <AuthField
        label="Billing / contact email (optional)"
        name="billingEmail"
        type="email"
        placeholder="ops@partner.example.com"
        error={
          !state.ok && state.field === "billingEmail" ? state.error : undefined
        }
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
          {pending ? "Creating…" : "Create partner organisation"}
        </LiquidPillButton>
      </div>
    </form>
  );
}
