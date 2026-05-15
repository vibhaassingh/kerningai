import Link from "next/link";
import { notFound } from "next/navigation";

import { ClientShell } from "@/components/portal/ClientShell";
import { WorkflowCanvasLegend } from "@/components/workflow-canvas/WorkflowCanvasLegend";
import { WorkflowCanvasShell } from "@/components/workflow-canvas/WorkflowCanvasShell";
import { Eyebrow } from "@/components/primitives/Eyebrow";
import { getCanvasBundle } from "@/lib/workflow-canvas/canvas";

export const metadata = { title: "Workflow Canvas — Review" };
export const dynamic = "force-dynamic";

interface Props {
  params: Promise<{ projectId: string; canvasId: string }>;
}

export default async function PortalCanvasPage({ params }: Props) {
  const { projectId, canvasId } = await params;
  const bundle = await getCanvasBundle(canvasId, "client");
  if (!bundle) notFound();

  return (
    <ClientShell>
      <div className="space-y-6">
        <header className="flex items-baseline justify-between gap-3">
          <div className="space-y-1">
            <Eyebrow number="01">Workflow canvas</Eyebrow>
            <h1 className="font-display text-[1.5rem] tracking-[-0.01em] text-text">
              {bundle.canvas.title}
            </h1>
            {bundle.canvas.subtitle && (
              <p className="font-mono text-[10.5px] uppercase tracking-[0.14em] text-[var(--color-text-muted)]">
                {bundle.canvas.subtitle}
              </p>
            )}
          </div>
          <Link
            href={`/portal/projects/${projectId}/overview`}
            className="font-mono text-[10.5px] uppercase tracking-[0.14em] text-[var(--color-text-faded)] hover:text-[var(--color-signal)]"
          >
            ← Back to project
          </Link>
        </header>

        <WorkflowCanvasLegend />

        <WorkflowCanvasShell
          canvas={bundle.canvas}
          initialNodes={bundle.nodes}
          initialEdges={bundle.edges}
          audience="client"
          mode="review"
          organizationId={bundle.canvas.organization_id}
          projectId={projectId}
        />
      </div>
    </ClientShell>
  );
}
