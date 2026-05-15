"use client";

import { useActionState } from "react";

import { createProject } from "@/lib/projects/project-actions";
import type { ActionResult } from "@/lib/auth/actions";

interface CreateProjectFormProps {
  organizationId: string;
  partnerOrgs?: { id: string; name: string }[];
}

export function CreateProjectForm({
  organizationId,
  partnerOrgs = [],
}: CreateProjectFormProps) {
  const [result, dispatch, pending] = useActionState<
    ActionResult<{ projectId: string; slug: string }> | undefined,
    FormData
  >(createProject, undefined);

  return (
    <form
      action={dispatch}
      className="grid gap-3 rounded-2xl border border-hairline bg-bg-elev/30 p-5 sm:grid-cols-2"
    >
      <input type="hidden" name="organizationId" value={organizationId} />
      <label className="space-y-1.5 sm:col-span-2">
        <span className="font-mono text-[10px] uppercase tracking-[0.14em] text-[var(--color-text-muted)]">
          Project name
        </span>
        <input
          required
          name="name"
          minLength={2}
          maxLength={200}
          placeholder="e.g. ERP + AI Workflow Blueprint"
          className="w-full rounded-md border border-hairline bg-bg px-3 py-2 text-[13px] text-text"
        />
      </label>
      <label className="space-y-1.5">
        <span className="font-mono text-[10px] uppercase tracking-[0.14em] text-[var(--color-text-muted)]">
          Industry label
        </span>
        <input
          name="industryLabel"
          maxLength={120}
          className="w-full rounded-md border border-hairline bg-bg px-3 py-2 text-[13px] text-text"
        />
      </label>
      <label className="space-y-1.5">
        <span className="font-mono text-[10px] uppercase tracking-[0.14em] text-[var(--color-text-muted)]">
          Business label
        </span>
        <input
          name="businessLabel"
          maxLength={200}
          className="w-full rounded-md border border-hairline bg-bg px-3 py-2 text-[13px] text-text"
        />
      </label>
      <label className="space-y-1.5 sm:col-span-2">
        <span className="font-mono text-[10px] uppercase tracking-[0.14em] text-[var(--color-text-muted)]">
          Description
        </span>
        <textarea
          name="description"
          maxLength={2000}
          rows={3}
          className="w-full rounded-md border border-hairline bg-bg px-3 py-2 text-[13px] text-text"
        />
      </label>
      {partnerOrgs.length > 0 && (
        <>
          <label className="space-y-1.5">
            <span className="font-mono text-[10px] uppercase tracking-[0.14em] text-[var(--color-text-muted)]">
              Referring partner (optional)
            </span>
            <select
              name="partnerOrgId"
              defaultValue=""
              className="w-full rounded-md border border-hairline bg-bg px-3 py-2 text-[13px] text-text"
            >
              <option value="">— None —</option>
              {partnerOrgs.map((p) => (
                <option key={p.id} value={p.id}>
                  {p.name}
                </option>
              ))}
            </select>
          </label>
          <label className="flex items-center gap-2.5 self-end pb-2">
            <input
              type="checkbox"
              name="partnerVisibleToClient"
              className="h-4 w-4 rounded border-hairline bg-bg"
            />
            <span className="font-mono text-[10px] uppercase tracking-[0.14em] text-[var(--color-text-muted)]">
              Show partner attribution to client
            </span>
          </label>
        </>
      )}
      <div className="flex items-center justify-between gap-3 sm:col-span-2">
        <p className="font-mono text-[10px] uppercase tracking-[0.14em] text-[var(--color-text-muted)]">
          Status defaults to discovery
        </p>
        <button
          type="submit"
          disabled={pending}
          className="rounded-full border border-[var(--color-signal-deep)] px-4 py-1.5 font-mono text-[10.5px] uppercase tracking-[0.14em] text-[var(--color-signal-soft)] hover:border-[var(--color-signal)] hover:text-[var(--color-signal)] disabled:opacity-50"
        >
          {pending ? "Creating…" : "Create project"}
        </button>
      </div>
      {result && !result.ok && (
        <p className="font-mono text-[10px] uppercase tracking-[0.14em] text-[var(--color-canvas-pain)] sm:col-span-2">
          {result.error}
        </p>
      )}
    </form>
  );
}
