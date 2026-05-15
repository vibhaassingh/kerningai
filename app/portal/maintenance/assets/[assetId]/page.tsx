import Link from "next/link";
import { notFound, redirect } from "next/navigation";

import { HealthBandBadge } from "@/components/portal/HealthBandBadge";
import { Eyebrow } from "@/components/primitives/Eyebrow";
import { formatDate, formatRelative } from "@/lib/admin/format";
import { hasPermissionAny } from "@/lib/auth/require";
import {
  getAssetDetail,
  listRecommendationsForAsset,
} from "@/lib/portal/maintenance";
import { getPortalContext } from "@/lib/portal/team";

export const metadata = { title: "Asset" };
export const dynamic = "force-dynamic";

interface PageProps {
  params: Promise<{ assetId: string }>;
}

export default async function PortalAssetPage({ params }: PageProps) {
  const ctx = await getPortalContext();
  if (!ctx) redirect("/portal");
  if (!(await hasPermissionAny("view_maintenance"))) {
    redirect("/portal/dashboard");
  }

  const { assetId } = await params;
  const [asset, recs] = await Promise.all([
    getAssetDetail(assetId),
    listRecommendationsForAsset(assetId),
  ]);
  if (!asset) notFound();

  return (
    <div className="space-y-12">
      <header className="space-y-4">
        <div className="flex items-center gap-3 text-[12px] uppercase tracking-[0.14em] text-[var(--color-text-muted)]">
          <Link href="/portal/maintenance" className="nav-link hover:text-text">
            ← Maintenance
          </Link>
          <span>·</span>
          <span>{asset.kind.replace(/_/g, " ")}</span>
          {asset.site_name && (
            <>
              <span>·</span>
              <span>{asset.site_name}</span>
            </>
          )}
        </div>
        <h1 className="text-display text-[clamp(1.8rem,4vw,2.6rem)] font-medium leading-[1.05] tracking-[-0.02em]">
          {asset.name}
        </h1>
        <p className="text-[14px] text-[var(--color-text-faded)]">
          {asset.asset_code ? `${asset.asset_code} · ` : ""}
          {asset.manufacturer ? asset.manufacturer : "—"}
          {asset.model && ` ${asset.model}`}
        </p>
      </header>

      <section className="grid gap-px overflow-hidden rounded-2xl border border-hairline bg-hairline sm:grid-cols-2 lg:grid-cols-4">
        <Cell number="01" label="Health">
          <div className="space-y-2">
            <p className="text-stat text-[2.2rem] font-medium leading-none text-text tabular-nums">
              {asset.health_score ?? "—"}
              {asset.health_score != null && (
                <span className="text-[0.8rem] text-[var(--color-text-muted)]">/100</span>
              )}
            </p>
            <HealthBandBadge band={asset.health_band} score={null} />
          </div>
        </Cell>
        <Cell number="02" label="Forecast">
          {asset.forecast_event ? (
            <>
              <p className="text-text">{asset.forecast_event}</p>
              {asset.forecast_days != null && (
                <p className="text-[11.5px] uppercase tracking-[0.12em] text-[var(--color-text-muted)]">
                  in ~{asset.forecast_days} days
                </p>
              )}
            </>
          ) : (
            <p className="text-[var(--color-text-faint)]">—</p>
          )}
        </Cell>
        <Cell number="03" label="Installed">
          <p className="text-text">{formatDate(asset.installed_at)}</p>
        </Cell>
        <Cell number="04" label="Last observed">
          <p className="text-text">
            {asset.observed_at ? formatRelative(asset.observed_at) : "—"}
          </p>
        </Cell>
      </section>

      {asset.health_reason && (
        <section className="rounded-2xl border border-hairline bg-bg-elev/30 p-8">
          <Eyebrow number="05">Why the score</Eyebrow>
          <p className="mt-4 text-[15px] leading-relaxed text-[var(--color-text-faded)]">
            {asset.health_reason}
          </p>
        </section>
      )}

      <section className="space-y-4">
        <Eyebrow number="06">Recent agent recommendations</Eyebrow>
        {recs.length === 0 ? (
          <p className="rounded-2xl border border-dashed border-hairline bg-bg-elev/20 px-6 py-10 text-center text-[13.5px] text-[var(--color-text-muted)]">
            No agent recommendations attached to this asset yet.
          </p>
        ) : (
          <ul className="overflow-hidden rounded-2xl border border-hairline bg-bg-elev/30">
            {recs.map((r) => (
              <li
                key={r.id}
                className="grid gap-4 border-b border-hairline px-6 py-4 last:border-b-0 sm:grid-cols-[1fr_140px_120px]"
              >
                <Link
                  href={`/portal/agents/${r.id}`}
                  className="text-text hover:text-[var(--color-signal)]"
                >
                  {r.title}
                </Link>
                <span className="rounded-full border border-hairline px-2 py-0.5 text-center font-mono text-[10px] uppercase tracking-[0.12em] text-[var(--color-text-faded)]">
                  {r.status.replace(/_/g, " ")}
                </span>
                <time className="text-right text-[12px] text-[var(--color-text-muted)]">
                  {formatRelative(r.created_at)}
                </time>
              </li>
            ))}
          </ul>
        )}
      </section>
    </div>
  );
}

function Cell({
  number,
  label,
  children,
}: {
  number: string;
  label: string;
  children: React.ReactNode;
}) {
  return (
    <article className="space-y-3 bg-bg-elev/40 px-6 py-5">
      <p className="font-mono text-[10px] uppercase tracking-[0.14em] text-[var(--color-text-faint)]">
        {number} — {label}
      </p>
      {children}
    </article>
  );
}
