import Link from "next/link";
import { redirect } from "next/navigation";

import { DataTable, type DataTableColumn } from "@/components/data/DataTable";
import { Eyebrow } from "@/components/primitives/Eyebrow";
import { formatRelative } from "@/lib/admin/format";
import { listBlueprints, type BlueprintListRow } from "@/lib/admin/blueprints";
import { hasPermissionAny } from "@/lib/auth/require";

export const metadata = { title: "Blueprints" };
export const dynamic = "force-dynamic";

export default async function BlueprintsListPage() {
  const canView = await hasPermissionAny("review_questionnaire_submissions");
  if (!canView) redirect("/admin");

  const rows = await listBlueprints();
  const approvedCount = rows.filter((r) => r.status === "approved_for_client").length;
  const reviewCount = rows.filter((r) => r.status === "needs_internal_review").length;

  const columns: DataTableColumn<BlueprintListRow>[] = [
    {
      key: "blueprint",
      header: "Blueprint",
      cell: (row) => (
        <Link
          href={`/admin/solution-blueprints/${row.id}`}
          className="block space-y-0.5 hover:text-text"
        >
          <div className="text-text">
            {row.submitter_company ?? row.submitter_name ?? "Anonymous"}
            {row.version > 1 && (
              <span className="ml-2 font-mono text-[11px] text-[var(--color-text-muted)]">
                v{row.version}
              </span>
            )}
          </div>
          <div className="text-[11.5px] text-[var(--color-text-muted)]">
            {row.template_name}
          </div>
        </Link>
      ),
      className: "w-[36%]",
    },
    {
      key: "complexity",
      header: "Complexity",
      cell: (row) => (
        <div className="flex items-center gap-2">
          <span className="font-mono tabular-nums text-text">
            {row.complexity_score}
          </span>
          <span className="rounded-full bg-[var(--color-signal)]/15 px-2 py-0.5 font-mono text-[10px] uppercase tracking-[0.12em] text-[var(--color-signal)]">
            {row.complexity_band.replace("_", " ")}
          </span>
        </div>
      ),
    },
    {
      key: "status",
      header: "Status",
      cell: (row) => {
        const tone =
          row.status === "approved_for_client"
            ? "bg-[var(--color-signal)]/15 text-[var(--color-signal)]"
            : row.status === "needs_internal_review"
              ? "border border-[var(--color-signal-deep)]/60 text-[var(--color-signal-soft)]"
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
      key: "generated",
      header: "Generated",
      cell: (row) => (
        <span className="text-[12.5px] text-[var(--color-text-faded)]">
          {formatRelative(row.generated_at)}
        </span>
      ),
    },
  ];

  return (
    <div className="space-y-12">
      <header className="space-y-4">
        <Eyebrow number="04">Discovery · blueprints</Eyebrow>
        <h1 className="text-display text-[clamp(2rem,5vw,3rem)] font-medium leading-[1.05] tracking-[-0.03em]">
          Every <span className="italic text-[var(--color-signal)]">blueprint</span> in flight.
        </h1>
        <p className="max-w-xl text-[15px] leading-relaxed text-[var(--color-text-faded)]">
          Each submission can have multiple blueprint versions. Only one
          is "approved for client" at a time — that's the version the
          customer sees in their portal once the lead converts.
        </p>
      </header>

      <section className="grid gap-px overflow-hidden rounded-2xl border border-hairline bg-hairline sm:grid-cols-3">
        <Tile number="01" label="Total" value={rows.length.toString()} />
        <Tile
          number="02"
          label="Needs review"
          value={reviewCount.toString()}
        />
        <Tile
          number="03"
          label="Approved"
          value={approvedCount.toString()}
        />
      </section>

      <DataTable
        rows={rows}
        columns={columns}
        rowKey={(r) => r.id}
        emptyState="No blueprints yet. Generate one from a submission's detail page."
      />
    </div>
  );
}

function Tile({ number, label, value }: { number: string; label: string; value: string }) {
  return (
    <article className="space-y-2 bg-bg-elev/40 px-6 py-5">
      <p className="font-mono text-[10px] uppercase tracking-[0.14em] text-[var(--color-text-faint)]">
        {number} — {label}
      </p>
      <p className="text-stat text-[1.8rem] font-medium text-text">{value}</p>
    </article>
  );
}
