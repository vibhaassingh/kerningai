import Link from "next/link";
import { redirect } from "next/navigation";

import { CreatePartnerForm } from "@/components/admin/CreatePartnerForm";
import { RestorePartnerButton } from "@/components/admin/RestorePartnerButton";
import { DataTable, type DataTableColumn } from "@/components/data/DataTable";
import { Eyebrow } from "@/components/primitives/Eyebrow";
import { hasPermissionAny } from "@/lib/auth/require";
import { formatRelative } from "@/lib/admin/format";
import {
  listDeletedPartnerOrgs,
  listPartnerOrgs,
  type PartnerOrgRow,
} from "@/lib/admin/partners";

export const metadata = { title: "Partners" };
export const dynamic = "force-dynamic";

export default async function AdminPartnersPage() {
  const canView = await hasPermissionAny("view_clients");
  if (!canView) redirect("/admin");
  const canCreate = await hasPermissionAny("manage_clients");

  const rows = await listPartnerOrgs();
  const deleted = canCreate ? await listDeletedPartnerOrgs() : [];

  const columns: DataTableColumn<PartnerOrgRow>[] = [
    {
      key: "partner",
      header: "Partner",
      cell: (row) => (
        <Link
          href={`/admin/partners/${row.id}`}
          className="block space-y-0.5 hover:text-text"
        >
          <div className="text-text">{row.name}</div>
          <div className="text-[11.5px] text-[var(--color-text-muted)]">
            {row.slug} · {row.region}
          </div>
        </Link>
      ),
      className: "w-[34%]",
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
      key: "people",
      header: "People",
      cell: (row) => (
        <span className="font-mono tabular-nums text-[var(--color-text-faded)]">
          {row.member_count}
        </span>
      ),
    },
    {
      key: "leads",
      header: "Referred leads",
      cell: (row) => (
        <span className="font-mono tabular-nums text-[var(--color-text-faded)]">
          {row.lead_count}
        </span>
      ),
    },
    {
      key: "projects",
      header: "Referred projects",
      cell: (row) => (
        <span className="font-mono tabular-nums text-[var(--color-text-faded)]">
          {row.project_count}
        </span>
      ),
    },
  ];

  return (
    <div className="space-y-12">
      <header className="space-y-4">
        <Eyebrow number="02b">Partners</Eyebrow>
        <h1 className="text-display text-[clamp(2rem,5vw,3rem)] font-medium leading-[1.05] tracking-[-0.03em]">
          Every <span className="italic text-[var(--color-signal)]">referral partner</span> in the network.
        </h1>
        <p className="max-w-xl text-[15px] leading-relaxed text-[var(--color-text-faded)]">
          Partners introduce clients and follow the workflow canvas of the
          projects they referred. Open a partner to invite their team and
          review what they&apos;ve brought in.
        </p>
      </header>

      <DataTable
        rows={rows}
        columns={columns}
        rowKey={(r) => r.id}
        emptyState="No partners yet. Create one below or convert a partner lead."
        caption={
          <span className="font-mono">
            {rows.length} partner{rows.length === 1 ? "" : "s"}
          </span>
        }
      />

      {canCreate && (
        <section className="rounded-2xl border border-hairline bg-bg-elev/30 p-8">
          <Eyebrow number="01">Create</Eyebrow>
          <h2 className="mt-3 text-display text-[clamp(1.4rem,3vw,1.8rem)] font-medium tracking-[-0.02em]">
            Add a new partner organisation.
          </h2>
          <p className="mt-2 text-[14px] text-[var(--color-text-faded)]">
            Creates the partner org. You&apos;ll land on its detail page so
            you can invite their team and assign projects.
          </p>
          <div className="mt-8">
            <CreatePartnerForm />
          </div>
        </section>
      )}

      {canCreate && deleted.length > 0 && (
        <section className="space-y-4">
          <Eyebrow number="02">Recently deleted</Eyebrow>
          <p className="text-[13px] text-[var(--color-text-faded)]">
            Deleted partners are hidden everywhere but recoverable. Restoring
            brings the org, its team and referred-project links back.
          </p>
          <ul className="divide-y divide-hairline overflow-hidden rounded-2xl border border-hairline bg-bg-elev/30">
            {deleted.map((d) => (
              <li
                key={d.id}
                className="flex flex-wrap items-center justify-between gap-4 px-6 py-4"
              >
                <div className="space-y-0.5">
                  <p className="text-text">{d.name}</p>
                  <p className="font-mono text-[10.5px] uppercase tracking-[0.14em] text-[var(--color-text-muted)]">
                    {d.slug}
                    {d.deleted_at
                      ? ` · deleted ${formatRelative(d.deleted_at)}`
                      : ""}
                  </p>
                </div>
                <RestorePartnerButton partnerId={d.id} />
              </li>
            ))}
          </ul>
        </section>
      )}
    </div>
  );
}
