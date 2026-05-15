import { redirect } from "next/navigation";

import { DataTable, type DataTableColumn } from "@/components/data/DataTable";
import { Eyebrow } from "@/components/primitives/Eyebrow";
import { formatDate, formatRelative } from "@/lib/admin/format";
import { hasPermissionAny } from "@/lib/auth/require";
import {
  getComplianceOverview,
  type AuditRunRow,
  type CorrectiveAction,
  type Incident,
  type TemperatureLogRow,
} from "@/lib/portal/compliance";
import { getPortalContext } from "@/lib/portal/team";

export const metadata = { title: "Compliance" };
export const dynamic = "force-dynamic";

export default async function PortalCompliancePage() {
  const ctx = await getPortalContext();
  if (!ctx) redirect("/portal");
  if (!(await hasPermissionAny("view_compliance"))) redirect("/portal/dashboard");

  const data = await getComplianceOverview(ctx.organizationId);

  const auditColumns: DataTableColumn<AuditRunRow>[] = [
    {
      key: "audit",
      header: "Audit",
      cell: (a) => (
        <div className="space-y-0.5">
          <div className="text-text">{a.name}</div>
          <div className="text-[11.5px] text-[var(--color-text-muted)]">
            {a.framework_name ?? a.framework_slug ?? "—"} · {a.site_name ?? "—"}
          </div>
        </div>
      ),
      className: "w-[42%]",
    },
    {
      key: "scheduled",
      header: "Scheduled",
      cell: (a) => formatDate(a.scheduled_for),
    },
    {
      key: "status",
      header: "Status",
      cell: (a) => (
        <span
          className={
            a.status === "flagged"
              ? "rounded-full bg-[var(--color-signal)]/15 px-2.5 py-1 font-mono text-[10px] uppercase tracking-[0.12em] text-[var(--color-signal)]"
              : a.status === "passed"
                ? "rounded-full border border-[var(--color-signal-deep)] px-2.5 py-1 font-mono text-[10px] uppercase tracking-[0.12em] text-[var(--color-signal-soft)]"
                : "rounded-full border border-hairline px-2.5 py-1 font-mono text-[10px] uppercase tracking-[0.12em] text-[var(--color-text-faded)]"
          }
        >
          {a.status}
        </span>
      ),
    },
    {
      key: "score",
      header: "Score",
      cell: (a) =>
        a.score != null ? (
          <span className="font-mono tabular-nums text-text">{a.score}</span>
        ) : (
          <span className="text-[var(--color-text-faint)]">—</span>
        ),
    },
  ];

  const actionColumns: DataTableColumn<CorrectiveAction>[] = [
    {
      key: "title",
      header: "Action",
      cell: (a) => (
        <div className="space-y-0.5">
          <div className="text-text">{a.title}</div>
          {a.site_name && (
            <div className="text-[11.5px] text-[var(--color-text-muted)]">
              {a.site_name}
            </div>
          )}
        </div>
      ),
      className: "w-[48%]",
    },
    {
      key: "status",
      header: "Status",
      cell: (a) => (
        <span
          className={
            a.status === "closed"
              ? "rounded-full border border-hairline px-2.5 py-1 font-mono text-[10px] uppercase tracking-[0.12em] text-[var(--color-text-faded)]"
              : "rounded-full bg-[var(--color-signal)]/15 px-2.5 py-1 font-mono text-[10px] uppercase tracking-[0.12em] text-[var(--color-signal)]"
          }
        >
          {a.status.replace(/_/g, " ")}
        </span>
      ),
    },
    {
      key: "due",
      header: "Due",
      cell: (a) =>
        a.due_at ? (
          formatDate(a.due_at)
        ) : (
          <span className="text-[var(--color-text-faint)]">—</span>
        ),
    },
  ];

  return (
    <div className="space-y-12">
      <header className="space-y-4">
        <Eyebrow number="06">Compliance · today</Eyebrow>
        <h1 className="text-display text-[clamp(2rem,5vw,3rem)] font-medium leading-[1.05] tracking-[-0.03em]">
          Audit-ready, <span className="italic text-[var(--color-signal)]">always</span>.
        </h1>
        <p className="max-w-xl text-[15px] leading-relaxed text-[var(--color-text-faded)]">
          Live audit calendar, corrective actions, cold-chain logs and
          incident reporting — surfaced together so nothing falls
          between teams.
        </p>
      </header>

      <section className="grid gap-px overflow-hidden rounded-2xl border border-hairline bg-hairline sm:grid-cols-4">
        <Tile number="01" label="Readiness score" value={`${data.readinessScore}/100`} />
        <Tile number="02" label="Upcoming audits" value={data.upcoming.length.toString()} />
        <Tile
          number="03"
          label="Open actions"
          value={data.actions.filter((a) => a.status !== "closed").length.toString()}
        />
        <Tile
          number="04"
          label="Open incidents"
          value={data.incidents.filter((i) => i.status !== "closed").length.toString()}
        />
      </section>

      <section className="space-y-4">
        <Eyebrow number="05">Audits</Eyebrow>
        <DataTable
          rows={[...data.upcoming, ...data.recent]}
          columns={auditColumns}
          rowKey={(r) => r.id}
          emptyState="No audits scheduled."
        />
      </section>

      <section className="space-y-4">
        <Eyebrow number="06">Corrective actions</Eyebrow>
        <DataTable
          rows={data.actions}
          columns={actionColumns}
          rowKey={(r) => r.id}
          emptyState="No open corrective actions. Nice."
        />
      </section>

      <section className="space-y-4">
        <Eyebrow number="07">Recent incidents</Eyebrow>
        <ul className="overflow-hidden rounded-2xl border border-hairline bg-bg-elev/30">
          {data.incidents.length === 0 ? (
            <li className="px-6 py-10 text-center text-[13px] text-[var(--color-text-muted)]">
              No incidents logged in the last 30 days.
            </li>
          ) : (
            data.incidents.map((i: Incident) => (
              <li
                key={i.id}
                className="grid gap-3 border-b border-hairline px-6 py-4 last:border-b-0 sm:grid-cols-[140px_1fr_120px]"
              >
                <time className="font-mono text-[11.5px] uppercase tracking-[0.12em] text-[var(--color-text-muted)]">
                  {formatRelative(i.occurred_at)}
                </time>
                <div className="space-y-0.5">
                  <p className="text-text">{i.title}</p>
                  {i.description && (
                    <p className="line-clamp-1 text-[12.5px] text-[var(--color-text-faded)]">
                      {i.description}
                    </p>
                  )}
                </div>
                <span
                  className={
                    i.severity === "high" || i.severity === "critical"
                      ? "rounded-full bg-[var(--color-signal)]/15 px-2.5 py-1 text-center font-mono text-[10px] uppercase tracking-[0.12em] text-[var(--color-signal)]"
                      : "rounded-full border border-hairline px-2.5 py-1 text-center font-mono text-[10px] uppercase tracking-[0.12em] text-[var(--color-text-faded)]"
                  }
                >
                  {i.severity}
                </span>
              </li>
            ))
          )}
        </ul>
      </section>

      <section className="space-y-4">
        <Eyebrow number="08">Latest temperature logs</Eyebrow>
        <ul className="overflow-hidden rounded-2xl border border-hairline bg-bg-elev/30">
          {data.temperatureLogs.length === 0 ? (
            <li className="px-6 py-10 text-center text-[13px] text-[var(--color-text-muted)]">
              No recent temperature logs.
            </li>
          ) : (
            data.temperatureLogs.map((t: TemperatureLogRow) => (
              <li
                key={t.id}
                className="grid gap-3 border-b border-hairline px-6 py-3 last:border-b-0 sm:grid-cols-[160px_1fr_120px_80px]"
              >
                <time className="font-mono text-[11.5px] uppercase tracking-[0.12em] text-[var(--color-text-muted)]">
                  {formatRelative(t.recorded_at)}
                </time>
                <p className="text-text">
                  {t.asset_name ?? "—"}
                  {t.site_name && (
                    <span className="text-[var(--color-text-faded)]"> · {t.site_name}</span>
                  )}
                </p>
                <p className="font-mono tabular-nums text-text">
                  {t.temperature_c.toFixed(1)}°C
                  {t.setpoint_c != null && (
                    <span className="text-[var(--color-text-muted)]"> / {t.setpoint_c.toFixed(1)}°C</span>
                  )}
                </p>
                <span
                  className={
                    t.in_envelope
                      ? "rounded-full border border-hairline px-2 py-0.5 text-center font-mono text-[10px] uppercase tracking-[0.12em] text-[var(--color-text-faded)]"
                      : "rounded-full bg-[var(--color-signal)]/15 px-2 py-0.5 text-center font-mono text-[10px] uppercase tracking-[0.12em] text-[var(--color-signal)]"
                  }
                >
                  {t.in_envelope ? "OK" : "breach"}
                </span>
              </li>
            ))
          )}
        </ul>
      </section>
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
