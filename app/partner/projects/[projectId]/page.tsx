import Link from "next/link";
import { notFound } from "next/navigation";

import { Eyebrow } from "@/components/primitives/Eyebrow";
import {
  assertPartnerForProject,
  listPartnerProjectCanvasesFull,
} from "@/lib/partner/partner-canvas";

export const metadata = { title: "Project" };
export const dynamic = "force-dynamic";

interface Props {
  params: Promise<{ projectId: string }>;
}

const STATUS_LABEL: Record<string, string> = {
  discovery: "Discovery",
  proposal: "Proposal",
  implementation: "Implementation",
  live: "Live",
  archived: "Archived",
  on_hold: "On hold",
};

export default async function PartnerProjectOverviewPage({ params }: Props) {
  const { projectId } = await params;
  const ctx = await assertPartnerForProject(projectId);
  if (!ctx) notFound();

  const canvases = await listPartnerProjectCanvasesFull(projectId);

  return (
    <div className="space-y-8">
      <header className="flex items-baseline justify-between gap-3">
        <div className="space-y-2">
          <Eyebrow number="01">Project</Eyebrow>
          <h1 className="font-display text-[1.7rem] tracking-[-0.01em] text-text">
            {ctx.name}
          </h1>
          <p className="font-mono text-[10.5px] uppercase tracking-[0.14em] text-[var(--color-signal)]">
            {STATUS_LABEL[ctx.status] ?? ctx.status}
          </p>
        </div>
        <Link
          href="/partner/projects"
          className="font-mono text-[10.5px] uppercase tracking-[0.14em] text-[var(--color-text-faded)] hover:text-[var(--color-signal)]"
        >
          ← All projects
        </Link>
      </header>

      {ctx.description && (
        <section className="space-y-2">
          <Eyebrow number="02">Summary</Eyebrow>
          <p className="text-[14px] leading-relaxed text-text">
            {ctx.description}
          </p>
        </section>
      )}

      <section className="grid gap-px overflow-hidden rounded-2xl border border-hairline bg-hairline sm:grid-cols-2 lg:grid-cols-3">
        <div className="space-y-1 bg-bg-elev/40 px-5 py-4">
          <p className="font-mono text-[10px] uppercase tracking-[0.14em] text-[var(--color-text-muted)]">
            Client
          </p>
          <p className="text-[14px] text-text">{ctx.client_org_name}</p>
        </div>
        {ctx.business_label && (
          <div className="space-y-1 bg-bg-elev/40 px-5 py-4">
            <p className="font-mono text-[10px] uppercase tracking-[0.14em] text-[var(--color-text-muted)]">
              Business
            </p>
            <p className="text-[14px] text-text">{ctx.business_label}</p>
          </div>
        )}
        {ctx.industry_label && (
          <div className="space-y-1 bg-bg-elev/40 px-5 py-4">
            <p className="font-mono text-[10px] uppercase tracking-[0.14em] text-[var(--color-text-muted)]">
              Industry
            </p>
            <p className="text-[14px] text-text">{ctx.industry_label}</p>
          </div>
        )}
      </section>

      <section className="space-y-3">
        <Eyebrow number="03">Workflow canvases</Eyebrow>
        {canvases.length === 0 ? (
          <p className="rounded-2xl border border-hairline bg-bg-elev/30 px-5 py-8 text-center text-[13px] text-[var(--color-text-muted)]">
            No workflow canvas has been built yet.
          </p>
        ) : (
          <ul className="grid gap-px overflow-hidden rounded-2xl border border-hairline bg-hairline lg:grid-cols-2">
            {canvases.map((c) => (
              <li key={c.id} className="bg-bg-elev/40 px-5 py-5">
                <Link
                  href={`/partner/projects/${projectId}/workflow-summary?canvas=${c.id}`}
                  className="block space-y-1.5 hover:text-[var(--color-signal)]"
                >
                  <h3 className="font-display text-[1.05rem] tracking-[-0.01em] text-text">
                    {c.title}
                  </h3>
                  {c.subtitle && (
                    <p className="text-[12.5px] text-[var(--color-text-faded)]">
                      {c.subtitle}
                    </p>
                  )}
                  <p className="font-mono text-[10px] uppercase tracking-[0.14em] text-[var(--color-text-muted)]">
                    {c.canvas_type.replace(/_/g, " ")} · v{c.version}
                  </p>
                </Link>
              </li>
            ))}
          </ul>
        )}
      </section>
    </div>
  );
}
