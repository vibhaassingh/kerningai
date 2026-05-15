import Link from "next/link";
import { redirect } from "next/navigation";

import { CreateTicketForm } from "@/components/portal/CreateTicketForm";
import { DataTable, type DataTableColumn } from "@/components/data/DataTable";
import { Eyebrow } from "@/components/primitives/Eyebrow";
import { formatRelative } from "@/lib/admin/format";
import { listTickets, type TicketRow } from "@/lib/portal/support";
import { getPortalContext } from "@/lib/portal/team";

export const metadata = { title: "Support" };
export const dynamic = "force-dynamic";

export default async function PortalSupportPage() {
  const ctx = await getPortalContext();
  if (!ctx) redirect("/portal");

  const tickets = await listTickets(ctx.organizationId);
  const open = tickets.filter((t) => t.status !== "closed");

  const columns: DataTableColumn<TicketRow>[] = [
    {
      key: "title",
      header: "Ticket",
      cell: (t) => (
        <Link
          href={`/portal/support/${t.id}`}
          className="block space-y-0.5 hover:text-text"
        >
          <div className="text-text">{t.title}</div>
          <div className="text-[11.5px] text-[var(--color-text-muted)]">
            {t.module ? `${t.module.replace(/_/g, " ")} · ` : ""}
            {t.reported_by_name ?? "Anonymous"}
          </div>
        </Link>
      ),
      className: "w-[44%]",
    },
    {
      key: "severity",
      header: "Severity",
      cell: (t) => (
        <span
          className={
            t.severity === "p1"
              ? "rounded-full bg-[var(--color-signal)]/15 px-2.5 py-1 font-mono text-[10px] uppercase tracking-[0.14em] text-[var(--color-signal)]"
              : "rounded-full border border-hairline px-2.5 py-1 font-mono text-[10px] uppercase tracking-[0.14em] text-[var(--color-text-faded)]"
          }
        >
          {t.severity}
        </span>
      ),
    },
    {
      key: "status",
      header: "Status",
      cell: (t) => (
        <span className="font-mono text-[11px] uppercase tracking-[0.1em] text-[var(--color-text-faded)]">
          {t.status.replace(/_/g, " ")}
        </span>
      ),
    },
    {
      key: "opened",
      header: "Opened",
      cell: (t) => (
        <span className="text-[12.5px] text-[var(--color-text-faded)]">
          {formatRelative(t.created_at)}
        </span>
      ),
    },
  ];

  return (
    <div className="space-y-12">
      <header className="space-y-4">
        <Eyebrow number="12">Support</Eyebrow>
        <h1 className="text-display text-[clamp(2rem,5vw,3rem)] font-medium leading-[1.05] tracking-[-0.03em]">
          Talk to <span className="italic text-[var(--color-signal)]">Kerning</span>.
        </h1>
        <p className="max-w-xl text-[15px] leading-relaxed text-[var(--color-text-faded)]">
          Open a ticket. Threaded replies, severity tracking, audit
          trail. Internal-only notes from Kerning support stay hidden
          from the client thread.
        </p>
      </header>

      <section className="rounded-2xl border border-hairline bg-bg-elev/30 p-8">
        <Eyebrow number="01">Open a ticket</Eyebrow>
        <h2 className="mt-3 text-display text-[clamp(1.4rem,3vw,1.8rem)] font-medium tracking-[-0.02em]">
          What's wrong?
        </h2>
        <div className="mt-8">
          <CreateTicketForm />
        </div>
      </section>

      <section className="space-y-4">
        <header className="flex items-end justify-between gap-3">
          <Eyebrow number="02">Tickets</Eyebrow>
          <span className="font-mono text-[11px] uppercase tracking-[0.14em] text-[var(--color-text-muted)]">
            {open.length} open · {tickets.length} total
          </span>
        </header>
        <DataTable
          rows={tickets}
          columns={columns}
          rowKey={(r) => r.id}
          emptyState="No tickets yet. Open one above."
        />
      </section>
    </div>
  );
}
