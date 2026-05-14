import Link from "next/link";
import { redirect } from "next/navigation";

import { DataTable, type DataTableColumn } from "@/components/data/DataTable";
import { HealthBadge } from "@/components/admin/HealthBadge";
import { Eyebrow } from "@/components/primitives/Eyebrow";
import { hasPermissionAny } from "@/lib/auth/require";
import {
  listClients,
  type ClientListRow,
} from "@/lib/admin/clients";
import {
  formatDate,
  formatDeployment,
  formatMoney,
  formatModule,
} from "@/lib/admin/format";

export const metadata = { title: "Clients" };
export const dynamic = "force-dynamic";

export default async function ClientsListPage() {
  const canView = await hasPermissionAny("view_clients");
  if (!canView) redirect("/admin");

  const rows = await listClients();

  const totalMrr = rows.reduce((acc, r) => acc + r.mrr_cents, 0);
  const sitesCount = rows.reduce((acc, r) => acc + r.site_count, 0);
  const usersCount = rows.reduce((acc, r) => acc + r.member_count, 0);

  const columns: DataTableColumn<ClientListRow>[] = [
    {
      key: "client",
      header: "Client",
      cell: (row) => (
        <Link
          href={`/admin/clients/${row.id}`}
          className="block space-y-0.5 hover:text-text"
        >
          <div className="text-text">{row.name}</div>
          <div className="text-[11.5px] text-[var(--color-text-muted)]">
            {row.industry ? formatModule(row.industry) : "—"} · {row.region}
          </div>
        </Link>
      ),
      className: "w-[28%]",
    },
    {
      key: "health",
      header: "Health",
      cell: (row) => <HealthBadge score={row.health_score} />,
    },
    {
      key: "mrr",
      header: "MRR",
      cell: (row) => (
        <span className="font-mono tabular-nums text-[13px] text-text">
          {formatMoney(row.mrr_cents, row.currency)}
        </span>
      ),
    },
    {
      key: "deployment",
      header: "Deployment",
      cell: (row) => formatDeployment(row.deployment_type),
    },
    {
      key: "modules",
      header: "Modules",
      cell: (row) => (
        <div className="flex flex-wrap gap-1">
          {row.modules_enabled.slice(0, 3).map((m) => (
            <span
              key={m}
              className="rounded-full border border-hairline px-2 py-0.5 font-mono text-[10px] uppercase tracking-[0.1em] text-[var(--color-text-faded)]"
            >
              {formatModule(m)}
            </span>
          ))}
          {row.modules_enabled.length > 3 && (
            <span className="font-mono text-[10px] uppercase tracking-[0.1em] text-[var(--color-text-faint)]">
              +{row.modules_enabled.length - 3}
            </span>
          )}
        </div>
      ),
    },
    {
      key: "sites",
      header: "Sites",
      cell: (row) => (
        <span className="font-mono tabular-nums text-[var(--color-text-faded)]">
          {row.site_count}
        </span>
      ),
      className: "w-[8%]",
    },
    {
      key: "people",
      header: "People",
      cell: (row) => (
        <span className="font-mono tabular-nums text-[var(--color-text-faded)]">
          {row.member_count}
        </span>
      ),
      className: "w-[8%]",
    },
    {
      key: "renewal",
      header: "Renewal",
      cell: (row) => (
        <span className="text-[12.5px] text-[var(--color-text-faded)]">
          {formatDate(row.renewal_date)}
        </span>
      ),
    },
  ];

  return (
    <div className="space-y-12">
      <header className="space-y-4">
        <Eyebrow number="02">Clients</Eyebrow>
        <h1 className="text-display text-[clamp(2rem,5vw,3rem)] font-medium leading-[1.05] tracking-[-0.03em]">
          Every <span className="italic text-[var(--color-signal)]">workspace</span> Kerning operates.
        </h1>
        <p className="max-w-xl text-[15px] leading-relaxed text-[var(--color-text-faded)]">
          Drill into a client to manage its sites, users, modules,
          deployments, and audit history.
        </p>
      </header>

      <section className="grid gap-px overflow-hidden rounded-2xl border border-hairline bg-hairline sm:grid-cols-2 lg:grid-cols-4">
        <Tile number="01" label="Clients" value={rows.length.toString()} />
        <Tile
          number="02"
          label="Sites monitored"
          value={sitesCount.toString()}
        />
        <Tile number="03" label="People with access" value={usersCount.toString()} />
        <Tile
          number="04"
          label="Total MRR"
          value={formatMoney(totalMrr, rows[0]?.currency ?? "EUR")}
        />
      </section>

      <DataTable
        rows={rows}
        columns={columns}
        rowKey={(r) => r.id}
        emptyState="No clients yet. Convert a discovery submission or invite one through the CRM."
        caption={
          <span className="font-mono">{rows.length} client{rows.length === 1 ? "" : "s"}</span>
        }
      />
    </div>
  );
}

function Tile({ number, label, value }: { number: string; label: string; value: string }) {
  return (
    <article className="space-y-2 bg-bg-elev/40 px-6 py-6">
      <p className="font-mono text-[10px] uppercase tracking-[0.14em] text-[var(--color-text-faint)]">
        {number} — {label}
      </p>
      <p className="text-stat text-[1.8rem] font-medium text-text">{value}</p>
    </article>
  );
}
