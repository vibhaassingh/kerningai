import { redirect } from "next/navigation";

import { Eyebrow } from "@/components/primitives/Eyebrow";
import { hasPermissionAny } from "@/lib/auth/require";
import { getSystemHealth } from "@/lib/admin/system-health";
import { formatRelative } from "@/lib/admin/format";

export const metadata = { title: "System Health" };
export const dynamic = "force-dynamic";

export default async function SystemHealthPage() {
  if (!(await hasPermissionAny("view_system_health"))) redirect("/admin");

  const h = await getSystemHealth();

  const cards: {
    number: string;
    label: string;
    value: string | number;
    hint?: string;
    tone?: "ok" | "warn" | "bad";
  }[] = [
    {
      number: "01",
      label: "Agent runs · 24h",
      value: h.agentRunsLast24h,
      hint: `${h.agentRunsFailedLast24h} failed`,
      tone: h.agentRunsFailedLast24h > 0 ? "warn" : "ok",
    },
    {
      number: "02",
      label: "Pending recommendations",
      value: h.pendingRecommendations,
      hint: `${h.expiredRecommendations} expired`,
      tone: h.pendingRecommendations > 50 ? "warn" : "ok",
    },
    {
      number: "03",
      label: "Stale invites",
      value: h.staleInvites,
      tone: h.staleInvites > 0 ? "warn" : "ok",
    },
    {
      number: "04",
      label: "Open corrective actions",
      value: h.openCorrectiveActions,
      tone: h.openCorrectiveActions > 0 ? "warn" : "ok",
    },
    {
      number: "05",
      label: "Unresolved energy anomalies",
      value: h.unresolvedEnergyAnomalies,
      tone: h.unresolvedEnergyAnomalies > 0 ? "warn" : "ok",
    },
    {
      number: "06",
      label: "Audit events · 24h",
      value: h.auditEventsLast24h,
      hint: `${h.securityEventsLast24h} security`,
    },
  ];

  return (
    <div className="space-y-14">
      <header className="space-y-4">
        <Eyebrow number="01">System health</Eyebrow>
        <h1 className="text-display text-[clamp(2rem,5vw,3.2rem)] font-medium leading-[1.05] tracking-[-0.03em]">
          The platform&apos;s <span className="italic text-[var(--color-signal)]">vital signs</span>.
        </h1>
        <p className="max-w-xl text-[15px] leading-relaxed text-[var(--color-text-faded)]">
          DB-derived operational backlog the cron jobs and agents own.
          Forwarded to Sentry when a DSN is configured.
        </p>
      </header>

      <section className="grid gap-px overflow-hidden rounded-2xl border border-hairline bg-hairline sm:grid-cols-2 lg:grid-cols-3">
        {cards.map((c) => (
          <article key={c.number} className="space-y-2 bg-bg-elev/40 px-6 py-6">
            <p className="font-mono text-[10px] uppercase tracking-[0.14em] text-[var(--color-text-faint)]">
              {c.number} — {c.label}
            </p>
            <p
              className={
                c.tone === "warn"
                  ? "text-stat text-[2rem] font-medium text-[var(--color-signal)]"
                  : c.tone === "bad"
                    ? "text-stat text-[2rem] font-medium text-[var(--color-canvas-pain)]"
                    : "text-stat text-[2rem] font-medium text-text"
              }
            >
              {c.value}
            </p>
            {c.hint && (
              <p className="text-[12px] text-[var(--color-text-muted)]">{c.hint}</p>
            )}
          </article>
        ))}
      </section>

      <section className="grid gap-px overflow-hidden rounded-2xl border border-hairline bg-hairline sm:grid-cols-3">
        <Fact label="Last agent run" value={h.lastAgentRunAt ? formatRelative(h.lastAgentRunAt) : "never"} />
        <Fact label="Last cron audit" value={h.lastCronAuditAt ? formatRelative(h.lastCronAuditAt) : "never"} />
        <Fact label="Cron secret" value={h.cronConfigured ? "configured" : "missing"} />
      </section>
    </div>
  );
}

function Fact({ label, value }: { label: string; value: string }) {
  return (
    <div className="space-y-1 bg-bg-elev/40 px-6 py-5">
      <p className="font-mono text-[10px] uppercase tracking-[0.14em] text-[var(--color-text-faint)]">
        {label}
      </p>
      <p className="text-[14px] text-text">{value}</p>
    </div>
  );
}
