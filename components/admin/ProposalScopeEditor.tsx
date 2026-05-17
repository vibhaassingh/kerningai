"use client";

import { useActionState, useEffect, useState } from "react";
import { useRouter } from "next/navigation";

import { saveProposalScope } from "@/lib/admin/proposal-actions";
import type { ActionResult } from "@/lib/auth/actions";

type Kind = "in_scope" | "out_of_scope" | "assumption" | "dependency";
interface Item {
  kind: Kind;
  description: string;
}

const KINDS: { value: Kind; label: string }[] = [
  { value: "in_scope", label: "In scope" },
  { value: "out_of_scope", label: "Out of scope" },
  { value: "assumption", label: "Assumption" },
  { value: "dependency", label: "Dependency" },
];

const initialState: ActionResult = { ok: false, error: "" };
const cell =
  "rounded-md border border-hairline bg-bg px-2 py-1.5 text-[13px] text-text outline-none focus:border-[var(--color-signal-deep)]";

export function ProposalScopeEditor({
  proposalId,
  items: initial,
}: {
  proposalId: string;
  items: Item[];
}) {
  const [state, formAction, pending] = useActionState(
    saveProposalScope,
    initialState,
  );
  const router = useRouter();
  const [rows, setRows] = useState<Item[]>(initial);

  useEffect(() => {
    if (state.ok) router.refresh();
  }, [state, router]);

  return (
    <form action={formAction} className="space-y-4">
      <input type="hidden" name="proposalId" value={proposalId} />
      <input type="hidden" name="rows" value={JSON.stringify(rows)} />

      <ul className="space-y-2">
        {rows.map((it, i) => (
          <li key={i} className="flex flex-wrap items-start gap-2">
            <select
              aria-label="Kind"
              className={`${cell} w-36 shrink-0`}
              value={it.kind}
              onChange={(e) =>
                setRows((r) =>
                  r.map((x, idx) =>
                    idx === i ? { ...x, kind: e.target.value as Kind } : x,
                  ),
                )
              }
            >
              {KINDS.map((k) => (
                <option key={k.value} value={k.value}>
                  {k.label}
                </option>
              ))}
            </select>
            <input
              aria-label="Description"
              className={`${cell} min-w-[260px] flex-1`}
              value={it.description}
              onChange={(e) =>
                setRows((r) =>
                  r.map((x, idx) =>
                    idx === i ? { ...x, description: e.target.value } : x,
                  ),
                )
              }
            />
            <button
              type="button"
              onClick={() => setRows((r) => r.filter((_, x) => x !== i))}
              className="rounded-full border border-hairline px-3 py-1.5 font-mono text-[10px] uppercase tracking-[0.12em] text-[var(--color-text-muted)] hover:border-[var(--color-canvas-pain)] hover:text-[var(--color-canvas-pain)]"
            >
              Remove
            </button>
          </li>
        ))}
      </ul>

      <div className="flex items-center justify-between gap-4">
        <button
          type="button"
          onClick={() =>
            setRows((r) => [...r, { kind: "in_scope", description: "" }])
          }
          className="rounded-full border border-hairline px-4 py-2 font-mono text-[10.5px] uppercase tracking-[0.14em] text-[var(--color-text-faded)] hover:border-[var(--color-signal)] hover:text-[var(--color-signal)]"
        >
          + Add item
        </button>
        <div className="flex items-center gap-4">
          {!state.ok && state.error && (
            <p className="font-mono text-[10px] uppercase tracking-[0.14em] text-[var(--color-canvas-pain)]">
              {state.error}
            </p>
          )}
          {state.ok && (
            <p className="font-mono text-[10px] uppercase tracking-[0.14em] text-[var(--color-signal)]">
              Scope saved.
            </p>
          )}
          <button
            type="submit"
            disabled={pending}
            className="rounded-full border border-[var(--color-signal-deep)] px-5 py-2 font-mono text-[10.5px] uppercase tracking-[0.14em] text-[var(--color-signal-soft)] hover:border-[var(--color-signal)] hover:text-[var(--color-signal)] disabled:opacity-50"
          >
            {pending ? "Saving…" : "Save scope"}
          </button>
        </div>
      </div>
    </form>
  );
}
