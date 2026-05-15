import "server-only";

import { createServiceClient } from "@/lib/supabase/service";

/**
 * Read-only deployment registry — derived from client_settings +
 * sites. No infra probes; this is the system-of-record view of where
 * each client is deployed and on what topology.
 */

export type DeploymentType =
  | "cloud"
  | "sovereign_cloud"
  | "on_prem"
  | "air_gapped";

export interface ClientDeployment {
  organizationId: string;
  organizationName: string;
  deploymentType: DeploymentType;
  region: string;
  siteCount: number;
  modulesEnabled: string[];
}

export interface DeploymentRollup {
  byType: Record<DeploymentType, number>;
  clients: ClientDeployment[];
}

export async function getDeployments(): Promise<DeploymentRollup> {
  const service = createServiceClient();

  const { data: settings } = await service
    .from("client_settings")
    .select(
      "organization_id, deployment_type, modules_enabled, organization:organizations(name, region, type, status)",
    );

  type Row = {
    organization_id: string;
    deployment_type: DeploymentType;
    modules_enabled: string[];
    organization: {
      name: string;
      region: string;
      type: string;
      status: string;
    } | null;
  };
  const rows = ((settings ?? []) as unknown as Row[]).filter(
    (r) => r.organization?.type === "client" && r.organization?.status !== "archived",
  );

  // Per-org site counts.
  const { data: siteRows } = await service
    .from("sites")
    .select("organization_id")
    .is("deleted_at", null);
  const siteCounts = new Map<string, number>();
  for (const s of (siteRows ?? []) as { organization_id: string }[]) {
    siteCounts.set(
      s.organization_id,
      (siteCounts.get(s.organization_id) ?? 0) + 1,
    );
  }

  const byType: Record<DeploymentType, number> = {
    cloud: 0,
    sovereign_cloud: 0,
    on_prem: 0,
    air_gapped: 0,
  };

  const clients: ClientDeployment[] = rows.map((r) => {
    byType[r.deployment_type] = (byType[r.deployment_type] ?? 0) + 1;
    return {
      organizationId: r.organization_id,
      organizationName: r.organization?.name ?? "—",
      deploymentType: r.deployment_type,
      region: r.organization?.region ?? "—",
      siteCount: siteCounts.get(r.organization_id) ?? 0,
      modulesEnabled: r.modules_enabled ?? [],
    };
  });

  clients.sort((a, b) => a.organizationName.localeCompare(b.organizationName));
  return { byType, clients };
}
