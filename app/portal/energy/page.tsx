import { redirect } from "next/navigation";

import { DataTable, type DataTableColumn } from "@/components/data/DataTable";
import { Eyebrow } from "@/components/primitives/Eyebrow";
import { formatMoney } from "@/lib/admin/format";
import { formatRelative } from "@/lib/admin/format";
import { hasPermissionAny } from "@/lib/auth/require";
import {
  getEnergyOverview,
  type EnergyAnomaly,
  type MeterSnapshot,
  type TariffWindow,
} from "@/lib/portal/energy";
import { getPortalContext } from "@/lib/portal/team";

export const metadata = { title: "Energy" };
export const dynamic = "force-dynamic";

export default async function PortalEnergyPage() {
  const ctx = await getPortalContext();
  if (!ctx) redirect("/portal");
  if (!(await hasPermissionAny("view_energy"))) redirect("/portal/dashboard");

  const { meters, tariffs, anomalies, totalConsumption, totalCost, currency } =
    await getEnergyOverview(ctx.organizationId);

  const meterColumns: DataTableColumn<MeterSnapshot>[] = [
    {
      key: "meter",
      header: "Meter",
      cell: (m) => (
        <div className="space-y-0.5">
          <div className="text-text">{m.name}</div>
          <div className="text-[11.5px] text-[var(--color-text-muted)]">
            {m.site_name ?? "—"} · {m.kind}
          </div>
        </div>
      ),
      className: "w-[40%]",
    },
    {
      key: "consumption",
      header: "7-day consumption",
      cell: (m) => (
        <span className="font-mono tabular-nums text-text">
          {Math.round(m.consumption_7d).toLocaleString("en-GB")} {m.unit}
        </span>
      ),
    },
    {
      key: "cost",
      header: "7-day cost",
      cell: (m) => (
        <span className="font-mono tabular-nums text-text">
          {formatMoney(Math.round(m.cost_7d * 100), currency)}
        </span>
      ),
    },
  ];

  const anomalyColumns: DataTableColumn<EnergyAnomaly>[] = [
    {
      key: "detected",
      header: "Detected",
      cell: (a) => (
        <span className="text-[12.5px] text-[var(--color-text-muted)]">
          {formatRelative(a.detected_at)}
        </span>
      ),
      className: "w-[15%]",
    },
    {
      key: "kind",
      header: "Kind",
      cell: (a) => (
        <span className="font-mono text-[11px] uppercase tracking-[0.1em] text-[var(--color-text-faded)]">
          {a.kind.replace(/_/g, " ")}
        </span>
      ),
    },
    {
      key: "severity",
      header: "Severity",
      cell: (a) => (
        <span
          className={
            a.severity === "high"
              ? "rounded-full bg-[var(--color-signal)]/15 px-2.5 py-1 font-mono text-[10px] uppercase tracking-[0.14em] text-[var(--color-signal)]"
              : "rounded-full border border-hairline px-2.5 py-1 font-mono text-[10px] uppercase tracking-[0.14em] text-[var(--color-text-faded)]"
          }
        >
          {a.severity}
        </span>
      ),
    },
    {
      key: "where",
      header: "Where",
      cell: (a) => (
        <span className="text-[13px] text-[var(--color-text-faded)]">
          {a.meter_name ?? "—"}
          {a.site_name && ` · ${a.site_name}`}
        </span>
      ),
    },
    {
      key: "description",
      header: "Signal",
      cell: (a) => (
        <span className="text-[13.5px] text-text">{a.description}</span>
      ),
    },
  ];

  return (
    <div className="space-y-12">
      <header className="space-y-4">
        <Eyebrow number="05">Energy · last 7 days</Eyebrow>
        <h1 className="text-display text-[clamp(2rem,5vw,3rem)] font-medium leading-[1.05] tracking-[-0.03em]">
          What it took to <span className="italic text-[var(--color-signal)]">run</span> the floor.
        </h1>
        <p className="max-w-xl text-[15px] leading-relaxed text-[var(--color-text-faded)]">
          Consumption + cost by meter, tariff windows, and the anomalies
          we've spotted. Setpoint changes flow through the Agent Inbox
          for approval.
        </p>
      </header>

      <section className="grid gap-px overflow-hidden rounded-2xl border border-hairline bg-hairline sm:grid-cols-3">
        <Tile number="01" label="Total consumption (kWh)" value={Math.round(totalConsumption).toLocaleString("en-GB")} />
        <Tile number="02" label="Total cost" value={formatMoney(Math.round(totalCost * 100), currency)} />
        <Tile number="03" label="Open anomalies" value={anomalies.filter((a) => !a.severity.includes("low")).length.toString()} />
      </section>

      <section className="space-y-4">
        <Eyebrow number="04">Meters</Eyebrow>
        <DataTable rows={meters} columns={meterColumns} rowKey={(r) => r.id} emptyState="No meters wired yet." />
      </section>

      <section className="space-y-4">
        <Eyebrow number="05">Tariff windows</Eyebrow>
        <ul className="grid gap-px overflow-hidden rounded-2xl border border-hairline bg-hairline sm:grid-cols-2 lg:grid-cols-3">
          {tariffs.map((t: TariffWindow) => (
            <li key={t.id} className="space-y-1 bg-bg-elev/40 px-5 py-4">
              <p className="font-mono text-[11px] uppercase tracking-[0.14em] text-[var(--color-text-muted)]">
                {t.name}
              </p>
              <p className="text-text">
                {t.start_local.slice(0, 5)} – {t.end_local.slice(0, 5)}
              </p>
              <p className="font-mono tabular-nums text-[12.5px] text-[var(--color-text-faded)]">
                {Number(t.rate_per_unit).toFixed(2)} {t.currency}/unit
              </p>
            </li>
          ))}
          {tariffs.length === 0 && (
            <li className="bg-bg-elev/40 px-6 py-10 text-center text-[13px] text-[var(--color-text-muted)] sm:col-span-2 lg:col-span-3">
              No tariff windows configured.
            </li>
          )}
        </ul>
      </section>

      <section className="space-y-4">
        <Eyebrow number="06">Anomalies</Eyebrow>
        <DataTable
          rows={anomalies}
          columns={anomalyColumns}
          rowKey={(r) => r.id}
          emptyState="Nothing anomalous in the last cycle."
        />
      </section>
    </div>
  );
}

function Tile({ number, label, value }: { number: string; label: string; value: string }) {
  return (
    <article className="space-y-2 bg-bg-elev/40 px-6 py-5">
      <p className="font-mono text-[10px] uppercase tracking-[0.14em] text-[var(--color-text-faint)]">
        {number} — {label}
      </p>
      <p className="text-stat text-[1.8rem] font-medium text-text">{value}</p>
    </article>
  );
}
