import { notFound } from "next/navigation";

import { Eyebrow } from "@/components/primitives/Eyebrow";
import { getClientDetail } from "@/lib/admin/clients";
import { formatModule } from "@/lib/admin/format";

export const metadata = { title: "Modules" };
export const dynamic = "force-dynamic";

const ALL_MODULES = [
  { slug: "operational_ontology", description: "Object graph of equipment, sensors, recipes, regulations." },
  { slug: "agentic_workflows", description: "Human-approved AI agents with action ledger + rollback." },
  { slug: "predictive_maintenance", description: "Health scoring, failure forecasts, work-order workflow." },
  { slug: "energy", description: "Utility metering, tariff windows, emissions ledger." },
  { slug: "compliance", description: "FSMS/ISO audits, cold-chain logs, corrective actions." },
  { slug: "decision_intelligence", description: "P&L by plate/SKU/shift/site, OEE, scenarios, forecasting." },
];

interface ModulesPageProps {
  params: Promise<{ clientId: string }>;
}

export default async function ClientModulesPage({ params }: ModulesPageProps) {
  const { clientId } = await params;
  const client = await getClientDetail(clientId);
  if (!client) notFound();

  const enabled = new Set(client.modules_enabled);

  return (
    <div className="space-y-10">
      <header className="space-y-3">
        <Eyebrow number="01">Modules</Eyebrow>
        <h2 className="text-display text-[clamp(1.4rem,3vw,1.8rem)] font-medium tracking-[-0.02em]">
          What <span className="italic text-[var(--color-signal)]">{client.name}</span> has enabled.
        </h2>
        <p className="max-w-xl text-[14px] text-[var(--color-text-faded)]">
          Toggling modules ships in Phase 2c alongside the contract + SOW
          flow. For now this reflects the read-only state set during
          deployment.
        </p>
      </header>

      <ul className="grid gap-px overflow-hidden rounded-2xl border border-hairline bg-hairline sm:grid-cols-2 lg:grid-cols-3">
        {ALL_MODULES.map((mod) => {
          const on = enabled.has(mod.slug);
          return (
            <li
              key={mod.slug}
              className="space-y-3 bg-bg-elev/40 px-6 py-6"
            >
              <header className="flex items-center justify-between gap-3">
                <p className="font-mono text-[10px] uppercase tracking-[0.14em] text-[var(--color-text-faint)]">
                  {formatModule(mod.slug)}
                </p>
                <span
                  className={
                    on
                      ? "rounded-full bg-[var(--color-signal)]/15 px-2.5 py-1 font-mono text-[10px] uppercase tracking-[0.14em] text-[var(--color-signal)]"
                      : "rounded-full border border-hairline px-2.5 py-1 font-mono text-[10px] uppercase tracking-[0.14em] text-[var(--color-text-faint)]"
                  }
                >
                  {on ? "Enabled" : "Off"}
                </span>
              </header>
              <p className="text-[13px] leading-relaxed text-[var(--color-text-faded)]">
                {mod.description}
              </p>
            </li>
          );
        })}
      </ul>
    </div>
  );
}
