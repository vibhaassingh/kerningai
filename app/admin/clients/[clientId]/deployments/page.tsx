import { notFound } from "next/navigation";

import { Eyebrow } from "@/components/primitives/Eyebrow";
import { getClientDetail } from "@/lib/admin/clients";
import { formatDate, formatDeployment } from "@/lib/admin/format";

export const metadata = { title: "Deployments" };
export const dynamic = "force-dynamic";

interface DeploymentsPageProps {
  params: Promise<{ clientId: string }>;
}

export default async function ClientDeploymentsPage({
  params,
}: DeploymentsPageProps) {
  const { clientId } = await params;
  const client = await getClientDetail(clientId);
  if (!client) notFound();

  return (
    <div className="space-y-10">
      <header className="space-y-3">
        <Eyebrow number="01">Deployments</Eyebrow>
        <h2 className="text-display text-[clamp(1.4rem,3vw,1.8rem)] font-medium tracking-[-0.02em]">
          How{" "}
          <span className="italic text-[var(--color-signal)]">{client.name}</span>{" "}
          is hosted.
        </h2>
        <p className="max-w-xl text-[14px] text-[var(--color-text-faded)]">
          Full deployment management — environments, gateway inventory,
          milestone tracking — ships in Phase 2c. The summary below
          reflects the contract-level settings.
        </p>
      </header>

      <dl className="grid gap-px overflow-hidden rounded-2xl border border-hairline bg-hairline sm:grid-cols-2 lg:grid-cols-4">
        <Cell label="01 — Deployment" value={formatDeployment(client.deployment_type)} />
        <Cell label="02 — Region" value={client.region} />
        <Cell label="03 — Renewal" value={formatDate(client.renewal_date)} />
        <Cell label="04 — Onboarded" value={formatDate(client.created_at)} />
      </dl>

      <section className="rounded-2xl border border-dashed border-hairline bg-bg-elev/20 p-8 text-[13.5px] leading-relaxed text-[var(--color-text-faded)]">
        <Eyebrow number="02">Coming in Phase 2c</Eyebrow>
        <ul className="mt-4 space-y-1.5">
          <li>— Deployment records with environment + version metadata</li>
          <li>— Site-by-site go-live checklist + milestone timeline</li>
          <li>— Edge-gateway inventory + sensor commissioning logs</li>
          <li>— Backup status, retention policy, residency proof</li>
          <li>— Rollback metadata + last health check</li>
        </ul>
      </section>
    </div>
  );
}

function Cell({ label, value }: { label: string; value: string }) {
  return (
    <article className="space-y-2 bg-bg-elev/40 px-6 py-5">
      <dt className="font-mono text-[10px] uppercase tracking-[0.14em] text-[var(--color-text-faint)]">
        {label}
      </dt>
      <dd className="text-text">{value}</dd>
    </article>
  );
}
