import Link from "next/link";

import { Eyebrow } from "@/components/primitives/Eyebrow";
import { getCurrentPartnerOrgId, getPartnerDashboardSummary } from "@/lib/partner/partner";

export const metadata = { title: "Partner Dashboard" };
export const dynamic = "force-dynamic";

export default async function PartnerDashboardPage() {
  const partnerOrgId = await getCurrentPartnerOrgId();
  if (!partnerOrgId) {
    return (
      <p className="rounded-2xl border border-hairline bg-bg-elev/30 px-5 py-8 text-center text-[13px] text-[var(--color-text-muted)]">
        Your account isn&apos;t linked to a partner organisation.
      </p>
    );
  }

  const summary = await getPartnerDashboardSummary(partnerOrgId);

  return (
    <div className="space-y-10">
      <header className="space-y-2">
        <Eyebrow number="01">Partner dashboard</Eyebrow>
        <h1 className="font-display text-[1.6rem] tracking-[-0.01em] text-text">
          Today
        </h1>
      </header>

      <section className="grid gap-px overflow-hidden rounded-2xl border border-hairline bg-hairline sm:grid-cols-3">
        <div className="space-y-1 bg-bg-elev/40 px-5 py-5">
          <p className="font-mono text-[10px] uppercase tracking-[0.14em] text-[var(--color-text-muted)]">
            Recent leads
          </p>
          <p className="font-mono text-[1.6rem] tabular-nums text-text">{summary.leadCount}</p>
        </div>
        <div className="space-y-1 bg-bg-elev/40 px-5 py-5">
          <p className="font-mono text-[10px] uppercase tracking-[0.14em] text-[var(--color-text-muted)]">
            Active projects
          </p>
          <p className="font-mono text-[1.6rem] tabular-nums text-text">{summary.projectCount}</p>
        </div>
        <div className="space-y-1 bg-bg-elev/40 px-5 py-5">
          <p className="font-mono text-[10px] uppercase tracking-[0.14em] text-[var(--color-text-muted)]">
            Quick action
          </p>
          <Link
            href="/partner/leads/new"
            className="inline-block rounded-full border border-[var(--color-signal-deep)] px-3 py-1 font-mono text-[10px] uppercase tracking-[0.14em] text-[var(--color-signal-soft)] hover:border-[var(--color-signal)] hover:text-[var(--color-signal)]"
          >
            Submit a new lead →
          </Link>
        </div>
      </section>

      <section className="space-y-3">
        <Eyebrow number="02">Recent leads</Eyebrow>
        {summary.recentLeads.length === 0 ? (
          <p className="rounded-2xl border border-hairline bg-bg-elev/30 px-5 py-8 text-center text-[13px] text-[var(--color-text-muted)]">
            No leads submitted yet.
          </p>
        ) : (
          <ul className="overflow-hidden rounded-2xl border border-hairline bg-bg-elev/30">
            {summary.recentLeads.map((l) => (
              <li
                key={l.id}
                className="grid gap-2 border-b border-hairline px-5 py-4 last:border-b-0 sm:grid-cols-[1fr_180px_120px]"
              >
                <div>
                  <p className="text-[14px] text-text">{l.contact_name}</p>
                  <p className="font-mono text-[10.5px] uppercase tracking-[0.12em] text-[var(--color-text-muted)]">
                    {l.company_name}
                  </p>
                </div>
                <p className="font-mono text-[10.5px] uppercase tracking-[0.12em] text-[var(--color-signal)]">
                  {l.status}
                </p>
                <p className="text-right font-mono text-[10.5px] uppercase tracking-[0.12em] text-[var(--color-text-faded)]">
                  {new Date(l.created_at).toLocaleDateString()}
                </p>
              </li>
            ))}
          </ul>
        )}
      </section>
    </div>
  );
}
