interface HealthBandBadgeProps {
  band: string | null;
  score: number | null;
}

/**
 * Reused across maintenance + dashboard. Tone follows the family rule:
 * "healthy/strong" is amber-positive, "watch" is soft-amber bordered,
 * "at_risk/critical" stays amber but in a heavier weight, "unknown"
 * stays faint. We deliberately avoid red/green so the surface reads as
 * Kerning, not a traffic-light dashboard.
 */
export function HealthBandBadge({ band, score }: HealthBandBadgeProps) {
  if (band == null) {
    return (
      <span className="rounded-full border border-hairline px-2.5 py-1 font-mono text-[10px] uppercase tracking-[0.14em] text-[var(--color-text-faint)]">
        Pending
      </span>
    );
  }
  const isAlerting = band === "at_risk" || band === "critical";
  const isWatch = band === "watch";
  const tone = isAlerting
    ? "bg-[var(--color-signal)]/20 text-[var(--color-signal)] border border-[var(--color-signal)]"
    : isWatch
      ? "border border-[var(--color-signal-deep)] text-[var(--color-signal-soft)]"
      : "bg-[var(--color-signal)]/15 text-[var(--color-signal)]";
  const label = band.replace("_", " ");
  return (
    <span
      className={`inline-flex items-center gap-2 rounded-full px-2.5 py-1 font-mono text-[10px] uppercase tracking-[0.14em] ${tone}`}
    >
      {score != null && (
        <span className="text-[11px] tabular-nums tracking-normal">{score}</span>
      )}
      {label}
    </span>
  );
}
