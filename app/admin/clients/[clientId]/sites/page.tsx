import { notFound } from "next/navigation";

import { CreateSiteForm } from "@/components/admin/CreateSiteForm";
import { DataTable, type DataTableColumn } from "@/components/data/DataTable";
import { Eyebrow } from "@/components/primitives/Eyebrow";
import {
  getClientDetail,
  listClientSites,
  type ClientSite,
} from "@/lib/admin/clients";
import { formatDate, formatDeployment } from "@/lib/admin/format";

export const metadata = { title: "Sites" };
export const dynamic = "force-dynamic";

interface SitesPageProps {
  params: Promise<{ clientId: string }>;
}

export default async function ClientSitesPage({ params }: SitesPageProps) {
  const { clientId } = await params;
  const [client, sites] = await Promise.all([
    getClientDetail(clientId),
    listClientSites(clientId),
  ]);
  if (!client) notFound();

  const columns: DataTableColumn<ClientSite>[] = [
    {
      key: "site",
      header: "Site",
      cell: (row) => (
        <div className="space-y-0.5">
          <div className="text-text">{row.name}</div>
          <div className="font-mono text-[11.5px] text-[var(--color-text-muted)]">
            {row.slug}
          </div>
        </div>
      ),
    },
    {
      key: "location",
      header: "Location",
      cell: (row) =>
        row.city || row.country
          ? `${row.city ?? ""}${row.city && row.country ? ", " : ""}${row.country ?? ""}`
          : row.region,
    },
    {
      key: "timezone",
      header: "Timezone",
      cell: (row) => (
        <span className="font-mono text-[12.5px] text-[var(--color-text-faded)]">
          {row.timezone}
        </span>
      ),
    },
    {
      key: "deployment",
      header: "Deployment",
      cell: (row) => formatDeployment(row.deployment_type),
    },
    {
      key: "status",
      header: "Status",
      cell: (row) => (
        <span
          className={
            row.status === "active"
              ? "rounded-full bg-[var(--color-signal)]/15 px-2.5 py-1 font-mono text-[10px] uppercase tracking-[0.14em] text-[var(--color-signal)]"
              : "rounded-full border border-hairline px-2.5 py-1 font-mono text-[10px] uppercase tracking-[0.14em] text-[var(--color-text-faded)]"
          }
        >
          {row.status}
        </span>
      ),
    },
    {
      key: "created",
      header: "Added",
      cell: (row) => (
        <span className="text-[12.5px] text-[var(--color-text-faded)]">
          {formatDate(row.created_at)}
        </span>
      ),
    },
  ];

  return (
    <div className="space-y-12">
      <section className="rounded-2xl border border-hairline bg-bg-elev/30 p-8">
        <Eyebrow number="01">Add site</Eyebrow>
        <h2 className="mt-3 text-display text-[clamp(1.4rem,3vw,1.8rem)] font-medium tracking-[-0.02em]">
          Register a new site for{" "}
          <span className="italic text-[var(--color-signal)]">{client.name}</span>.
        </h2>
        <p className="mt-2 text-[14px] text-[var(--color-text-faded)]">
          Sites scope sensors, equipment, telemetry and per-area
          workflows. Slug must be unique within the client.
        </p>
        <div className="mt-8">
          <CreateSiteForm clientId={clientId} />
        </div>
      </section>

      <section className="space-y-4">
        <header className="flex items-end justify-between gap-4">
          <Eyebrow number="02">Sites</Eyebrow>
          <span className="font-mono text-[11px] uppercase tracking-[0.14em] text-[var(--color-text-muted)]">
            {sites.length} total
          </span>
        </header>
        <DataTable
          rows={sites}
          columns={columns}
          rowKey={(r) => r.id}
          emptyState="No sites yet. Add the first one above."
        />
      </section>
    </div>
  );
}
