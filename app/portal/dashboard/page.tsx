import { Eyebrow } from "@/components/primitives/Eyebrow";

export const metadata = {
  title: "Dashboard",
};

/**
 * Phase 1 placeholder. Role-personalized dashboards populate in Phase 4
 * once operational data is flowing.
 */
export default function PortalDashboardPage() {
  return (
    <div className="space-y-12">
      <header className="space-y-4">
        <Eyebrow number="01">Today</Eyebrow>
        <h1 className="text-display text-[clamp(2rem,5vw,3.2rem)] font-medium leading-[1.05] tracking-[-0.03em]">
          Your <span className="italic text-[var(--color-signal)]">operational</span> dashboard.
        </h1>
        <p className="max-w-xl text-[15px] leading-relaxed text-[var(--color-text-faded)]">
          This view personalizes to your role and the modules your
          workspace has enabled. Live data arrives once your deployment
          starts ingesting from sensors, ERPs, and BMS systems.
        </p>
      </header>

      <section className="grid gap-px overflow-hidden rounded-2xl border border-hairline bg-hairline sm:grid-cols-2 lg:grid-cols-3">
        {TILES.map((tile) => (
          <article
            key={tile.label}
            className="space-y-3 bg-bg-elev/40 px-6 py-8"
          >
            <p className="font-mono text-[10px] uppercase tracking-[0.14em] text-[var(--color-text-faint)]">
              {tile.number} — {tile.label}
            </p>
            <p className="text-stat text-[2.6rem] font-medium text-text">—</p>
            <p className="text-[11px] uppercase tracking-[0.1em] text-[var(--color-text-muted)]">
              {tile.hint}
            </p>
          </article>
        ))}
      </section>

      <section className="rounded-2xl border border-hairline bg-bg-elev/30 px-8 py-10">
        <Eyebrow number="02">Welcome</Eyebrow>
        <h2 className="mt-4 text-display text-[clamp(1.4rem,3vw,2rem)] font-medium tracking-[-0.02em]">
          Your workspace is{" "}
          <span className="italic text-[var(--color-signal)]">live</span>.
        </h2>
        <p className="mt-6 text-[14px] text-[var(--color-text-faded)]">
          From the left rail you can reach your Security Settings. The
          operational modules light up as your deployment progresses
          through onboarding.
        </p>
      </section>
    </div>
  );
}

const TILES = [
  { number: "01", label: "Active alerts", hint: "Phase 4" },
  { number: "02", label: "Pending approvals", hint: "Phase 4" },
  { number: "03", label: "Today's tasks", hint: "Phase 4" },
  { number: "04", label: "Energy index", hint: "Phase 4" },
  { number: "05", label: "Compliance score", hint: "Phase 4" },
  { number: "06", label: "OEE / yield", hint: "Phase 4" },
];
