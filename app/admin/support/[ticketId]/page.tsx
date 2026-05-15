import Link from "next/link";
import { notFound, redirect } from "next/navigation";

import { AdminTicketReplyForm } from "@/components/admin/AdminTicketReplyForm";
import { TicketStatusSelect } from "@/components/admin/TicketStatusSelect";
import { Eyebrow } from "@/components/primitives/Eyebrow";
import { formatRelative } from "@/lib/admin/format";
import { getAdminTicketDetail } from "@/lib/admin/support";
import { hasPermissionAny } from "@/lib/auth/require";

export const metadata = { title: "Ticket" };
export const dynamic = "force-dynamic";

interface PageProps {
  params: Promise<{ ticketId: string }>;
}

export default async function AdminTicketDetailPage({ params }: PageProps) {
  if (!(await hasPermissionAny("view_support"))) redirect("/admin");

  const { ticketId } = await params;
  const ticket = await getAdminTicketDetail(ticketId);
  if (!ticket) notFound();

  const canManage = await hasPermissionAny("manage_support_tickets");

  return (
    <div className="space-y-12">
      <header className="space-y-4">
        <div className="flex flex-wrap items-center gap-3 text-[12px] uppercase tracking-[0.14em] text-[var(--color-text-muted)]">
          <Link href="/admin/support" className="nav-link hover:text-text">
            ← Tickets
          </Link>
          <span>·</span>
          <span>{ticket.severity}</span>
          {ticket.module && (
            <>
              <span>·</span>
              <span>{ticket.module.replace(/_/g, " ")}</span>
            </>
          )}
          <span>·</span>
          <Link
            href={`/admin/clients/${ticket.organization_id}`}
            className="nav-link hover:text-text"
          >
            {ticket.organization_name ?? "Client"}
          </Link>
        </div>
        <h1 className="text-display text-[clamp(1.8rem,4vw,2.6rem)] font-medium leading-[1.05] tracking-[-0.02em]">
          {ticket.title}
        </h1>
        <p className="text-[14px] text-[var(--color-text-faded)]">
          Opened {formatRelative(ticket.created_at)} by{" "}
          {ticket.reported_by_name ?? "Anonymous"}
        </p>
      </header>

      <section className="flex flex-wrap items-center justify-between gap-4 rounded-2xl border border-hairline bg-bg-elev/30 px-7 py-5">
        <div className="space-y-1">
          <Eyebrow number="00">Status</Eyebrow>
          <p className="text-[14px] text-text">
            {ticket.status.replace(/_/g, " ")}
            {ticket.closed_at && (
              <span className="ml-2 text-[var(--color-text-faded)]">
                · closed {formatRelative(ticket.closed_at)}
              </span>
            )}
          </p>
        </div>
        {canManage && (
          <div className="w-[260px]">
            <TicketStatusSelect
              ticketId={ticket.id}
              organizationId={ticket.organization_id}
              current={ticket.status}
            />
          </div>
        )}
      </section>

      <section className="rounded-2xl border border-hairline bg-bg-elev/30 p-8">
        <Eyebrow number="01">What happened</Eyebrow>
        <p className="mt-4 whitespace-pre-line text-[15px] leading-relaxed text-text">
          {ticket.description}
        </p>
      </section>

      <section className="space-y-4">
        <Eyebrow number="02">Thread</Eyebrow>
        {ticket.comments.length === 0 ? (
          <p className="rounded-2xl border border-dashed border-hairline bg-bg-elev/20 px-6 py-8 text-center text-[13.5px] text-[var(--color-text-muted)]">
            No replies yet.
          </p>
        ) : (
          <ol className="space-y-3">
            {ticket.comments.map((c) => (
              <li
                key={c.id}
                className={
                  c.is_internal
                    ? "rounded-2xl border border-[var(--color-signal-deep)]/40 bg-bg-elev/20 px-6 py-4"
                    : "rounded-2xl border border-hairline bg-bg-elev/30 px-6 py-4"
                }
              >
                <header className="flex items-baseline justify-between gap-3 text-[12px] text-[var(--color-text-muted)]">
                  <span>
                    {c.author_name ?? "—"}
                    {c.is_internal && (
                      <span className="ml-2 rounded-full bg-[var(--color-signal)]/15 px-2 py-0.5 font-mono text-[10px] uppercase tracking-[0.12em] text-[var(--color-signal)]">
                        Internal · staff only
                      </span>
                    )}
                  </span>
                  <time>{formatRelative(c.created_at)}</time>
                </header>
                <p className="mt-2 whitespace-pre-line text-[14.5px] leading-relaxed text-text">
                  {c.body}
                </p>
              </li>
            ))}
          </ol>
        )}
      </section>

      {canManage && (
        <section className="rounded-2xl border border-hairline bg-bg-elev/30 p-8">
          <Eyebrow number="03">Reply</Eyebrow>
          <div className="mt-4">
            <AdminTicketReplyForm
              ticketId={ticket.id}
              organizationId={ticket.organization_id}
            />
          </div>
        </section>
      )}
    </div>
  );
}
