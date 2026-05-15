import { redirect } from "next/navigation";

import { Eyebrow } from "@/components/primitives/Eyebrow";
import { SignalRow } from "@/components/portal/SignalRow";
import { getLiveSignal } from "@/lib/portal/live-ops";
import { getPortalContext } from "@/lib/portal/team";

export const metadata = { title: "Live Operations" };
export const dynamic = "force-dynamic";

export default async function PortalLivePage() {
  const ctx = await getPortalContext();
  if (!ctx) redirect("/portal");

  const events = await getLiveSignal(ctx.organizationId, 60);

  const breakdown = events.reduce(
    (acc, e) => {
      acc[e.kind] = (acc[e.kind] ?? 0) + 1;
      return acc;
    },
    {} as Record<string, number>,
  );

  return (
    <div className="space-y-12">
      <header className="space-y-4">
        <Eyebrow number="02">Live operations</Eyebrow>
        <h1 className="text-display text-[clamp(2rem,5vw,3rem)] font-medium leading-[1.05] tracking-[-0.03em]">
          Every <span className="italic text-[var(--color-signal)]">signal</span> in one stream.
        </h1>
        <p className="max-w-xl text-[15px] leading-relaxed text-[var(--color-text-faded)]">
          Agent recommendations, energy anomalies, incidents, corrective
          actions, audits — sorted newest first. Click into any row to
          act on it.
        </p>
      </header>

      <section className="grid gap-px overflow-hidden rounded-2xl border border-hairline bg-hairline sm:grid-cols-5">
        <Tile label="Agents" value={(breakdown.agent_recommendation ?? 0).toString()} />
        <Tile label="Energy" value={(breakdown.energy_anomaly ?? 0).toString()} />
        <Tile label="Incidents" value={(breakdown.incident ?? 0).toString()} />
        <Tile label="Corrective" value={(breakdown.corrective_action ?? 0).toString()} />
        <Tile label="Audits" value={(breakdown.audit ?? 0).toString()} />
      </section>

      <section className="overflow-hidden rounded-2xl border border-hairline bg-bg-elev/30">
        {events.length === 0 ? (
          <p className="px-6 py-10 text-center text-[13px] text-[var(--color-text-muted)]">
            Quiet right now. The ticker is live — anything new will land
            here on next refresh.
          </p>
        ) : (
          events.map((e) => <SignalRow key={e.id} event={e} />)
        )}
      </section>
    </div>
  );
}

function Tile({ label, value }: { label: string; value: string }) {
  return (
    <article className="space-y-1 bg-bg-elev/40 px-5 py-4">
      <p className="font-mono text-[10px] uppercase tracking-[0.14em] text-[var(--color-text-faint)]">
        {label}
      </p>
      <p className="text-stat text-[1.6rem] font-medium text-text tabular-nums">
        {value}
      </p>
    </article>
  );
}
