import Link from "next/link";
import { redirect } from "next/navigation";

import { DataTable, type DataTableColumn } from "@/components/data/DataTable";
import { Eyebrow } from "@/components/primitives/Eyebrow";
import { formatRelative } from "@/lib/admin/format";
import { listAllProposals, type ProposalIndexRow } from "@/lib/admin/proposals";
import { hasPermissionAny } from "@/lib/auth/require";

export const metadata = { title: "Proposals" };
export const dynamic = "force-dynamic";

function money(amount: number, currency: string) {
  return new Intl.NumberFormat("en-IN", {
    style: "currency",
    currency: currency || "INR",
    maximumFractionDigits: 0,
  }).format(amount);
}

export default async function ProposalsListPage() {
  const canView = await hasPermissionAny("manage_proposals");
  if (!canView) redirect("/admin");

  const rows = await listAllProposals();
  const sentCount = rows.filter((r) => r.status === "sent").length;
  const acceptedCount = rows.filter((r) => r.status === "accepted").length;

  const columns: DataTableColumn<ProposalIndexRow>[] = [
    {
      key: "proposal",
      header: "Proposal",
      cell: (row) => (
        <Link
          href={`/admin/clients/${row.client_org_id}/projects/${row.project_id}/proposal/workflow`}
          className="block space-y-0.5 hover:text-text"
        >
          <div className="text-text">
            {row.client_name}
            {row.version > 1 && (
              <span className="ml-2 font-mono text-[11px] text-[var(--color-text-muted)]">
                v{row.version}
              </span>
            )}
          </div>
          <div className="text-[11.5px] text-[var(--color-text-muted)]">
            {row.project_name}
          </div>
        </Link>
      ),
      className: "w-[40%]",
    },
    {
      key: "status",
      header: "Status",
      cell: (row) => {
        const tone =
          row.status === "accepted"
            ? "bg-[var(--color-signal)]/15 text-[var(--color-signal)]"
            : row.status === "sent"
              ? "border border-[var(--color-signal-deep)]/60 text-[var(--color-signal-soft)]"
              : row.status === "declined" || row.status === "expired"
                ? "border border-hairline text-[var(--color-text-faint)]"
                : row.status === "archived"
                  ? "border border-hairline text-[var(--color-text-faint)]"
                  : "border border-hairline-strong text-[var(--color-text-faded)]";
        return (
          <span
            className={`rounded-full px-2.5 py-1 font-mono text-[10px] uppercase tracking-[0.12em] ${tone}`}
          >
            {row.status.replace(/_/g, " ")}
          </span>
        );
      },
    },
    {
      key: "value",
      header: "Value",
      cell: (row) => (
        <span className="font-mono tabular-nums text-text">
          {money(row.total_amount, row.currency)}
        </span>
      ),
    },
    {
      key: "updated",
      header: "Updated",
      cell: (row) => (
        <span className="text-[12.5px] text-[var(--color-text-faded)]">
          {formatRelative(row.updated_at)}
        </span>
      ),
    },
  ];

  return (
    <div className="space-y-12">
      <header className="space-y-4">
        <Eyebrow number="04b">Sales · proposals</Eyebrow>
        <h1 className="text-display text-[clamp(2rem,5vw,3rem)] font-medium leading-[1.05] tracking-[-0.03em]">
          Every <span className="italic text-[var(--color-signal)]">proposal</span> in flight.
        </h1>
        <p className="max-w-xl text-[15px] leading-relaxed text-[var(--color-text-faded)]">
          Proposals across all clients. A project can have multiple
          versions; the row opens that project&apos;s Proposal tab where it
          is edited, sent, and tracked.
        </p>
      </header>

      <section className="grid gap-px overflow-hidden rounded-2xl border border-hairline bg-hairline sm:grid-cols-3">
        <Tile number="01" label="Total" value={rows.length.toString()} />
        <Tile number="02" label="Sent" value={sentCount.toString()} />
        <Tile number="03" label="Accepted" value={acceptedCount.toString()} />
      </section>

      <DataTable
        rows={rows}
        columns={columns}
        rowKey={(r) => r.id}
        emptyState="No proposals yet. Open a project's Proposal tab and generate one from its workflow canvas."
      />
    </div>
  );
}

function Tile({
  number,
  label,
  value,
}: {
  number: string;
  label: string;
  value: string;
}) {
  return (
    <article className="space-y-2 bg-bg-elev/40 px-6 py-5">
      <p className="font-mono text-[10px] uppercase tracking-[0.14em] text-[var(--color-text-faint)]">
        {number} — {label}
      </p>
      <p className="text-stat text-[1.8rem] font-medium text-text">{value}</p>
    </article>
  );
}
