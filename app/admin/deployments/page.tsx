import Link from "next/link";
import { redirect } from "next/navigation";

import { Eyebrow } from "@/components/primitives/Eyebrow";
import { hasPermissionAny } from "@/lib/auth/require";
import { getDeployments } from "@/lib/admin/deployments";

export const metadata = { title: "Deployments" };
export const dynamic = "force-dynamic";

const TYPE_LABEL: Record<string, string> = {
  cloud: "Cloud",
  sovereign_cloud: "Sovereign cloud",
  on_prem: "On-prem",
  air_gapped: "Air-gapped",
};

export default async function DeploymentsPage() {
  if (!(await hasPermissionAny("view_clients"))) redirect("/admin");

  const { byType, clients } = await getDeployments();

  return (
    <div className="space-y-14">
      <header className="space-y-4">
        <Eyebrow number="01">Deployments</Eyebrow>
        <h1 className="text-display text-[clamp(2rem,5vw,3.2rem)] font-medium leading-[1.05] tracking-[-0.03em]">
          Where every client <span className="italic text-[var(--color-signal)]">runs</span>.
        </h1>
        <p className="max-w-xl text-[15px] leading-relaxed text-[var(--color-text-faded)]">
          System-of-record view of client topology. Edit a client&apos;s
          deployment type from its detail page.
        </p>
      </header>

      <section className="grid gap-px overflow-hidden rounded-2xl border border-hairline bg-hairline sm:grid-cols-2 lg:grid-cols-4">
        {(Object.keys(TYPE_LABEL) as (keyof typeof TYPE_LABEL)[]).map((k, i) => (
          <article key={k} className="space-y-2 bg-bg-elev/40 px-6 py-6">
            <p className="font-mono text-[10px] uppercase tracking-[0.14em] text-[var(--color-text-faint)]">
              {String(i + 1).padStart(2, "0")} — {TYPE_LABEL[k]}
            </p>
            <p className="text-stat text-[2rem] font-medium text-text">
              {byType[k as keyof typeof byType] ?? 0}
            </p>
          </article>
        ))}
      </section>

      <section className="space-y-4">
        <Eyebrow number="02">Client topology</Eyebrow>
        {clients.length === 0 ? (
          <p className="rounded-2xl border border-hairline bg-bg-elev/30 px-5 py-8 text-center text-[13px] text-[var(--color-text-muted)]">
            No client deployments yet.
          </p>
        ) : (
          <ul className="overflow-hidden rounded-2xl border border-hairline bg-bg-elev/30">
            {clients.map((c) => (
              <li
                key={c.organizationId}
                className="grid items-center gap-3 border-b border-hairline px-5 py-4 last:border-b-0 sm:grid-cols-[1.6fr_1fr_0.8fr_0.8fr]"
              >
                <Link
                  href={`/admin/clients/${c.organizationId}/overview`}
                  className="text-[14px] text-text hover:text-[var(--color-signal)]"
                >
                  {c.organizationName}
                </Link>
                <span className="font-mono text-[11px] uppercase tracking-[0.12em] text-[var(--color-signal)]">
                  {TYPE_LABEL[c.deploymentType]}
                </span>
                <span className="font-mono text-[11px] uppercase tracking-[0.12em] text-[var(--color-text-muted)]">
                  {c.region}
                </span>
                <span className="text-right font-mono text-[11px] uppercase tracking-[0.12em] text-[var(--color-text-faded)]">
                  {c.siteCount} site{c.siteCount === 1 ? "" : "s"} · {c.modulesEnabled.length} mod
                </span>
              </li>
            ))}
          </ul>
        )}
      </section>
    </div>
  );
}
