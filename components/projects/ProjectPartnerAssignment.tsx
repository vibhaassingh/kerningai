"use client";

import { useActionState, useEffect, useState } from "react";
import { useRouter } from "next/navigation";

import { setProjectPartner } from "@/lib/projects/project-actions";
import type { ActionResult } from "@/lib/auth/actions";

interface ProjectPartnerAssignmentProps {
  projectId: string;
  organizationId: string;
  currentPartnerOrgId: string | null;
  currentPartnerVisibleToClient: boolean;
  partnerOrgs: { id: string; name: string }[];
}

const initialState: ActionResult = { ok: false, error: "" };

export function ProjectPartnerAssignment({
  projectId,
  organizationId,
  currentPartnerOrgId,
  currentPartnerVisibleToClient,
  partnerOrgs,
}: ProjectPartnerAssignmentProps) {
  const [state, dispatch, pending] = useActionState(
    setProjectPartner,
    initialState,
  );
  const router = useRouter();
  const [selected, setSelected] = useState(currentPartnerOrgId ?? "");

  useEffect(() => {
    if (state.ok) router.refresh();
  }, [state, router]);

  return (
    <section className="space-y-3 rounded-2xl border border-hairline bg-bg-elev/30 p-6">
      <p className="font-mono text-[10px] uppercase tracking-[0.16em] text-[var(--color-signal)]">
        Referring partner
      </p>
      <p className="text-[13px] text-[var(--color-text-faded)]">
        Assign the partner that introduced this project. They&apos;ll see the
        full workflow canvas and can leave remarks (partner + internal only —
        never shown to the client).
      </p>
      <form action={dispatch} className="grid gap-3 sm:grid-cols-[1fr_auto]">
        <input type="hidden" name="projectId" value={projectId} />
        <input type="hidden" name="organizationId" value={organizationId} />
        <select
          name="partnerOrgId"
          value={selected}
          onChange={(e) => setSelected(e.target.value)}
          className="w-full rounded-md border border-hairline bg-bg px-3 py-2 text-[13px] text-text"
        >
          <option value="">— No partner —</option>
          {partnerOrgs.map((p) => (
            <option key={p.id} value={p.id}>
              {p.name}
            </option>
          ))}
        </select>
        <button
          type="submit"
          disabled={pending}
          className="rounded-full border border-[var(--color-signal-deep)] px-4 py-1.5 font-mono text-[10.5px] uppercase tracking-[0.14em] text-[var(--color-signal-soft)] hover:border-[var(--color-signal)] hover:text-[var(--color-signal)] disabled:opacity-50"
        >
          {pending ? "Saving…" : "Save"}
        </button>
        <label className="flex items-center gap-2.5 sm:col-span-2">
          <input
            type="checkbox"
            name="partnerVisibleToClient"
            defaultChecked={currentPartnerVisibleToClient}
            disabled={!selected}
            className="h-4 w-4 rounded border-hairline bg-bg disabled:opacity-40"
          />
          <span className="font-mono text-[10px] uppercase tracking-[0.14em] text-[var(--color-text-muted)]">
            Show partner attribution to client
          </span>
        </label>
      </form>
      {state.ok && (
        <p className="font-mono text-[10px] uppercase tracking-[0.14em] text-[var(--color-signal)]">
          Saved.
        </p>
      )}
      {!state.ok && state.error && (
        <p className="font-mono text-[10px] uppercase tracking-[0.14em] text-[var(--color-canvas-pain)]">
          {state.error}
        </p>
      )}
    </section>
  );
}
