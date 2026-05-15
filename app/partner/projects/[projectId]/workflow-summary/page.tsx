import Link from "next/link";
import { notFound } from "next/navigation";

import { WorkflowCanvasLegend } from "@/components/workflow-canvas/WorkflowCanvasLegend";
import { WorkflowCanvasShell } from "@/components/workflow-canvas/WorkflowCanvasShell";
import { Eyebrow } from "@/components/primitives/Eyebrow";
import { listCanvasesForProject, getCanvasBundle } from "@/lib/workflow-canvas/canvas";
import { getProject } from "@/lib/projects/projects";

export const metadata = { title: "Workflow Summary" };
export const dynamic = "force-dynamic";

interface Props {
  params: Promise<{ projectId: string }>;
}

export default async function PartnerWorkflowSummaryPage({ params }: Props) {
  const { projectId } = await params;
  const project = await getProject(projectId);
  if (!project) notFound();

  // Partner sees the combined canvas (if shared as partner_visible/shared_all).
  const canvases = await listCanvasesForProject(projectId, "partner");
  const combined =
    canvases.find((c) => c.canvas_type === "combined") ?? canvases[0] ?? null;

  if (!combined) {
    return (
      <div className="space-y-6">
        <header className="space-y-2">
          <Eyebrow number="01">Workflow summary</Eyebrow>
          <h1 className="font-display text-[1.6rem] tracking-[-0.01em] text-text">
            {project.name}
          </h1>
        </header>
        <p className="rounded-2xl border border-hairline bg-bg-elev/30 px-5 py-8 text-center text-[13px] text-[var(--color-text-muted)]">
          No partner-visible workflow summary published yet.
        </p>
      </div>
    );
  }

  const bundle = await getCanvasBundle(combined.id, "partner");
  if (!bundle) notFound();

  return (
    <div className="space-y-6">
      <header className="flex items-baseline justify-between gap-3">
        <div className="space-y-1">
          <Eyebrow number="01">Workflow summary</Eyebrow>
          <h1 className="font-display text-[1.5rem] tracking-[-0.01em] text-text">
            {project.name}
          </h1>
          <p className="font-mono text-[10.5px] uppercase tracking-[0.14em] text-[var(--color-text-muted)]">
            Read-only · partner view
          </p>
        </div>
        <Link
          href="/partner/projects"
          className="font-mono text-[10.5px] uppercase tracking-[0.14em] text-[var(--color-text-faded)] hover:text-[var(--color-signal)]"
        >
          ← All projects
        </Link>
      </header>

      <WorkflowCanvasLegend />

      <WorkflowCanvasShell
        canvas={bundle.canvas}
        initialNodes={bundle.nodes}
        initialEdges={bundle.edges}
        audience="partner"
        mode="review"
        organizationId={bundle.canvas.organization_id}
        projectId={projectId}
      />
    </div>
  );
}
