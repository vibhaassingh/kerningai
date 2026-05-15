import Link from "next/link";

import { Eyebrow } from "@/components/primitives/Eyebrow";
import { getCurrentPartnerOrgId } from "@/lib/partner/partner";
import { listProjectsForPartner } from "@/lib/projects/projects";

export const metadata = { title: "My Projects" };
export const dynamic = "force-dynamic";

const STATUS_LABEL: Record<string, string> = {
  discovery: "Discovery",
  proposal: "Proposal",
  implementation: "Implementation",
  live: "Live",
  archived: "Archived",
  on_hold: "On hold",
};

export default async function PartnerProjectsPage() {
  const partnerOrgId = await getCurrentPartnerOrgId();
  if (!partnerOrgId) return null;

  const projects = await listProjectsForPartner(partnerOrgId);

  return (
    <div className="space-y-8">
      <header className="space-y-2">
        <Eyebrow number="01">My projects</Eyebrow>
        <h1 className="font-display text-[1.6rem] tracking-[-0.01em] text-text">
          Projects you&apos;ve referred
        </h1>
      </header>

      {projects.length === 0 ? (
        <p className="rounded-2xl border border-hairline bg-bg-elev/30 px-5 py-8 text-center text-[13px] text-[var(--color-text-muted)]">
          No projects yet. Lead conversions appear here once Kerning kicks off
          discovery.
        </p>
      ) : (
        <ul className="grid gap-px overflow-hidden rounded-2xl border border-hairline bg-hairline lg:grid-cols-2">
          {projects.map((p) => (
            <li key={p.id} className="bg-bg-elev/40 px-5 py-5">
              <Link
                href={`/partner/projects/${p.id}`}
                className="block space-y-2 hover:text-[var(--color-signal)]"
              >
                <header className="flex items-baseline justify-between gap-3">
                  <h3 className="font-display text-[1.05rem] tracking-[-0.01em] text-text">
                    {p.name}
                  </h3>
                  <span className="font-mono text-[10px] uppercase tracking-[0.14em] text-[var(--color-signal)]">
                    {STATUS_LABEL[p.status]}
                  </span>
                </header>
                <p className="font-mono text-[10.5px] uppercase tracking-[0.12em] text-[var(--color-text-muted)]">
                  Client · {p.client_org_name}
                </p>
                {p.business_label && (
                  <p className="font-mono text-[10.5px] uppercase tracking-[0.12em] text-[var(--color-text-muted)]">
                    {p.business_label}
                  </p>
                )}
              </Link>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
