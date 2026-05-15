import Link from "next/link";
import { redirect } from "next/navigation";

import { DataTable, type DataTableColumn } from "@/components/data/DataTable";
import { HealthBandBadge } from "@/components/portal/HealthBandBadge";
import { Eyebrow } from "@/components/primitives/Eyebrow";
import { formatRelative } from "@/lib/admin/format";
import { hasPermissionAny } from "@/lib/auth/require";
import {
  listAssetsForClient,
  type AssetWithHealth,
} from "@/lib/portal/maintenance";
import { getPortalContext } from "@/lib/portal/team";

export const metadata = { title: "Maintenance" };
export const dynamic = "force-dynamic";

export default async function PortalMaintenancePage() {
  const ctx = await getPortalContext();
  if (!ctx) redirect("/portal");
  if (!(await hasPermissionAny("view_maintenance"))) {
    redirect("/portal/dashboard");
  }

  const assets = await listAssetsForClient(ctx.organizationId);

  const atRisk = assets.filter((a) => a.status === "at_risk" || a.health_band === "at_risk" || a.health_band === "critical");
  const watch = assets.filter((a) => a.status === "watch" || a.health_band === "watch");
  const healthy = assets.filter((a) => !atRisk.includes(a) && !watch.includes(a));

  const columns: DataTableColumn<AssetWithHealth>[] = [
    {
      key: "asset",
      header: "Asset",
      cell: (a) => (
        <Link
          href={`/portal/maintenance/assets/${a.id}`}
          className="block space-y-0.5 hover:text-text"
        >
          <div className="text-text">{a.name}</div>
          <div className="text-[11.5px] text-[var(--color-text-muted)]">
            {a.asset_code ? `${a.asset_code} · ` : ""}
            {a.kind.replace(/_/g, " ")}
            {a.site_name && ` · ${a.site_name}`}
          </div>
        </Link>
      ),
      className: "w-[38%]",
    },
    {
      key: "health",
      header: "Health",
      cell: (a) => <HealthBandBadge band={a.health_band} score={a.health_score} />,
    },
    {
      key: "forecast",
      header: "Forecast",
      cell: (a) =>
        a.forecast_event ? (
          <div className="space-y-0.5">
            <div className="text-text">{a.forecast_event}</div>
            {a.forecast_days != null && (
              <div className="text-[11px] text-[var(--color-text-muted)]">
                in ~{a.forecast_days} days
              </div>
            )}
          </div>
        ) : (
          <span className="text-[var(--color-text-faint)]">—</span>
        ),
    },
    {
      key: "reason",
      header: "Signal",
      cell: (a) => (
        <span className="text-[13px] text-[var(--color-text-faded)]">
          {a.health_reason ?? "—"}
        </span>
      ),
    },
    {
      key: "observed",
      header: "Observed",
      cell: (a) => (
        <span className="text-[12.5px] text-[var(--color-text-faded)]">
          {a.observed_at ? formatRelative(a.observed_at) : "—"}
        </span>
      ),
    },
  ];

  return (
    <div className="space-y-12">
      <header className="space-y-4">
        <Eyebrow number="04">Maintenance · asset health</Eyebrow>
        <h1 className="text-display text-[clamp(2rem,5vw,3rem)] font-medium leading-[1.05] tracking-[-0.03em]">
          Every <span className="italic text-[var(--color-signal)]">asset</span>, ranked by health.
        </h1>
        <p className="max-w-xl text-[15px] leading-relaxed text-[var(--color-text-faded)]">
          Health scores combine sensor signal, maintenance history, and
          comparison against assets of the same class. Drill in to see
          recent agent recommendations attached to the asset.
        </p>
      </header>

      <section className="grid gap-px overflow-hidden rounded-2xl border border-hairline bg-hairline sm:grid-cols-3">
        <Tile number="01" label="At risk" value={atRisk.length.toString()} />
        <Tile number="02" label="Watch" value={watch.length.toString()} />
        <Tile number="03" label="Healthy" value={healthy.length.toString()} />
      </section>

      <DataTable
        rows={assets}
        columns={columns}
        rowKey={(r) => r.id}
        emptyState="No assets registered yet. Onboarding adds them during site survey."
      />
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
