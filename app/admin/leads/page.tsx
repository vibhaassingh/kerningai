import Link from "next/link";
import { redirect } from "next/navigation";

import { DataTable, type DataTableColumn } from "@/components/data/DataTable";
import { Eyebrow } from "@/components/primitives/Eyebrow";
import { hasPermissionAny } from "@/lib/auth/require";
import {
  listLeads,
  listPipelineStages,
  type LeadListRow,
} from "@/lib/admin/leads";
import { formatRelative } from "@/lib/admin/format";

export const metadata = { title: "Leads" };
export const dynamic = "force-dynamic";

export default async function LeadsListPage() {
  const canView = await hasPermissionAny("view_leads");
  if (!canView) redirect("/admin");

  const [leads, stages] = await Promise.all([listLeads(), listPipelineStages()]);

  const stageMap = new Map(stages.map((s) => [s.slug, s]));
  const stageName = (slug: string) => stageMap.get(slug)?.name ?? slug;

  const byStage = new Map<string, number>();
  for (const lead of leads) {
    byStage.set(lead.status, (byStage.get(lead.status) ?? 0) + 1);
  }

  const columns: DataTableColumn<LeadListRow>[] = [
    {
      key: "lead",
      header: "Lead",
      cell: (row) => (
        <Link
          href={`/admin/leads/${row.id}`}
          className="block space-y-0.5 hover:text-text"
        >
          <div className="text-text">
            {row.company_name ?? row.contact_name}
          </div>
          <div className="text-[11.5px] text-[var(--color-text-muted)]">
            {row.contact_name}
            {row.contact_role && ` · ${row.contact_role}`} · {row.contact_email}
          </div>
        </Link>
      ),
      className: "w-[36%]",
    },
    {
      key: "source",
      header: "Source",
      cell: (row) => (
        <span className="font-mono text-[11.5px] uppercase tracking-[0.08em] text-[var(--color-text-faded)]">
          {row.source.replace(/_/g, " ")}
        </span>
      ),
    },
    {
      key: "status",
      header: "Status",
      cell: (row) => {
        const stage = stageMap.get(row.status);
        const tone = stage?.is_won
          ? "bg-[var(--color-signal)]/15 text-[var(--color-signal)]"
          : stage?.is_lost
            ? "border border-hairline-strong text-[var(--color-text-faded)]"
            : stage?.is_dormant
              ? "border border-hairline text-[var(--color-text-faint)]"
              : "border border-[var(--color-signal-deep)]/60 text-[var(--color-signal-soft)]";
        return (
          <span
            className={`rounded-full px-2.5 py-1 font-mono text-[10px] uppercase tracking-[0.12em] ${tone}`}
          >
            {stage?.name ?? row.status}
          </span>
        );
      },
    },
    {
      key: "owner",
      header: "Owner",
      cell: (row) =>
        row.owner_name ? (
          row.owner_name
        ) : (
          <span className="text-[var(--color-text-faint)]">Unassigned</span>
        ),
    },
    {
      key: "client",
      header: "Converted",
      cell: (row) =>
        row.client_id && row.client_name ? (
          <Link
            href={`/admin/clients/${row.client_id}`}
            className="text-[var(--color-signal)] hover:underline"
          >
            {row.client_name}
          </Link>
        ) : (
          <span className="text-[var(--color-text-faint)]">—</span>
        ),
    },
    {
      key: "created",
      header: "Created",
      cell: (row) => (
        <span className="text-[12.5px] text-[var(--color-text-faded)]">
          {formatRelative(row.created_at)}
        </span>
      ),
    },
  ];

  return (
    <div className="space-y-12">
      <header className="space-y-4">
        <Eyebrow number="03">Sales CRM · leads</Eyebrow>
        <h1 className="text-display text-[clamp(2rem,5vw,3rem)] font-medium leading-[1.05] tracking-[-0.03em]">
          Every <span className="italic text-[var(--color-signal)]">prospect</span> in flight.
        </h1>
        <p className="max-w-xl text-[15px] leading-relaxed text-[var(--color-text-faded)]">
          Contact-form submissions land here automatically. Open a lead
          to update its status, attach notes, or convert it to a client.
        </p>
      </header>

      <section className="grid gap-px overflow-hidden rounded-2xl border border-hairline bg-hairline sm:grid-cols-2 lg:grid-cols-5">
        <Tile number="01" label="Total" value={leads.length.toString()} />
        <Tile
          number="02"
          label="New"
          value={(byStage.get("new") ?? 0).toString()}
        />
        <Tile
          number="03"
          label="Qualified"
          value={(byStage.get("qualified") ?? 0).toString()}
        />
        <Tile
          number="04"
          label="Proposal sent"
          value={(byStage.get("proposal_sent") ?? 0).toString()}
        />
        <Tile
          number="05"
          label="Won"
          value={(byStage.get("won") ?? 0).toString()}
        />
      </section>

      <DataTable
        rows={leads}
        columns={columns}
        rowKey={(r) => r.id}
        emptyState={`No leads yet. Submissions from /contact will appear here automatically. (Pipeline stages available: ${stages.length})`}
        caption={
          <span className="font-mono">
            {leads.length} lead{leads.length === 1 ? "" : "s"} · {stageName("new")} default
          </span>
        }
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
