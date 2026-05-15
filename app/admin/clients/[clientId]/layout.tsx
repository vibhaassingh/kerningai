import { notFound, redirect } from "next/navigation";
import type { ReactNode } from "react";

import { ClientTabs } from "@/components/admin/ClientTabs";
import { HealthBadge } from "@/components/admin/HealthBadge";
import { Eyebrow } from "@/components/primitives/Eyebrow";
import { getClientDetail } from "@/lib/admin/clients";
import {
  formatDate,
  formatDeployment,
  formatMoney,
} from "@/lib/admin/format";
import { hasPermissionAny } from "@/lib/auth/require";

export const dynamic = "force-dynamic";

interface ClientLayoutProps {
  children: ReactNode;
  params: Promise<{ clientId: string }>;
}

export default async function ClientLayout({
  children,
  params,
}: ClientLayoutProps) {
  const canView = await hasPermissionAny("view_clients");
  if (!canView) redirect("/admin");

  const { clientId } = await params;
  const client = await getClientDetail(clientId);
  if (!client) notFound();

  return (
    <div className="space-y-12">
      <header className="space-y-6">
        <div className="space-y-3">
          <Eyebrow number="02">Client · {client.region}</Eyebrow>
          <h1 className="text-display text-[clamp(1.8rem,4vw,2.6rem)] font-medium leading-[1.05] tracking-[-0.02em]">
            {client.name}
          </h1>
        </div>

        <dl className="grid grid-cols-2 gap-x-8 gap-y-4 text-[13px] sm:grid-cols-4">
          <Stat label="Health" value={<HealthBadge score={client.health_score} />} />
          <Stat label="MRR" value={<span className="font-mono tabular-nums">{formatMoney(client.mrr_cents, client.currency)}</span>} />
          <Stat label="Deployment" value={formatDeployment(client.deployment_type)} />
          <Stat label="Renewal" value={formatDate(client.renewal_date)} />
          <Stat
            label="Sites"
            value={
              <span className="font-mono tabular-nums text-text">{client.site_count}</span>
            }
          />
          <Stat
            label="People"
            value={
              <span className="font-mono tabular-nums text-text">{client.member_count}</span>
            }
          />
          <Stat
            label="Modules"
            value={
              <span className="font-mono tabular-nums text-text">{client.modules_enabled.length}</span>
            }
          />
          <Stat label="Status" value={<span className="capitalize text-text">{client.status}</span>} />
        </dl>

        <ClientTabs clientId={clientId} />
      </header>

      <div>{children}</div>
    </div>
  );
}

function Stat({ label, value }: { label: string; value: ReactNode }) {
  return (
    <div className="space-y-1">
      <dt className="font-mono text-[10px] uppercase tracking-[0.14em] text-[var(--color-text-faint)]">
        {label}
      </dt>
      <dd className="text-text">{value}</dd>
    </div>
  );
}
