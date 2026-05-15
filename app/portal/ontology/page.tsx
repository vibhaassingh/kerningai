import { redirect } from "next/navigation";

import { Eyebrow } from "@/components/primitives/Eyebrow";
import { OntologyGraph } from "@/components/graphics/OntologyGraph";
import { formatRelative } from "@/lib/admin/format";
import { getOntologyOverview } from "@/lib/portal/ontology";
import { getPortalContext } from "@/lib/portal/team";

export const metadata = { title: "Ontology Explorer" };
export const dynamic = "force-dynamic";

export default async function PortalOntologyPage() {
  const ctx = await getPortalContext();
  if (!ctx) redirect("/portal");

  const data = await getOntologyOverview(ctx.organizationId);

  return (
    <div className="space-y-12">
      <header className="space-y-4">
        <Eyebrow number="08">Ontology · operational graph</Eyebrow>
        <h1 className="text-display text-[clamp(2rem,5vw,3rem)] font-medium leading-[1.05] tracking-[-0.03em]">
          Your <span className="italic text-[var(--color-signal)]">operational graph</span>.
        </h1>
        <p className="max-w-xl text-[15px] leading-relaxed text-[var(--color-text-faded)]">
          Sites, assets, meters, people, agents — connected as a single
          typed graph. Hover or move your cursor to see relationships
          light up.
        </p>
      </header>

      <section className="overflow-hidden rounded-2xl border border-hairline bg-bg-elev/30 p-6">
        <OntologyGraph
          nodeCount={36}
          pointerRadius={26}
          cursorWires={4}
          className="aspect-[16/9] w-full"
        />
      </section>

      <section className="grid gap-px overflow-hidden rounded-2xl border border-hairline bg-hairline sm:grid-cols-3 lg:grid-cols-5">
        <Tile number="01" label="Sites" value={data.siteCount.toString()} />
        <Tile number="02" label="Assets" value={data.assetCount.toString()} />
        <Tile number="03" label="Utility meters" value={data.meterCount.toString()} />
        <Tile number="04" label="People" value={data.memberCount.toString()} />
        <Tile number="05" label="Agent templates" value={data.templateCount.toString()} />
      </section>

      <section className="space-y-4">
        <Eyebrow number="06">Recent lineage</Eyebrow>
        <ul className="overflow-hidden rounded-2xl border border-hairline bg-bg-elev/30">
          {data.recentLineage.length === 0 ? (
            <li className="px-6 py-10 text-center text-[13px] text-[var(--color-text-muted)]">
              No agent runs yet. Lineage records will land here as soon
              as the first run completes.
            </li>
          ) : (
            data.recentLineage.map((l) => (
              <li
                key={l.id}
                className="grid items-center gap-4 border-b border-hairline px-6 py-3 last:border-b-0 sm:grid-cols-[160px_1fr_120px]"
              >
                <time className="font-mono text-[11.5px] uppercase tracking-[0.12em] text-[var(--color-text-muted)]">
                  {formatRelative(l.observed_at)}
                </time>
                <p className="text-text">{l.label}</p>
                <span className="font-mono text-[11px] uppercase tracking-[0.1em] text-[var(--color-text-faded)] sm:text-right">
                  {l.subtitle}
                </span>
              </li>
            ))
          )}
        </ul>
      </section>
    </div>
  );
}

function Tile({ number, label, value }: { number: string; label: string; value: string }) {
  return (
    <article className="space-y-2 bg-bg-elev/40 px-5 py-5">
      <p className="font-mono text-[10px] uppercase tracking-[0.14em] text-[var(--color-text-faint)]">
        {number} — {label}
      </p>
      <p className="text-stat text-[1.6rem] font-medium text-text">{value}</p>
    </article>
  );
}
