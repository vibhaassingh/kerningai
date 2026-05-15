import { redirect } from "next/navigation";

import { DataTable, type DataTableColumn } from "@/components/data/DataTable";
import { Eyebrow } from "@/components/primitives/Eyebrow";
import { formatRelative } from "@/lib/admin/format";
import {
  CONNECTORS,
  listClientWebhookStatus,
  listRecentWebhookEvents,
  webhookEndpointTemplate,
  type WebhookEventRow,
} from "@/lib/admin/integrations";
import { hasPermissionAny } from "@/lib/auth/require";

export const metadata = { title: "Integrations" };
export const dynamic = "force-dynamic";

export default async function AdminIntegrationsPage() {
  if (!(await hasPermissionAny("view_clients"))) redirect("/admin");

  const [clientStatus, events] = await Promise.all([
    listClientWebhookStatus(),
    listRecentWebhookEvents(30),
  ]);

  const eventColumns: DataTableColumn<WebhookEventRow>[] = [
    {
      key: "client",
      header: "Client",
      cell: (r) => <span className="text-text">{r.organization_name}</span>,
      className: "w-[26%]",
    },
    {
      key: "connector",
      header: "Connector",
      cell: (r) => (
        <span className="font-mono text-[11px] uppercase tracking-[0.12em] text-[var(--color-text-faded)]">
          {r.connector}
        </span>
      ),
    },
    {
      key: "status",
      header: "Status",
      cell: (r) => (
        <span
          className={
            r.status === "normalized"
              ? "rounded-full bg-[var(--color-signal)]/15 px-2.5 py-1 font-mono text-[10px] uppercase tracking-[0.14em] text-[var(--color-signal)]"
              : r.status === "failed"
                ? "rounded-full border border-[var(--color-canvas-pain)] px-2.5 py-1 font-mono text-[10px] uppercase tracking-[0.14em] text-[var(--color-canvas-pain)]"
                : "rounded-full border border-hairline px-2.5 py-1 font-mono text-[10px] uppercase tracking-[0.14em] text-[var(--color-text-faded)]"
          }
        >
          {r.status}
        </span>
      ),
    },
    {
      key: "counts",
      header: "Normalized / Skipped",
      cell: (r) => (
        <span className="font-mono tabular-nums text-[12.5px] text-[var(--color-text-faded)]">
          {r.normalized_count} / {r.skipped_count}
        </span>
      ),
    },
    {
      key: "received",
      header: "Received",
      cell: (r) => (
        <span className="text-[12.5px] text-[var(--color-text-faded)]">
          {formatRelative(r.received_at)}
        </span>
      ),
    },
  ];

  return (
    <div className="space-y-12">
      <header className="space-y-4">
        <Eyebrow number="07">Integrations</Eyebrow>
        <h1 className="text-display text-[clamp(2rem,5vw,3rem)] font-medium leading-[1.05] tracking-[-0.03em]">
          Signal{" "}
          <span className="italic text-[var(--color-signal)]">in</span> from
          client systems.
        </h1>
        <p className="max-w-2xl text-[15px] leading-relaxed text-[var(--color-text-faded)]">
          Each client system POSTs HMAC-signed events to a per-client
          webhook. Kerning normalizes them into the signal tables that feed
          predictive maintenance, cold-chain compliance and energy. Endpoint
          pattern:
        </p>
        <code className="inline-block rounded-lg border border-hairline bg-bg-elev/40 px-4 py-2 font-mono text-[12.5px] text-[var(--color-signal-soft)]">
          POST {webhookEndpointTemplate()}
        </code>
      </header>

      <section className="space-y-4">
        <Eyebrow number="01">Connectors</Eyebrow>
        <ul className="grid gap-px overflow-hidden rounded-2xl border border-hairline bg-hairline lg:grid-cols-3">
          {CONNECTORS.map((c) => (
            <li key={c.slug} className="space-y-3 bg-bg-elev/40 px-6 py-6">
              <div className="flex items-center justify-between gap-3">
                <p className="font-mono text-[11px] uppercase tracking-[0.16em] text-[var(--color-signal)]">
                  {c.label}
                </p>
                <span className="font-mono text-[10px] uppercase tracking-[0.12em] text-[var(--color-text-muted)]">
                  → {c.normalizesInto}
                </span>
              </div>
              <p className="text-[13px] leading-relaxed text-[var(--color-text-faded)]">
                {c.description}
              </p>
              <code className="block overflow-x-auto rounded-md border border-hairline bg-bg px-3 py-2 font-mono text-[11px] text-[var(--color-text-muted)]">
                {c.samplePayload}
              </code>
            </li>
          ))}
        </ul>
      </section>

      <section className="space-y-4">
        <Eyebrow number="02">Per-client wiring</Eyebrow>
        <p className="max-w-2xl text-[13px] text-[var(--color-text-faded)]">
          A connector is live for a client once its HMAC secret is set in
          client settings. (Secrets are never displayed.)
        </p>
        <ul className="divide-y divide-hairline overflow-hidden rounded-2xl border border-hairline bg-bg-elev/30">
          {clientStatus.length === 0 && (
            <li className="px-6 py-5 text-[13px] text-[var(--color-text-muted)]">
              No clients yet.
            </li>
          )}
          {clientStatus.map((cs) => (
            <li
              key={cs.organization_id}
              className="flex flex-wrap items-center justify-between gap-4 px-6 py-4"
            >
              <span className="text-text">{cs.organization_name}</span>
              <span className="flex flex-wrap gap-2">
                {CONNECTORS.map((c) => {
                  const on = cs.configured.includes(c.slug);
                  return (
                    <span
                      key={c.slug}
                      className={
                        on
                          ? "rounded-full bg-[var(--color-signal)]/15 px-2.5 py-1 font-mono text-[10px] uppercase tracking-[0.14em] text-[var(--color-signal)]"
                          : "rounded-full border border-hairline px-2.5 py-1 font-mono text-[10px] uppercase tracking-[0.14em] text-[var(--color-text-faint)]"
                      }
                    >
                      {c.label} {on ? "live" : "off"}
                    </span>
                  );
                })}
              </span>
            </li>
          ))}
        </ul>
      </section>

      <section className="space-y-4">
        <Eyebrow number="03">Recent events</Eyebrow>
        <DataTable
          rows={events}
          columns={eventColumns}
          rowKey={(r) => r.id}
          emptyState="No webhook events received yet. Once a client system starts POSTing, the ingestion ledger appears here."
        />
      </section>
    </div>
  );
}
