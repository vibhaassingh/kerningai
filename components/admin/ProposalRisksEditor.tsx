"use client";

import { useActionState, useEffect, useState } from "react";
import { useRouter } from "next/navigation";

import { saveProposalRisks } from "@/lib/admin/proposal-actions";
import type { ActionResult } from "@/lib/auth/actions";

type Severity = "low" | "medium" | "high" | "critical";
interface Risk {
  category: string;
  description: string;
  severity: Severity;
  mitigation: string | null;
}

const SEV: Severity[] = ["low", "medium", "high", "critical"];
const initialState: ActionResult = { ok: false, error: "" };
const cell =
  "w-full rounded-md border border-hairline bg-bg px-2 py-1.5 text-[13px] text-text outline-none focus:border-[var(--color-signal-deep)]";
const lbl =
  "font-mono text-[9.5px] uppercase tracking-[0.14em] text-[var(--color-text-faint)]";

export function ProposalRisksEditor({
  proposalId,
  risks: initial,
}: {
  proposalId: string;
  risks: Risk[];
}) {
  const [state, formAction, pending] = useActionState(
    saveProposalRisks,
    initialState,
  );
  const router = useRouter();
  const [rows, setRows] = useState<Risk[]>(initial);

  useEffect(() => {
    if (state.ok) router.refresh();
  }, [state, router]);

  function patch(i: number, next: Partial<Risk>) {
    setRows((p) => p.map((r, idx) => (idx === i ? { ...r, ...next } : r)));
  }

  return (
    <form action={formAction} className="space-y-4">
      <input type="hidden" name="proposalId" value={proposalId} />
      <input type="hidden" name="rows" value={JSON.stringify(rows)} />

      <ul className="space-y-3">
        {rows.map((r, i) => (
          <li
            key={i}
            className="grid gap-3 rounded-2xl border border-hairline bg-bg-elev/30 p-5 sm:grid-cols-[1fr_140px]"
          >
            <div className="space-y-1">
              <span className={lbl}>Category</span>
              <input
                className={cell}
                value={r.category}
                onChange={(e) => patch(i, { category: e.target.value })}
              />
            </div>
            <div className="space-y-1">
              <span className={lbl}>Severity</span>
              <select
                className={cell}
                value={r.severity}
                onChange={(e) =>
                  patch(i, { severity: e.target.value as Severity })
                }
              >
                {SEV.map((s) => (
                  <option key={s} value={s}>
                    {s}
                  </option>
                ))}
              </select>
            </div>
            <div className="space-y-1 sm:col-span-2">
              <span className={lbl}>Description</span>
              <textarea
                className={cell}
                rows={2}
                value={r.description}
                onChange={(e) => patch(i, { description: e.target.value })}
              />
            </div>
            <div className="space-y-1 sm:col-span-2">
              <span className={lbl}>Mitigation</span>
              <textarea
                className={cell}
                rows={2}
                value={r.mitigation ?? ""}
                onChange={(e) =>
                  patch(i, { mitigation: e.target.value || null })
                }
              />
            </div>
            <div className="sm:col-span-2">
              <button
                type="button"
                onClick={() => setRows((x) => x.filter((_, idx) => idx !== i))}
                className="rounded-full border border-hairline px-3 py-1 font-mono text-[10px] uppercase tracking-[0.12em] text-[var(--color-text-muted)] hover:border-[var(--color-canvas-pain)] hover:text-[var(--color-canvas-pain)]"
              >
                Remove risk
              </button>
            </div>
          </li>
        ))}
      </ul>

      <div className="flex items-center justify-between gap-4">
        <button
          type="button"
          onClick={() =>
            setRows((x) => [
              ...x,
              {
                category: "",
                description: "",
                severity: "medium",
                mitigation: null,
              },
            ])
          }
          className="rounded-full border border-hairline px-4 py-2 font-mono text-[10.5px] uppercase tracking-[0.14em] text-[var(--color-text-faded)] hover:border-[var(--color-signal)] hover:text-[var(--color-signal)]"
        >
          + Add risk
        </button>
        <div className="flex items-center gap-4">
          {!state.ok && state.error && (
            <p className="font-mono text-[10px] uppercase tracking-[0.14em] text-[var(--color-canvas-pain)]">
              {state.error}
            </p>
          )}
          {state.ok && (
            <p className="font-mono text-[10px] uppercase tracking-[0.14em] text-[var(--color-signal)]">
              Risks saved.
            </p>
          )}
          <button
            type="submit"
            disabled={pending}
            className="rounded-full border border-[var(--color-signal-deep)] px-5 py-2 font-mono text-[10.5px] uppercase tracking-[0.14em] text-[var(--color-signal-soft)] hover:border-[var(--color-signal)] hover:text-[var(--color-signal)] disabled:opacity-50"
          >
            {pending ? "Saving…" : "Save risks"}
          </button>
        </div>
      </div>
    </form>
  );
}
