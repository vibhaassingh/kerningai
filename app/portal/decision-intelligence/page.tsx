import { redirect } from "next/navigation";

import { Eyebrow } from "@/components/primitives/Eyebrow";
import { hasPermissionAny } from "@/lib/auth/require";
import { listLatestMetrics } from "@/lib/portal/decision-intelligence";
import { getPortalContext } from "@/lib/portal/team";

export const metadata = { title: "Decision Intelligence" };
export const dynamic = "force-dynamic";

const CATEGORY_ORDER = ["financial", "operational", "sustainability", "compliance", "other"];
const CATEGORY_LABEL: Record<string, string> = {
  financial: "Financial",
  operational: "Operational",
  sustainability: "Sustainability",
  compliance: "Compliance",
  other: "Other",
};

export default async function PortalDIPage() {
  const ctx = await getPortalContext();
  if (!ctx) redirect("/portal");
  if (!(await hasPermissionAny("view_decision_intelligence"))) redirect("/portal/dashboard");

  const metrics = await listLatestMetrics(ctx.organizationId);
  const byCategory = new Map<string, typeof metrics>();
  for (const m of metrics) {
    const list = byCategory.get(m.category) ?? [];
    list.push(m);
    byCategory.set(m.category, list);
  }

  return (
    <div className="space-y-14">
      <header className="space-y-4">
        <Eyebrow number="07">Decision intelligence · this month</Eyebrow>
        <h1 className="text-display text-[clamp(2rem,5vw,3rem)] font-medium leading-[1.05] tracking-[-0.03em]">
          The <span className="italic text-[var(--color-signal)]">executive read</span>.
        </h1>
        <p className="max-w-xl text-[15px] leading-relaxed text-[var(--color-text-faded)]">
          The same data the floor sees, summarised for leadership. Each
          tile shows the latest snapshot, change vs prior period, and
          progress toward target.
        </p>
      </header>

      {CATEGORY_ORDER.filter((c) => byCategory.has(c)).map((cat) => (
        <section key={cat} className="space-y-4">
          <Eyebrow number={String(CATEGORY_ORDER.indexOf(cat) + 1).padStart(2, "0")}>
            {CATEGORY_LABEL[cat] ?? cat}
          </Eyebrow>
          <ul className="grid gap-px overflow-hidden rounded-2xl border border-hairline bg-hairline sm:grid-cols-2 lg:grid-cols-3">
            {(byCategory.get(cat) ?? []).map((m) => (
              <li key={m.metric_slug} className="space-y-3 bg-bg-elev/40 px-6 py-5">
                <p className="font-mono text-[10.5px] uppercase tracking-[0.14em] text-[var(--color-text-faint)]">
                  {m.metric_name}
                </p>
                <p className="text-stat text-[2rem] font-medium leading-none text-text tabular-nums">
                  {formatMetricValue(m.value, m.unit)}
                  {m.unit !== "EUR" && m.unit !== "" && m.unit !== "kg CO2e" && (
                    <span className="ml-1 text-[0.8rem] text-[var(--color-text-muted)]">
                      {m.unit}
                    </span>
                  )}
                </p>
                <div className="flex items-center justify-between gap-3 text-[11px] uppercase tracking-[0.1em]">
                  {m.delta_pct != null ? (
                    <span
                      className={
                        isMoveGood(m.delta_pct, m.better_is)
                          ? "text-[var(--color-signal)]"
                          : "text-[var(--color-text-faded)]"
                      }
                    >
                      {m.delta_pct > 0 ? "+" : ""}
                      {m.delta_pct.toFixed(1)}% vs prior
                    </span>
                  ) : (
                    <span className="text-[var(--color-text-faint)]">no prior</span>
                  )}
                  {m.target_value != null && (
                    <span className="text-[var(--color-text-muted)]">
                      target {formatMetricValue(m.target_value, m.unit)}
                    </span>
                  )}
                </div>
              </li>
            ))}
          </ul>
        </section>
      ))}

      {metrics.length === 0 && (
        <p className="rounded-2xl border border-dashed border-hairline bg-bg-elev/20 px-6 py-12 text-center text-[13px] text-[var(--color-text-muted)]">
          No metrics for the current period yet. The first close lands at
          month-end.
        </p>
      )}
    </div>
  );
}

function isMoveGood(delta: number, betterIs: "higher" | "lower") {
  if (delta === 0) return false;
  return betterIs === "higher" ? delta > 0 : delta < 0;
}

function formatMetricValue(value: number, unit: string): string {
  if (unit === "EUR") {
    return new Intl.NumberFormat("en-GB", {
      style: "currency",
      currency: "EUR",
      maximumFractionDigits: 0,
    }).format(value);
  }
  if (unit === "%") return `${value.toFixed(1)}%`;
  if (Number.isInteger(value)) return value.toLocaleString("en-GB");
  return value.toLocaleString("en-GB", { maximumFractionDigits: 1 });
}
