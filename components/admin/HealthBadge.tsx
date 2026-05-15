import { healthBand } from "@/lib/admin/format";

interface HealthBadgeProps {
  score: number | null;
}

/**
 * Editorial health pill. Uses the amber signal for "strong/ok" and a
 * faint pill for "watch/risk/unknown" — we deliberately avoid red/green
 * traffic-light palette and stay in the family signal range.
 */
export function HealthBadge({ score }: HealthBadgeProps) {
  const band = healthBand(score);
  const label =
    band === "unknown"
      ? "Pending"
      : band === "strong"
        ? "Strong"
        : band === "ok"
          ? "Healthy"
          : band === "watch"
            ? "Watch"
            : "At risk";
  const tone =
    band === "strong" || band === "ok"
      ? "bg-[var(--color-signal)]/15 text-[var(--color-signal)]"
      : band === "watch"
        ? "border border-[var(--color-signal-deep)] text-[var(--color-signal-soft)]"
        : band === "risk"
          ? "border border-hairline-strong text-[var(--color-text-faded)]"
          : "border border-hairline text-[var(--color-text-faint)]";

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
