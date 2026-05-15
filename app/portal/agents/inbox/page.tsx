import Link from "next/link";
import { redirect } from "next/navigation";

import { Eyebrow } from "@/components/primitives/Eyebrow";
import { RecommendationCard } from "@/components/portal/RecommendationCard";
import { hasPermissionAny } from "@/lib/auth/require";
import {
  listDecidedRecommendations,
  listPendingRecommendations,
} from "@/lib/portal/agents";
import { getPortalContext } from "@/lib/portal/team";

export const metadata = { title: "Agent inbox" };
export const dynamic = "force-dynamic";

export default async function AgentInboxPage() {
  const ctx = await getPortalContext();
  if (!ctx) redirect("/portal");
  if (!(await hasPermissionAny("approve_agent_actions")) && !(await hasPermissionAny("view_dashboard"))) {
    redirect("/portal/dashboard");
  }

  const [pending, recentlyDecided] = await Promise.all([
    listPendingRecommendations(ctx.organizationId),
    listDecidedRecommendations(ctx.organizationId),
  ]);

  const critical = pending.filter(
    (r) => r.risk_level === "critical_approval" || r.risk_level === "blocked",
  );

  return (
    <div className="space-y-14">
      <header className="space-y-4">
        <Eyebrow number="03">Agents · inbox</Eyebrow>
        <h1 className="text-display text-[clamp(2rem,5vw,3rem)] font-medium leading-[1.05] tracking-[-0.03em]">
          What the <span className="italic text-[var(--color-signal)]">agents</span> are seeing.
        </h1>
        <p className="max-w-xl text-[15px] leading-relaxed text-[var(--color-text-faded)]">
          Recommendations need a human approver before they act. Each
          decision is captured in the action ledger.
        </p>
      </header>

      <section className="grid gap-px overflow-hidden rounded-2xl border border-hairline bg-hairline sm:grid-cols-3">
        <Tile number="01" label="Pending" value={pending.length.toString()} />
        <Tile number="02" label="Critical" value={critical.length.toString()} />
        <Tile
          number="03"
          label="Decided"
          value={recentlyDecided.length.toString()}
          link={{ href: "/portal/agents/history", label: "History ↗" }}
        />
      </section>

      <section className="space-y-6">
        <header className="flex items-end justify-between gap-3">
          <Eyebrow number="04">Awaiting decision</Eyebrow>
          <Link
            href="/portal/agents/history"
            className="nav-link text-[11.5px] uppercase tracking-[0.12em] text-[var(--color-text-muted)]"
          >
            See history ↗
          </Link>
        </header>
        {pending.length === 0 ? (
          <p className="rounded-2xl border border-dashed border-hairline bg-bg-elev/20 px-6 py-12 text-center text-[14px] text-[var(--color-text-muted)]">
            Nothing pending. The agents are quiet right now.
          </p>
        ) : (
          <div className="grid gap-5 lg:grid-cols-2">
            {pending.map((rec) => (
              <RecommendationCard key={rec.id} rec={rec} />
            ))}
          </div>
        )}
      </section>
    </div>
  );
}

function Tile({
  number,
  label,
  value,
  link,
}: {
  number: string;
  label: string;
  value: string;
  link?: { href: string; label: string };
}) {
  return (
    <article className="space-y-2 bg-bg-elev/40 px-6 py-5">
      <p className="font-mono text-[10px] uppercase tracking-[0.14em] text-[var(--color-text-faint)]">
        {number} — {label}
      </p>
      <div className="flex items-baseline justify-between gap-3">
        <p className="text-stat text-[1.8rem] font-medium text-text">{value}</p>
        {link && (
          <Link
            href={link.href}
            className="nav-link text-[11px] uppercase tracking-[0.12em] text-[var(--color-text-muted)]"
          >
            {link.label}
          </Link>
        )}
      </div>
    </article>
  );
}
