import type { ReactNode } from "react";

import { cn } from "@/lib/cn";

export interface DataTableColumn<T> {
  /** Stable key for keying + sort. */
  key: string;
  /** Column header label. */
  header: ReactNode;
  /** Render cell content from the row. */
  cell: (row: T) => ReactNode;
  /** Optional class for the cell (alignment, width). */
  className?: string;
  /** Optional class for the header. */
  headerClassName?: string;
  /** Optional ARIA label override. */
  ariaLabel?: string;
}

export interface DataTableProps<T> {
  rows: T[];
  columns: DataTableColumn<T>[];
  rowKey: (row: T) => string;
  /** Rendered above the table — typically a filter bar. */
  toolbar?: ReactNode;
  /** Shown when `rows` is empty. */
  emptyState?: ReactNode;
  /** Right-side caption next to the toolbar, e.g. "12 results". */
  caption?: ReactNode;
}

/**
 * Family-styled data table. Editorial rhythm: thin hairline borders, mono
 * uppercase headers, dense rows. Designed to be paired with `Eyebrow` +
 * a page header above it — the surrounding section provides the title.
 *
 * Server-component friendly: pass plain data, the table only renders.
 * Interactivity (filters, row actions) lives in the parent.
 */
export function DataTable<T>({
  rows,
  columns,
  rowKey,
  toolbar,
  emptyState,
  caption,
}: DataTableProps<T>) {
  return (
    <div className="space-y-4">
      {(toolbar || caption) && (
        <div className="flex flex-wrap items-center justify-between gap-3 text-[11px] uppercase tracking-[0.12em] text-[var(--color-text-muted)]">
          <div className="flex flex-wrap items-center gap-2">{toolbar}</div>
          {caption}
        </div>
      )}

      <div className="overflow-hidden rounded-2xl border border-hairline bg-bg-elev/30">
        {rows.length === 0 ? (
          <div className="px-8 py-16 text-center text-[14px] text-[var(--color-text-muted)]">
            {emptyState ?? "No records yet."}
          </div>
        ) : (
          <table className="w-full border-collapse text-[14px]">
            <thead>
              <tr className="bg-bg-elev/40 text-left">
                {columns.map((col) => (
                  <th
                    key={col.key}
                    scope="col"
                    aria-label={col.ariaLabel}
                    className={cn(
                      "border-b border-hairline px-5 py-3 font-mono text-[10.5px] uppercase tracking-[0.14em] font-normal text-[var(--color-text-muted)]",
                      col.headerClassName,
                    )}
                  >
                    {col.header}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {rows.map((row, idx) => (
                <tr
                  key={rowKey(row)}
                  className={cn(
                    idx % 2 === 0 ? "bg-transparent" : "bg-bg-elev/15",
                    "transition-colors hover:bg-bg-elev/40",
                  )}
                >
                  {columns.map((col) => (
                    <td
                      key={col.key}
                      className={cn(
                        "border-b border-hairline/60 px-5 py-3 align-middle text-[var(--color-text-faded)]",
                        col.className,
                      )}
                    >
                      {col.cell(row)}
                    </td>
                  ))}
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>
    </div>
  );
}
