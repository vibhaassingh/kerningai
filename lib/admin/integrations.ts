import "server-only";

import { SITE_URL } from "@/lib/env";
import { createClient } from "@/lib/supabase/server";

/**
 * Integrations overview data. The ingestion plumbing already exists
 * (Phase 4d: app/api/webhooks/[connector]/[clientId] + lib/integrations/
 * handlers.ts + the webhook_events ledger). This surfaces it read-only:
 * the connector catalogue, per-client wiring status, and recent events.
 *
 * Webhook secrets live in client_settings.metadata.webhook_secrets — we
 * only ever read the KEY presence (configured: true/false), never the
 * secret value.
 */

export interface ConnectorDef {
  slug: string;
  label: string;
  normalizesInto: string;
  description: string;
  samplePayload: string;
}

export const CONNECTORS: ConnectorDef[] = [
  {
    slug: "cmms",
    label: "CMMS",
    normalizesInto: "equipment_health_scores",
    description:
      "Work-order / asset-health feed from a maintenance system.",
    samplePayload:
      '{ "asset_code", "score", "band?", "reason?", "forecast_event?", "forecast_days?" }',
  },
  {
    slug: "bms",
    label: "BMS",
    normalizesInto: "temperature_logs",
    description:
      "Building-management / cold-chain temperature telemetry.",
    samplePayload: '{ "asset_code?", "temperature_c", "setpoint_c?", "recorded_at?" }',
  },
  {
    slug: "mes",
    label: "MES",
    normalizesInto: "energy_anomalies",
    description: "Manufacturing-execution energy signal + anomalies.",
    samplePayload: '{ "kind", "severity", "description", "site_slug?" }',
  },
];

export function webhookEndpointTemplate(): string {
  return `${SITE_URL}/api/webhooks/{connector}/{clientId}`;
}

export interface ClientWebhookStatus {
  organization_id: string;
  organization_name: string;
  configured: string[]; // connector slugs that have a secret set
}

export async function listClientWebhookStatus(): Promise<
  ClientWebhookStatus[]
> {
  const supabase = await createClient();
  const { data } = await supabase
    .from("organizations")
    .select(
      "id, name, client_settings!inner(metadata)",
    )
    .eq("type", "client")
    .order("name", { ascending: true });

  type Row = {
    id: string;
    name: string;
    client_settings: { metadata: { webhook_secrets?: Record<string, string> } | null };
  };

  return ((data ?? []) as unknown as Row[]).map((r) => ({
    organization_id: r.id,
    organization_name: r.name,
    configured: Object.keys(
      r.client_settings?.metadata?.webhook_secrets ?? {},
    ),
  }));
}

export interface WebhookEventRow {
  id: string;
  organization_name: string;
  connector: string;
  status: "received" | "normalized" | "skipped" | "failed";
  normalized_count: number;
  skipped_count: number;
  error: string | null;
  received_at: string;
}

export async function listRecentWebhookEvents(
  limit = 30,
): Promise<WebhookEventRow[]> {
  const supabase = await createClient();
  const { data } = await supabase
    .from("webhook_events")
    .select(
      "id, connector, status, normalized_count, skipped_count, error, received_at, organization:organizations!webhook_events_organization_id_fkey ( name )",
    )
    .order("received_at", { ascending: false })
    .limit(limit);

  type Row = {
    id: string;
    connector: string;
    status: WebhookEventRow["status"];
    normalized_count: number;
    skipped_count: number;
    error: string | null;
    received_at: string;
    organization: { name: string } | null;
  };

  return ((data ?? []) as unknown as Row[]).map((r) => ({
    id: r.id,
    organization_name: r.organization?.name ?? "—",
    connector: r.connector,
    status: r.status,
    normalized_count: r.normalized_count,
    skipped_count: r.skipped_count,
    error: r.error,
    received_at: r.received_at,
  }));
}
