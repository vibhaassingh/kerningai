"use client";

import { useActionState, useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";

import { saveProposalCommercials } from "@/lib/admin/proposal-actions";
import type { ActionResult } from "@/lib/auth/actions";

type Basis =
  | "fixed"
  | "time_and_materials"
  | "license"
  | "subscription"
  | "one_time";

interface Line {
  label: string;
  basis: Basis;
  quantity: number;
  unit_rate: number;
  notes: string | null;
}

interface ProposalCommercialsEditorProps {
  proposalId: string;
  currency: string;
  lines: Line[];
}

const BASES: { value: Basis; label: string }[] = [
  { value: "fixed", label: "Fixed" },
  { value: "time_and_materials", label: "Time & materials" },
  { value: "license", label: "License" },
  { value: "subscription", label: "Subscription" },
  { value: "one_time", label: "One-time" },
];

const initialState: ActionResult = { ok: false, error: "" };

const cell =
  "w-full rounded-md border border-hairline bg-bg px-2 py-1.5 text-[13px] text-text outline-none focus:border-[var(--color-signal-deep)]";

export function ProposalCommercialsEditor({
  proposalId,
  currency,
  lines: initialLines,
}: ProposalCommercialsEditorProps) {
  const [state, formAction, pending] = useActionState(
    saveProposalCommercials,
    initialState,
  );
  const router = useRouter();
  const [lines, setLines] = useState<Line[]>(
    initialLines.length
      ? initialLines
      : [{ label: "", basis: "fixed", quantity: 1, unit_rate: 0, notes: null }],
  );

  useEffect(() => {
    if (state.ok) router.refresh();
  }, [state, router]);

  const money = useMemo(
    () => (n: number) =>
      new Intl.NumberFormat("en-IN", {
        style: "currency",
        currency: currency || "INR",
        maximumFractionDigits: 0,
      }).format(n),
    [currency],
  );

  const total = lines.reduce(
    (acc, l) => acc + (Number(l.quantity) || 0) * (Number(l.unit_rate) || 0),
    0,
  );

  function patch(i: number, next: Partial<Line>) {
    setLines((prev) =>
      prev.map((l, idx) => (idx === i ? { ...l, ...next } : l)),
    );
  }
  function addRow() {
    setLines((prev) => [
      ...prev,
      { label: "", basis: "fixed", quantity: 1, unit_rate: 0, notes: null },
    ]);
  }
  function removeRow(i: number) {
    setLines((prev) => prev.filter((_, idx) => idx !== i));
  }

  return (
    <form action={formAction} className="space-y-4">
      <input type="hidden" name="proposalId" value={proposalId} />
      <input type="hidden" name="lines" value={JSON.stringify(lines)} />

      <div className="overflow-x-auto rounded-2xl border border-hairline bg-bg-elev/30">
        <table className="w-full min-w-[680px] text-[13px]">
          <thead>
            <tr className="border-b border-hairline text-left font-mono text-[10px] uppercase tracking-[0.14em] text-[var(--color-text-faint)]">
              <th className="px-4 py-3 font-normal">Item</th>
              <th className="px-4 py-3 font-normal">Basis</th>
              <th className="px-4 py-3 font-normal">Qty</th>
              <th className="px-4 py-3 font-normal">Unit rate</th>
              <th className="px-4 py-3 text-right font-normal">Amount</th>
              <th className="px-4 py-3" />
            </tr>
          </thead>
          <tbody>
            {lines.map((l, i) => (
              <tr key={i} className="border-b border-hairline last:border-b-0">
                <td className="px-4 py-2 align-top">
                  <input
                    aria-label="Item label"
                    className={cell}
                    value={l.label}
                    onChange={(e) => patch(i, { label: e.target.value })}
                  />
                  <input
                    aria-label="Notes"
                    placeholder="Notes (optional)"
                    className={`${cell} mt-1 text-[11.5px]`}
                    value={l.notes ?? ""}
                    onChange={(e) =>
                      patch(i, { notes: e.target.value || null })
                    }
                  />
                </td>
                <td className="px-4 py-2 align-top">
                  <select
                    aria-label="Basis"
                    className={cell}
                    value={l.basis}
                    onChange={(e) =>
                      patch(i, { basis: e.target.value as Basis })
                    }
                  >
                    {BASES.map((b) => (
                      <option key={b.value} value={b.value}>
                        {b.label}
                      </option>
                    ))}
                  </select>
                </td>
                <td className="px-4 py-2 align-top">
                  <input
                    aria-label="Quantity"
                    type="number"
                    min={0}
                    step="0.01"
                    className={`${cell} w-20`}
                    value={l.quantity}
                    onChange={(e) =>
                      patch(i, { quantity: Number(e.target.value) })
                    }
                  />
                </td>
                <td className="px-4 py-2 align-top">
                  <input
                    aria-label="Unit rate"
                    type="number"
                    min={0}
                    step="0.01"
                    className={`${cell} w-32`}
                    value={l.unit_rate}
                    onChange={(e) =>
                      patch(i, { unit_rate: Number(e.target.value) })
                    }
                  />
                </td>
                <td className="px-4 py-2 text-right align-top tabular-nums text-text">
                  {money(
                    (Number(l.quantity) || 0) * (Number(l.unit_rate) || 0),
                  )}
                </td>
                <td className="px-4 py-2 text-right align-top">
                  <button
                    type="button"
                    onClick={() => removeRow(i)}
                    aria-label="Remove line"
                    className="rounded-full border border-hairline px-2 py-1 font-mono text-[10px] uppercase tracking-[0.12em] text-[var(--color-text-muted)] hover:border-[var(--color-canvas-pain)] hover:text-[var(--color-canvas-pain)]"
                  >
                    Remove
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
          <tfoot>
            <tr className="border-t border-hairline-strong">
              <td
                colSpan={4}
                className="px-4 py-3 text-right font-mono text-[10.5px] uppercase tracking-[0.14em] text-[var(--color-text-muted)]"
              >
                Total
              </td>
              <td className="px-4 py-3 text-right text-[1rem] tabular-nums text-text">
                {money(total)}
              </td>
              <td />
            </tr>
          </tfoot>
        </table>
      </div>

      <div className="flex items-center justify-between gap-4">
        <button
          type="button"
          onClick={addRow}
          className="rounded-full border border-hairline px-4 py-2 font-mono text-[10.5px] uppercase tracking-[0.14em] text-[var(--color-text-faded)] hover:border-[var(--color-signal)] hover:text-[var(--color-signal)]"
        >
          + Add line
        </button>
        <div className="flex items-center gap-4">
          {!state.ok && state.error && (
            <p className="font-mono text-[10px] uppercase tracking-[0.14em] text-[var(--color-canvas-pain)]">
              {state.error}
            </p>
          )}
          {state.ok && (
            <p className="font-mono text-[10px] uppercase tracking-[0.14em] text-[var(--color-signal)]">
              Commercials saved.
            </p>
          )}
          <button
            type="submit"
            disabled={pending}
            className="rounded-full border border-[var(--color-signal-deep)] px-5 py-2 font-mono text-[10.5px] uppercase tracking-[0.14em] text-[var(--color-signal-soft)] hover:border-[var(--color-signal)] hover:text-[var(--color-signal)] disabled:opacity-50"
          >
            {pending ? "Saving…" : "Save commercials"}
          </button>
        </div>
      </div>
    </form>
  );
}
