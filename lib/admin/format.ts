/**
 * Shared display formatters for admin lists. Keep pure + side-effect free
 * so they can run on the server during SSR.
 */

export function formatMoney(cents: number, currency = "EUR"): string {
  return new Intl.NumberFormat("en-GB", {
    style: "currency",
    currency,
    maximumFractionDigits: 0,
  }).format(cents / 100);
}

export function formatRelative(input: string | Date | null): string {
  if (!input) return "—";
  const date = typeof input === "string" ? new Date(input) : input;
  const now = Date.now();
  const diff = date.getTime() - now;
  const seconds = Math.round(diff / 1000);
  const absSec = Math.abs(seconds);
  const fmt = new Intl.RelativeTimeFormat("en", { numeric: "auto" });

  if (absSec < 60) return fmt.format(seconds, "seconds");
  if (absSec < 3600) return fmt.format(Math.round(seconds / 60), "minutes");
  if (absSec < 86400) return fmt.format(Math.round(seconds / 3600), "hours");
  if (absSec < 86400 * 30) return fmt.format(Math.round(seconds / 86400), "days");
  return date.toLocaleDateString("en-GB", {
    day: "numeric",
    month: "short",
    year: "numeric",
  });
}

export function formatDate(input: string | Date | null): string {
  if (!input) return "—";
  const date = typeof input === "string" ? new Date(input) : input;
  return date.toLocaleDateString("en-GB", {
    day: "numeric",
    month: "short",
    year: "numeric",
  });
}

export function formatDeployment(
  type: "cloud" | "sovereign_cloud" | "on_prem" | "air_gapped" | null,
): string {
  switch (type) {
    case "cloud":
      return "Cloud";
    case "sovereign_cloud":
      return "Sovereign cloud";
    case "on_prem":
      return "On-prem";
    case "air_gapped":
      return "Air-gapped";
    default:
      return "—";
  }
}

export function formatModule(slug: string): string {
  // turn `predictive_maintenance` → `Predictive maintenance`
  const spaced = slug.replace(/_/g, " ");
  return spaced.charAt(0).toUpperCase() + spaced.slice(1);
}

export function healthBand(score: number | null): "strong" | "ok" | "watch" | "risk" | "unknown" {
  if (score == null) return "unknown";
  if (score >= 85) return "strong";
  if (score >= 70) return "ok";
  if (score >= 55) return "watch";
  return "risk";
}
