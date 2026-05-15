import Link from "next/link";

import { HealthBadge } from "@/components/admin/HealthBadge";
import { Eyebrow } from "@/components/primitives/Eyebrow";
import { getCommandCenterMetrics } from "@/lib/admin/command-center";
import { formatModule, formatMoney, formatRelative } from "@/lib/admin/format";

export const metadata = { title: "Command Center" };
export const dynamic = "force-dynamic";

export default async function CommandCenterPage() {
  const m = await getCommandCenterMetrics();

  return (
    <div className="space-y-14">
      <header className="space-y-4">
        <Eyebrow number="01">Operational signal</Eyebrow>
        <h1 className="text-display text-[clamp(2rem,5vw,3.2rem)] font-medium leading-[1.05] tracking-[-0.03em]">
          Every <span className="italic text-[var(--color-signal)]">Kerning</span> workspace, in one view.
        </h1>
      </header>

      <section className="grid gap-px overflow-hidden rounded-2xl border border-hairline bg-hairline sm:grid-cols-2 lg:grid-cols-4">
        <Metric number="01" label="Active clients" value={m.activeClients} hint={`${m.totalClients} total`} />
        <Metric number="02" label="Sites monitored" value={m.sitesMonitored} />
        <Metric number="03" label="People with access" value={m.peopleWithAccess} hint={`${m.pendingInvites} pending invite${m.pendingInvites === 1 ? "" : "s"}`} />
        <Metric
          number="04"
          label="Total MRR"
          value={formatMoney(m.totalMrrCents, m.currency)}
          hint={`${m.auditEventsLast24h} audit event${m.auditEventsLast24h === 1 ? "" : "s"} in 24h`}
        />
      </section>

      <section className="grid gap-8 lg:grid-cols-[1.4fr_1fr]">
        <article className="space-y-4 rounded-2xl border border-hairline bg-bg-elev/30 p-8">
          <header className="flex items-end justify-between gap-4">
            <Eyebrow number="05">Client health</Eyebrow>
            <Link
              href="/admin/clients"
              className="font-mono text-[11px] uppercase tracking-[0.14em] text-[var(--color-text-muted)] hover:text-text"
            >
              View all ↗
            </Link>
          </header>
          <ul className="divide-y divide-hairline">
            {m.clientHealth.length === 0 && (
              <li className="py-6 text-[13px] text-[var(--color-text-muted)]">
                No clients yet.
              </li>
            )}
            {m.clientHealth.map((c) => (
              <li
                key={c.organization_id}
                className="flex items-center justify-between gap-4 py-4"
              >
                <div className="space-y-0.5">
                  <Link
                    href={`/admin/clients/${c.organization_id}`}
                    className="text-text hover:text-[var(--color-signal)]"
                  >
                    {c.name}
                  </Link>
                  <p className="text-[11.5px] uppercase tracking-[0.1em] text-[var(--color-text-muted)]">
                    {c.industry ? formatModule(c.industry) : "—"} · {c.region}
                  </p>
                </div>
                <HealthBadge score={c.health_score} />
              </li>
            ))}
          </ul>
        </article>

        <article className="space-y-4 rounded-2xl border border-hairline bg-bg-elev/30 p-8">
          <Eyebrow number="06">Module adoption</Eyebrow>
          {m.modulesAdoption.length === 0 ? (
            <p className="text-[13px] text-[var(--color-text-muted)]">
              No modules enabled across clients yet.
            </p>
          ) : (
            <ul className="space-y-3">
              {m.modulesAdoption.map((mod) => (
                <li key={mod.module} className="space-y-1.5">
                  <div className="flex items-center justify-between gap-3 text-[13.5px]">
                    <span className="text-text">{formatModule(mod.module)}</span>
                    <span className="font-mono tabular-nums text-[var(--color-text-faded)]">
                      {mod.clientCount} / {m.totalClients}
                    </span>
                  </div>
                  <div className="h-[3px] w-full overflow-hidden rounded-full bg-hairline">
                    <div
                      className="h-full bg-[var(--color-signal)]"
                      style={{
                        width: `${
                          m.totalClients > 0
                            ? (mod.clientCount / m.totalClients) * 100
                            : 0
                        }%`,
                      }}
                    />
                  </div>
                </li>
              ))}
            </ul>
          )}
        </article>
      </section>

      <section className="space-y-4">
        <header className="flex items-end justify-between gap-4">
          <Eyebrow number="07">Recent audit events</Eyebrow>
          <Link
            href="/admin/security/audit-log"
            className="font-mono text-[11px] uppercase tracking-[0.14em] text-[var(--color-text-muted)] hover:text-text"
          >
            Open audit log ↗
          </Link>
        </header>
        <div className="overflow-hidden rounded-2xl border border-hairline bg-bg-elev/30">
          {m.recentAuditEvents.length === 0 ? (
            <p className="px-6 py-10 text-center text-[13px] text-[var(--color-text-muted)]">
              No audit events yet. Try inviting a teammate.
            </p>
          ) : (
            <ul className="divide-y divide-hairline">
              {m.recentAuditEvents.map((e) => (
                <li
                  key={e.id}
                  className="grid grid-cols-[180px_1fr_240px] items-center gap-4 px-6 py-3 text-[13.5px]"
                >
                  <time
                    dateTime={e.created_at}
                    className="font-mono text-[12px] text-[var(--color-text-muted)]"
                  >
                    {formatRelative(e.created_at)}
                  </time>
                  <div className="space-y-0.5">
                    <p className="font-mono text-[12.5px] text-text">{e.action}</p>
                    <p className="text-[11.5px] text-[var(--color-text-muted)]">
                      {e.resource_type}
                      {e.organization_name && ` · ${e.organization_name}`}
                    </p>
                  </div>
                  <span className="text-right text-[12.5px] text-[var(--color-text-faded)]">
                    {e.actor_name ?? <span className="text-[var(--color-text-faint)]">system</span>}
                  </span>
                </li>
              ))}
            </ul>
          )}
        </div>
      </section>
    </div>
  );
}

function Metric({
  number,
  label,
  value,
  hint,
}: {
  number: string;
  label: string;
  value: number | string;
  hint?: string;
}) {
  return (
    <article className="space-y-3 bg-bg-elev/40 px-6 py-7">
      <p className="font-mono text-[10px] uppercase tracking-[0.14em] text-[var(--color-text-faint)]">
        {number} — {label}
      </p>
      <p className="text-stat text-[2.4rem] font-medium text-text tabular-nums">
        {typeof value === "number" ? value.toLocaleString("en-GB") : value}
      </p>
      {hint && (
        <p className="text-[11px] uppercase tracking-[0.1em] text-[var(--color-text-muted)]">
          {hint}
        </p>
      )}
    </article>
  );
}
