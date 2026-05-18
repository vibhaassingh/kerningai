"use client";

import { useActionState, useEffect, useState } from "react";
import { useRouter } from "next/navigation";

import { saveProposalPhases } from "@/lib/admin/proposal-actions";
import type { ActionResult } from "@/lib/auth/actions";

interface Phase {
  name: string;
  description: string | null;
  duration_weeks: number;
  owners: string[];
  deliverables: string[];
  price: number | null;
}

const initialState: ActionResult = { ok: false, error: "" };
const cell =
  "w-full rounded-md border border-hairline bg-bg px-2 py-1.5 text-[13px] text-text outline-none focus:border-[var(--color-signal-deep)]";
const lbl =
  "font-mono text-[9.5px] uppercase tracking-[0.14em] text-[var(--color-text-faint)]";

export function ProposalPhasesEditor({
  proposalId,
  phases: initial,
}: {
  proposalId: string;
  phases: Phase[];
}) {
  const [state, formAction, pending] = useActionState(
    saveProposalPhases,
    initialState,
  );
  const router = useRouter();
  const [rows, setRows] = useState<Phase[]>(initial);

  useEffect(() => {
    if (state.ok) router.refresh();
  }, [state, router]);

  function patch(i: number, next: Partial<Phase>) {
    setRows((p) => p.map((r, idx) => (idx === i ? { ...r, ...next } : r)));
  }

  return (
    <form action={formAction} className="space-y-4">
      <input type="hidden" name="proposalId" value={proposalId} />
      <input type="hidden" name="rows" value={JSON.stringify(rows)} />

      <ol className="space-y-3">
        {rows.map((p, i) => (
          <li
            key={i}
            className="grid gap-3 rounded-2xl border border-hairline bg-bg-elev/30 p-5 lg:grid-cols-2"
          >
            <div className="space-y-1">
              <span className={lbl}>Name</span>
              <input
                className={cell}
                value={p.name}
                onChange={(e) => patch(i, { name: e.target.value })}
              />
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1">
                <span className={lbl}>Duration (weeks)</span>
                <input
                  type="number"
                  min={0}
                  className={cell}
                  value={p.duration_weeks}
                  onChange={(e) =>
                    patch(i, { duration_weeks: Number(e.target.value) })
                  }
                />
              </div>
              <div className="space-y-1">
                <span className={lbl}>Price (optional)</span>
                <input
                  type="number"
                  min={0}
                  className={cell}
                  value={p.price ?? ""}
                  onChange={(e) =>
                    patch(i, {
                      price:
                        e.target.value === "" ? null : Number(e.target.value),
                    })
                  }
                />
              </div>
            </div>
            <div className="space-y-1 lg:col-span-2">
              <span className={lbl}>Description</span>
              <textarea
                className={cell}
                rows={2}
                value={p.description ?? ""}
                onChange={(e) =>
                  patch(i, { description: e.target.value || null })
                }
              />
            </div>
            <div className="space-y-1">
              <span className={lbl}>Owners (one per line)</span>
              <textarea
                className={cell}
                rows={3}
                value={p.owners.join("\n")}
                onChange={(e) =>
                  patch(i, { owners: e.target.value.split("\n") })
                }
              />
            </div>
            <div className="space-y-1">
              <span className={lbl}>Deliverables (one per line)</span>
              <textarea
                className={cell}
                rows={3}
                value={p.deliverables.join("\n")}
                onChange={(e) =>
                  patch(i, { deliverables: e.target.value.split("\n") })
                }
              />
            </div>
            <div className="lg:col-span-2">
              <button
                type="button"
                onClick={() => setRows((r) => r.filter((_, x) => x !== i))}
                className="rounded-full border border-hairline px-3 py-1 font-mono text-[10px] uppercase tracking-[0.12em] text-[var(--color-text-muted)] hover:border-[var(--color-canvas-pain)] hover:text-[var(--color-canvas-pain)]"
              >
                Remove phase
              </button>
            </div>
          </li>
        ))}
      </ol>

      <div className="flex items-center justify-between gap-4">
        <button
          type="button"
          onClick={() =>
            setRows((r) => [
              ...r,
              {
                name: "",
                description: null,
                duration_weeks: 0,
                owners: [],
                deliverables: [],
                price: null,
              },
            ])
          }
          className="rounded-full border border-hairline px-4 py-2 font-mono text-[10.5px] uppercase tracking-[0.14em] text-[var(--color-text-faded)] hover:border-[var(--color-signal)] hover:text-[var(--color-signal)]"
        >
          + Add phase
        </button>
        <div className="flex items-center gap-4">
          {!state.ok && state.error && (
            <p className="font-mono text-[10px] uppercase tracking-[0.14em] text-[var(--color-canvas-pain)]">
              {state.error}
            </p>
          )}
          {state.ok && (
            <p className="font-mono text-[10px] uppercase tracking-[0.14em] text-[var(--color-signal)]">
              Phases saved.
            </p>
          )}
          <button
            type="submit"
            disabled={pending}
            className="rounded-full border border-[var(--color-signal-deep)] px-5 py-2 font-mono text-[10.5px] uppercase tracking-[0.14em] text-[var(--color-signal-soft)] hover:border-[var(--color-signal)] hover:text-[var(--color-signal)] disabled:opacity-50"
          >
            {pending ? "Saving…" : "Save phases"}
          </button>
        </div>
      </div>
    </form>
  );
}
