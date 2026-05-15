import Link from "next/link";

import { Eyebrow } from "@/components/primitives/Eyebrow";
import type { ProjectWithPartner } from "@/lib/projects/projects";

interface ProjectOverviewProps {
  project: ProjectWithPartner;
  /** When true, hide commercial/referral details (partner audience). */
  audience?: "admin" | "client" | "partner";
  blueprintHref?: string | null;
}

const STATUS_LABEL: Record<ProjectWithPartner["status"], string> = {
  discovery: "Discovery",
  proposal: "Proposal",
  implementation: "Implementation",
  live: "Live",
  archived: "Archived",
  on_hold: "On hold",
};

export function ProjectOverview({
  project,
  audience = "admin",
  blueprintHref,
}: ProjectOverviewProps) {
  const showPartner =
    audience !== "partner" &&
    project.partner_org_name &&
    (audience === "admin" || project.partner_visible_to_client);

  return (
    <article className="space-y-8">
      <header className="space-y-3">
        <p className="font-mono text-[10.5px] uppercase tracking-[0.16em] text-[var(--color-signal)]">
          Project · {STATUS_LABEL[project.status]}
        </p>
        <h1 className="font-display text-[2rem] tracking-[-0.01em] text-text">
          {project.name}
        </h1>
        {project.business_label && (
          <p className="font-mono text-[11px] uppercase tracking-[0.14em] text-[var(--color-text-muted)]">
            {project.business_label}
          </p>
        )}
        {project.badges.length > 0 && (
          <div className="flex flex-wrap gap-2">
            {project.badges.map((b) => (
              <span
                key={b}
                className="rounded-full border border-hairline px-2.5 py-1 font-mono text-[10px] uppercase tracking-[0.14em] text-[var(--color-text-faded)]"
              >
                {b}
              </span>
            ))}
          </div>
        )}
      </header>

      {project.description && (
        <section className="space-y-2">
          <Eyebrow number="01">Summary</Eyebrow>
          <p className="text-[14px] leading-relaxed text-text">{project.description}</p>
        </section>
      )}

      <section className="grid gap-px overflow-hidden rounded-2xl border border-hairline bg-hairline sm:grid-cols-2 lg:grid-cols-3">
        <div className="space-y-1 bg-bg-elev/40 px-5 py-4">
          <p className="font-mono text-[10px] uppercase tracking-[0.14em] text-[var(--color-text-muted)]">
            Client
          </p>
          <p className="text-[14px] text-text">{project.client_org_name}</p>
        </div>
        {showPartner && (
          <div className="space-y-1 bg-bg-elev/40 px-5 py-4">
            <p className="font-mono text-[10px] uppercase tracking-[0.14em] text-[var(--color-text-muted)]">
              Referred by
            </p>
            <p className="text-[14px] text-text">{project.partner_org_name}</p>
          </div>
        )}
        {project.industry_label && (
          <div className="space-y-1 bg-bg-elev/40 px-5 py-4">
            <p className="font-mono text-[10px] uppercase tracking-[0.14em] text-[var(--color-text-muted)]">
              Industry
            </p>
            <p className="text-[14px] text-text">{project.industry_label}</p>
          </div>
        )}
      </section>

      {blueprintHref && (
        <section className="space-y-2">
          <Eyebrow number="02">Linked blueprint</Eyebrow>
          <Link
            href={blueprintHref}
            className="inline-block rounded-full border border-[var(--color-signal-deep)] px-4 py-1.5 font-mono text-[10.5px] uppercase tracking-[0.14em] text-[var(--color-signal-soft)] hover:border-[var(--color-signal)] hover:text-[var(--color-signal)]"
          >
            View blueprint →
          </Link>
        </section>
      )}
    </article>
  );
}
