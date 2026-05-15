import Link from "next/link";
import { redirect } from "next/navigation";

import { DataTable, type DataTableColumn } from "@/components/data/DataTable";
import { Eyebrow } from "@/components/primitives/Eyebrow";
import { formatRelative } from "@/lib/admin/format";
import {
  listDecidedRecommendations,
  type AgentRecommendation,
} from "@/lib/portal/agents";
import { getPortalContext } from "@/lib/portal/team";

export const metadata = { title: "Agent history" };
export const dynamic = "force-dynamic";

export default async function AgentHistoryPage() {
  const ctx = await getPortalContext();
  if (!ctx) redirect("/portal");

  const rows = await listDecidedRecommendations(ctx.organizationId);
  const approved = rows.filter((r) => r.status === "approved").length;
  const rejected = rows.filter((r) => r.status === "rejected").length;

  const columns: DataTableColumn<AgentRecommendation>[] = [
    {
      key: "recommendation",
      header: "Recommendation",
      cell: (r) => (
        <Link
          href={`/portal/agents/${r.id}`}
          className="block space-y-0.5 hover:text-text"
        >
          <div className="text-text">{r.title}</div>
          <div className="text-[11.5px] text-[var(--color-text-muted)]">
            {r.template_name ?? r.template_slug.replace(/_/g, " ")}
            {r.asset_name && ` · ${r.asset_name}`}
            {r.site_name && ` · ${r.site_name}`}
          </div>
        </Link>
      ),
      className: "w-[42%]",
    },
    {
      key: "decision",
      header: "Decision",
      cell: (r) => (
        <span
          className={
            r.status === "approved"
              ? "rounded-full bg-[var(--color-signal)]/15 px-2.5 py-1 font-mono text-[10px] uppercase tracking-[0.12em] text-[var(--color-signal)]"
              : "rounded-full border border-hairline px-2.5 py-1 font-mono text-[10px] uppercase tracking-[0.12em] text-[var(--color-text-faded)]"
          }
        >
          {r.status}
        </span>
      ),
    },
    {
      key: "by",
      header: "By",
      cell: (r) =>
        r.decided_by_name ?? (
          <span className="text-[var(--color-text-faint)]">—</span>
        ),
    },
    {
      key: "when",
      header: "When",
      cell: (r) => (
        <span className="text-[12.5px] text-[var(--color-text-faded)]">
          {r.decided_at ? formatRelative(r.decided_at) : "—"}
        </span>
      ),
    },
  ];

  return (
    <div className="space-y-12">
      <header className="space-y-4">
        <Eyebrow number="03">Agents · action ledger</Eyebrow>
        <h1 className="text-display text-[clamp(2rem,5vw,3rem)] font-medium leading-[1.05] tracking-[-0.03em]">
          Every <span className="italic text-[var(--color-signal)]">decision</span> on record.
        </h1>
        <p className="max-w-xl text-[15px] leading-relaxed text-[var(--color-text-faded)]">
          The action ledger is append-only — a permanent record of which
          human approved which agent recommendation, why, and when.
        </p>
      </header>

      <section className="grid gap-px overflow-hidden rounded-2xl border border-hairline bg-hairline sm:grid-cols-3">
        <Tile number="01" label="Total" value={rows.length.toString()} />
        <Tile number="02" label="Approved" value={approved.toString()} />
        <Tile number="03" label="Rejected" value={rejected.toString()} />
      </section>

      <DataTable
        rows={rows}
        columns={columns}
        rowKey={(r) => r.id}
        emptyState="No decisions yet. Approvals appear here as soon as someone acts on a recommendation."
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
