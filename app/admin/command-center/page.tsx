import { Eyebrow } from "@/components/primitives/Eyebrow";

export const metadata = {
  title: "Command Center",
};

/**
 * Phase 1 placeholder. The Command Center populates with live metrics in
 * Phase 2: total clients, leads-this-month, pipeline value, sites
 * monitored, open alerts, recent audit events, etc.
 */
export default function CommandCenterPage() {
  return (
    <div className="space-y-12">
      <header className="space-y-4">
        <Eyebrow number="01">Operational signal</Eyebrow>
        <h1 className="text-display text-[clamp(2rem,5vw,3.2rem)] font-medium leading-[1.05] tracking-[-0.03em]">
          The <span className="italic text-[var(--color-signal)]">command center</span> assembles in Phase 2.
        </h1>
        <p className="max-w-xl text-[15px] leading-relaxed text-[var(--color-text-faded)]">
          Once client + deployment data starts flowing, this surface
          shows live operational signal across every Kerning workspace —
          alerts, pipeline, agent approvals, system health.
        </p>
      </header>

      <section className="grid gap-px overflow-hidden rounded-2xl border border-hairline bg-hairline sm:grid-cols-2 lg:grid-cols-4">
        {METRIC_TILES.map((tile) => (
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
        <Eyebrow number="02">What's next</Eyebrow>
        <h2 className="mt-4 text-display text-[clamp(1.4rem,3vw,2rem)] font-medium tracking-[-0.02em]">
          Phase 1 shipped the foundation.
        </h2>
        <ul className="mt-6 space-y-2 text-[14px] text-[var(--color-text-faded)]">
          <li>— Supabase auth, RBAC, tenancy, audit logging</li>
          <li>— Email/password + Google sign-in with account linking</li>
          <li>— Admin + Client shells with role-aware navigation</li>
          <li>— Storage buckets + RLS for the seven canonical workflows</li>
        </ul>
      </section>
    </div>
  );
}

const METRIC_TILES = [
  { number: "01", label: "Total clients", hint: "Phase 2" },
  { number: "02", label: "Active deployments", hint: "Phase 2" },
  { number: "03", label: "Open agent approvals", hint: "Phase 4" },
  { number: "04", label: "Pipeline value", hint: "Phase 2" },
];
