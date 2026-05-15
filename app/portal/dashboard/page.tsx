import Link from "next/link";
import { redirect } from "next/navigation";

import { Eyebrow } from "@/components/primitives/Eyebrow";
import { RecommendationCard } from "@/components/portal/RecommendationCard";
import { HealthBandBadge } from "@/components/portal/HealthBandBadge";
import { formatRelative } from "@/lib/admin/format";
import { listAssetsForClient } from "@/lib/portal/maintenance";
import { listPendingRecommendations } from "@/lib/portal/agents";
import { getPortalContext } from "@/lib/portal/team";

export const metadata = { title: "Dashboard" };
export const dynamic = "force-dynamic";

export default async function PortalDashboardPage() {
  const ctx = await getPortalContext();
  if (!ctx) redirect("/portal");

  const [assets, pendingRecs] = await Promise.all([
    listAssetsForClient(ctx.organizationId),
    listPendingRecommendations(ctx.organizationId),
  ]);

  const atRisk = assets.filter(
    (a) => a.status === "at_risk" || a.health_band === "at_risk" || a.health_band === "critical",
  );
  const watch = assets.filter((a) => a.status === "watch" || a.health_band === "watch");
  const critical = pendingRecs.filter(
    (r) => r.risk_level === "critical_approval" || r.risk_level === "blocked",
  );
  const topAlerts = [...atRisk, ...watch].slice(0, 4);

  return (
    <div className="space-y-14">
      <header className="space-y-4">
        <Eyebrow number="01">Today · {ctx.organizationName}</Eyebrow>
        <h1 className="text-display text-[clamp(2rem,5vw,3.2rem)] font-medium leading-[1.05] tracking-[-0.03em]">
          What needs <span className="italic text-[var(--color-signal)]">your attention</span>.
        </h1>
      </header>

      <section className="grid gap-px overflow-hidden rounded-2xl border border-hairline bg-hairline sm:grid-cols-2 lg:grid-cols-4">
        <Tile
          number="01"
          label="Pending approvals"
          value={pendingRecs.length.toString()}
          hint={`${critical.length} critical`}
          link={{ href: "/portal/agents/inbox", label: "Inbox ↗" }}
        />
        <Tile
          number="02"
          label="Assets at risk"
          value={atRisk.length.toString()}
          hint={`${watch.length} on watch`}
          link={{ href: "/portal/maintenance", label: "Maintenance ↗" }}
        />
        <Tile
          number="03"
          label="Healthy assets"
          value={(assets.length - atRisk.length - watch.length).toString()}
          hint={`${assets.length} total`}
        />
        <Tile
          number="04"
          label="Sites"
          value={new Set(assets.map((a) => a.site_id).filter(Boolean)).size.toString()}
        />
      </section>

      <section className="grid gap-10 lg:grid-cols-[1.3fr_1fr]">
        <article className="space-y-5">
          <header className="flex items-end justify-between gap-3">
            <Eyebrow number="02">Top agent signals</Eyebrow>
            <Link
              href="/portal/agents/inbox"
              className="nav-link text-[11.5px] uppercase tracking-[0.12em] text-[var(--color-text-muted)]"
            >
              See all ↗
            </Link>
          </header>
          {pendingRecs.length === 0 ? (
            <p className="rounded-2xl border border-dashed border-hairline bg-bg-elev/20 px-6 py-12 text-center text-[14px] text-[var(--color-text-muted)]">
              No agent recommendations right now.
            </p>
          ) : (
            <div className="space-y-5">
              {pendingRecs.slice(0, 3).map((rec) => (
                <RecommendationCard key={rec.id} rec={rec} compact />
              ))}
            </div>
          )}
        </article>

        <article className="space-y-5">
          <header className="flex items-end justify-between gap-3">
            <Eyebrow number="03">Asset spotlight</Eyebrow>
            <Link
              href="/portal/maintenance"
              className="nav-link text-[11.5px] uppercase tracking-[0.12em] text-[var(--color-text-muted)]"
            >
              All assets ↗
            </Link>
          </header>
          {topAlerts.length === 0 ? (
            <p className="rounded-2xl border border-dashed border-hairline bg-bg-elev/20 px-6 py-10 text-center text-[13.5px] text-[var(--color-text-muted)]">
              Every asset is in the healthy band.
            </p>
          ) : (
            <ul className="overflow-hidden rounded-2xl border border-hairline bg-bg-elev/30">
              {topAlerts.map((a) => (
                <li
                  key={a.id}
                  className="grid gap-3 border-b border-hairline px-5 py-4 last:border-b-0 sm:grid-cols-[1fr_auto]"
                >
                  <Link
                    href={`/portal/maintenance/assets/${a.id}`}
                    className="space-y-0.5"
                  >
                    <div className="text-text">{a.name}</div>
                    <div className="text-[11.5px] text-[var(--color-text-muted)]">
                      {a.site_name ?? a.kind.replace(/_/g, " ")}
                      {a.observed_at && ` · ${formatRelative(a.observed_at)}`}
                    </div>
                  </Link>
                  <HealthBandBadge band={a.health_band} score={a.health_score} />
                </li>
              ))}
            </ul>
          )}
        </article>
      </section>
    </div>
  );
}

function Tile({
  number,
  label,
  value,
  hint,
  link,
}: {
  number: string;
  label: string;
  value: string;
  hint?: string;
  link?: { href: string; label: string };
}) {
  return (
    <article className="space-y-2 bg-bg-elev/40 px-6 py-6">
      <p className="font-mono text-[10px] uppercase tracking-[0.14em] text-[var(--color-text-faint)]">
        {number} — {label}
      </p>
      <p className="text-stat text-[2.4rem] font-medium text-text tabular-nums">
        {value}
      </p>
      <div className="flex items-center justify-between gap-3 text-[11px] uppercase tracking-[0.1em] text-[var(--color-text-muted)]">
        {hint ? <span>{hint}</span> : <span />}
        {link && (
          <Link href={link.href} className="nav-link text-text">
            {link.label}
          </Link>
        )}
      </div>
    </article>
  );
}
