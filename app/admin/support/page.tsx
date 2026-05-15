import Link from "next/link";
import { redirect } from "next/navigation";

import { CreateTicketForm } from "@/components/admin/CreateTicketForm";
import { DataTable, type DataTableColumn } from "@/components/data/DataTable";
import { Eyebrow } from "@/components/primitives/Eyebrow";
import { listClients } from "@/lib/admin/clients";
import { formatRelative } from "@/lib/admin/format";
import { listAllTickets, type AdminTicketRow } from "@/lib/admin/support";
import { hasPermissionAny } from "@/lib/auth/require";

export const metadata = { title: "Support" };
export const dynamic = "force-dynamic";

export default async function AdminSupportPage() {
  if (!(await hasPermissionAny("view_support"))) redirect("/admin");

  const rows = await listAllTickets();
  const open = rows.filter((r) => r.status !== "closed");
  const p1 = open.filter((r) => r.severity === "p1");

  const canManage = await hasPermissionAny("manage_support_tickets");
  const clients = canManage
    ? (await listClients()).map((c) => ({ id: c.id, name: c.name }))
    : [];

  const columns: DataTableColumn<AdminTicketRow>[] = [
    {
      key: "ticket",
      header: "Ticket",
      cell: (r) => (
        <Link
          href={`/admin/support/${r.id}`}
          className="block space-y-0.5 hover:text-text"
        >
          <div className="text-text">{r.title}</div>
          <div className="text-[11.5px] text-[var(--color-text-muted)]">
            {r.organization_name ?? "—"}
            {r.module && ` · ${r.module.replace(/_/g, " ")}`}
          </div>
        </Link>
      ),
      className: "w-[40%]",
    },
    {
      key: "severity",
      header: "Severity",
      cell: (r) => (
        <span
          className={
            r.severity === "p1"
              ? "rounded-full bg-[var(--color-signal)]/15 px-2.5 py-1 font-mono text-[10px] uppercase tracking-[0.14em] text-[var(--color-signal)]"
              : "rounded-full border border-hairline px-2.5 py-1 font-mono text-[10px] uppercase tracking-[0.14em] text-[var(--color-text-faded)]"
          }
        >
          {r.severity}
        </span>
      ),
    },
    {
      key: "status",
      header: "Status",
      cell: (r) => (
        <span className="font-mono text-[11px] uppercase tracking-[0.1em] text-[var(--color-text-faded)]">
          {r.status.replace(/_/g, " ")}
        </span>
      ),
    },
    {
      key: "reporter",
      header: "Reporter",
      cell: (r) =>
        r.reported_by_name ?? <span className="text-[var(--color-text-faint)]">—</span>,
    },
    {
      key: "created",
      header: "Opened",
      cell: (r) => (
        <span className="text-[12.5px] text-[var(--color-text-faded)]">
          {formatRelative(r.created_at)}
        </span>
      ),
    },
  ];

  return (
    <div className="space-y-12">
      <header className="space-y-4">
        <Eyebrow number="07">Support · cross-client inbox</Eyebrow>
        <h1 className="text-display text-[clamp(2rem,5vw,3rem)] font-medium leading-[1.05] tracking-[-0.03em]">
          Every <span className="italic text-[var(--color-signal)]">ticket</span>, every workspace.
        </h1>
        <p className="max-w-xl text-[15px] leading-relaxed text-[var(--color-text-faded)]">
          Support tickets opened by client teams. Internal-only notes
          stay hidden from the client thread.
        </p>
      </header>

      <section className="grid gap-px overflow-hidden rounded-2xl border border-hairline bg-hairline sm:grid-cols-3">
        <Tile number="01" label="Open" value={open.length.toString()} />
        <Tile number="02" label="P1" value={p1.length.toString()} />
        <Tile number="03" label="Closed" value={(rows.length - open.length).toString()} />
      </section>

      {canManage && (
        <section className="rounded-2xl border border-hairline bg-bg-elev/30 p-8">
          <Eyebrow number="04">Raise a ticket</Eyebrow>
          <h2 className="mt-3 text-display text-[clamp(1.4rem,3vw,1.8rem)] font-medium tracking-[-0.02em]">
            Open one{" "}
            <span className="italic text-[var(--color-signal)]">
              on a client&apos;s behalf
            </span>
            .
          </h2>
          <p className="mt-2 text-[14px] text-[var(--color-text-faded)]">
            For tickets phoned/emailed in, or proactive issues you spotted.
            It opens in the client&apos;s workspace; the client sees it in
            their portal.
          </p>
          <div className="mt-8">
            <CreateTicketForm clients={clients} />
          </div>
        </section>
      )}

      <DataTable
        rows={rows}
        columns={columns}
        rowKey={(r) => r.id}
        emptyState="No tickets across any workspace yet."
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
