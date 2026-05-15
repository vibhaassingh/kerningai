import Link from "next/link";
import { notFound } from "next/navigation";

import { ProjectOverview } from "@/components/projects/ProjectOverview";
import { Eyebrow } from "@/components/primitives/Eyebrow";
import { listCanvasesForProject } from "@/lib/workflow-canvas/canvas";
import { getProject } from "@/lib/projects/projects";

export const metadata = { title: "Project — Overview" };
export const dynamic = "force-dynamic";

interface Props {
  params: Promise<{ projectId: string }>;
}

const TYPE_LABEL: Record<string, string> = {
  current_manual: "Current Manual",
  proposed_erp: "Proposed ERP",
  erp_ai: "ERP + AI",
  combined: "Combined",
  module_mapping: "Module Mapping",
};

export default async function PortalProjectOverviewPage({ params }: Props) {
  const { projectId } = await params;
  const [project, canvases] = await Promise.all([
    getProject(projectId),
    listCanvasesForProject(projectId, "client"),
  ]);
  if (!project) notFound();

  return (
    <div className="space-y-10">
      <ProjectOverview project={project} audience="client" />

      <section className="space-y-3">
        <Eyebrow number="03">Workflow canvases shared with you</Eyebrow>
        {canvases.length === 0 ? (
          <p className="rounded-2xl border border-hairline bg-bg-elev/30 px-5 py-8 text-center text-[13px] text-[var(--color-text-muted)]">
            No canvases shared yet.
          </p>
        ) : (
          <ul className="grid gap-px overflow-hidden rounded-2xl border border-hairline bg-hairline lg:grid-cols-2">
            {canvases.map((c) => (
              <li key={c.id} className="bg-bg-elev/40 px-5 py-5">
                <Link
                  href={`/portal/projects/${projectId}/workflow-canvas/${c.id}`}
                  className="block space-y-2 hover:text-[var(--color-signal)]"
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
              </li>
            ))}
          </ul>
        )}
      </section>
    </div>
  );
}
