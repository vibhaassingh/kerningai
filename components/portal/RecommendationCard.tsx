import Link from "next/link";

import { formatRelative } from "@/lib/admin/format";
import type { AgentRecommendation } from "@/lib/portal/agents";

interface RecommendationCardProps {
  rec: AgentRecommendation;
  /** When true, renders as a compact list row (no big inline action). */
  compact?: boolean;
}

export function RecommendationCard({ rec, compact = false }: RecommendationCardProps) {
  return (
    <article className="space-y-5 rounded-2xl border border-hairline bg-bg-elev/30 p-7 transition-colors hover:border-hairline-strong">
      <header className="flex flex-wrap items-start justify-between gap-3">
        <div className="space-y-1.5">
          <p className="font-mono text-[10px] uppercase tracking-[0.16em] text-[var(--color-text-muted)]">
            {rec.template_name ?? rec.template_slug.replace(/_/g, " ")}
            {rec.asset_name && (
              <>
                <span className="mx-2 text-[var(--color-text-faint)]">·</span>
                {rec.asset_name}
              </>
            )}
            {rec.site_name && (
              <>
                <span className="mx-2 text-[var(--color-text-faint)]">·</span>
                {rec.site_name}
              </>
            )}
          </p>
          <Link
            href={`/portal/agents/${rec.id}`}
            className="block text-display text-[1.3rem] font-medium leading-[1.15] tracking-[-0.015em] text-text hover:text-[var(--color-signal)]"
          >
            {rec.title}
          </Link>
        </div>
        <RiskPill risk={rec.risk_level} />
      </header>

      <p className="text-[14.5px] leading-relaxed text-[var(--color-text-faded)]">
        {rec.summary}
      </p>

      {!compact && rec.evidence.length > 0 && (
        <dl className="grid gap-x-6 gap-y-2 text-[12.5px] sm:grid-cols-3">
          {rec.evidence.map((e) => (
            <div key={e.label} className="space-y-0.5">
              <dt className="font-mono text-[10px] uppercase tracking-[0.14em] text-[var(--color-text-faint)]">
                {e.label}
              </dt>
              <dd className="text-text">{e.value}</dd>
            </div>
          ))}
        </dl>
      )}

      <footer className="flex flex-wrap items-center justify-between gap-3 border-t border-hairline pt-4 text-[12px] text-[var(--color-text-muted)]">
        <div className="flex flex-wrap items-center gap-3">
          {rec.confidence != null && (
            <span className="font-mono">
              Confidence {Math.round(rec.confidence * 100)}%
            </span>
          )}
          {rec.expires_at && (
            <span className="font-mono">Expires {formatRelative(rec.expires_at)}</span>
          )}
        </div>
        <Link
          href={`/portal/agents/${rec.id}`}
          className="nav-link text-[12px] uppercase tracking-[0.12em] text-text"
        >
          Review →
        </Link>
      </footer>
    </article>
  );
}

function RiskPill({ risk }: { risk: string }) {
  const isCritical = risk === "critical_approval" || risk === "blocked";
  const isApproval = risk === "requires_approval" || isCritical;
  const tone = isCritical
    ? "bg-[var(--color-signal)]/20 text-[var(--color-signal)] border border-[var(--color-signal)]"
    : isApproval
      ? "bg-[var(--color-signal)]/15 text-[var(--color-signal)]"
      : "border border-hairline text-[var(--color-text-faded)]";
  return (
    <span
      className={`shrink-0 rounded-full px-2.5 py-1 font-mono text-[10px] uppercase tracking-[0.14em] ${tone}`}
    >
      {risk.replace(/_/g, " ")}
    </span>
  );
}
