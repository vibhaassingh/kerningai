import Link from "next/link";
import { notFound } from "next/navigation";

import { Eyebrow } from "@/components/primitives/Eyebrow";
import { listCanvasesForProject } from "@/lib/workflow-canvas/canvas";
import { getProject } from "@/lib/projects/projects";

export const metadata = { title: "Proposal — Workflow" };
export const dynamic = "force-dynamic";

interface Props {
  params: Promise<{ clientId: string; projectId: string }>;
}

const TYPE_LABEL: Record<string, string> = {
  current_manual: "Current Manual",
  proposed_erp: "Proposed ERP",
  erp_ai: "ERP + AI",
  combined: "Combined",
  module_mapping: "Module Mapping",
};

export default async function ProposalWorkflowPage({ params }: Props) {
  const { clientId, projectId } = await params;
  const [project, canvases] = await Promise.all([
    getProject(projectId),
    listCanvasesForProject(projectId, "admin"),
  ]);
  if (!project) notFound();

  const combined = canvases.find((c) => c.canvas_type === "combined");

  return (
    <div className="space-y-10">
      <section className="space-y-3">
        <Eyebrow number="01">Proposed workflow canvas</Eyebrow>
        <p className="text-[14px] text-[var(--color-text-faded)]">
          The proposal-prep view embeds canvas summaries for the proposal narrative.
          Open the full canvas for client presentation.
        </p>
      </section>

      <section className="grid gap-px overflow-hidden rounded-2xl border border-hairline bg-hairline lg:grid-cols-2">
        {canvases.map((c) => (
          <Link
            key={c.id}
            href={`/admin/clients/${clientId}/projects/${projectId}/workflow-canvas/${c.id}`}
            className="space-y-2 bg-bg-elev/40 px-5 py-5 hover:text-[var(--color-signal)]"
          >
            <header className="flex items-baseline justify-between gap-3">
              <h3 className="font-display text-[1.05rem] tracking-[-0.01em] text-text">
                {c.title}
              </h3>
              <span className="font-mono text-[10px] uppercase tracking-[0.14em] text-[var(--color-signal)]">
                {TYPE_LABEL[c.canvas_type]}
              </span>
            </header>
            {c.subtitle && (
              <p className="font-mono text-[10.5px] uppercase tracking-[0.12em] text-[var(--color-text-muted)]">
                {c.subtitle}
              </p>
            )}
          </Link>
        ))}
      </section>

      {combined && (
        <section className="space-y-3">
          <Eyebrow number="02">Open full canvas</Eyebrow>
          <Link
            href={`/admin/clients/${clientId}/projects/${projectId}/workflow-canvas/${combined.id}`}
            className="inline-block rounded-full border border-[var(--color-signal-deep)] px-4 py-1.5 font-mono text-[10.5px] uppercase tracking-[0.14em] text-[var(--color-signal-soft)] hover:border-[var(--color-signal)] hover:text-[var(--color-signal)]"
          >
            Open full workflow canvas →
          </Link>
        </section>
      )}
    </div>
  );
}
