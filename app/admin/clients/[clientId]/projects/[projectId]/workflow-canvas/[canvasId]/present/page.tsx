import Link from "next/link";
import { notFound } from "next/navigation";

import { WorkflowCanvasShell } from "@/components/workflow-canvas/WorkflowCanvasShell";
import { getCanvasBundle } from "@/lib/workflow-canvas/canvas";

export const metadata = { title: "Workflow Canvas — Presentation" };
export const dynamic = "force-dynamic";

interface Props {
  params: Promise<{ clientId: string; projectId: string; canvasId: string }>;
}

export default async function CanvasPresentPage({ params }: Props) {
  const { clientId, projectId, canvasId } = await params;
  const bundle = await getCanvasBundle(canvasId, "admin");
  if (!bundle) notFound();

  return (
    <div className="space-y-4">
      <header className="flex items-baseline justify-between gap-3">
        <div>
          <p className="font-mono text-[10.5px] uppercase tracking-[0.16em] text-[var(--color-signal)]">
            Presentation mode
          </p>
          <h1 className="font-display text-[1.6rem] tracking-[-0.01em] text-text">
            {bundle.canvas.title}
          </h1>
          {bundle.canvas.subtitle && (
            <p className="font-mono text-[10.5px] uppercase tracking-[0.14em] text-[var(--color-text-muted)]">
              {bundle.canvas.subtitle}
            </p>
          )}
        </div>
        <Link
          href={`/admin/clients/${clientId}/projects/${projectId}/workflow-canvas/${canvasId}`}
          className="font-mono text-[10.5px] uppercase tracking-[0.14em] text-[var(--color-text-faded)] hover:text-[var(--color-signal)]"
        >
          ← Exit
        </Link>
      </header>

      <WorkflowCanvasShell
        canvas={bundle.canvas}
        initialNodes={bundle.nodes}
        initialEdges={bundle.edges}
        audience="admin"
        mode="present"
        organizationId={clientId}
        projectId={projectId}
      />
    </div>
  );
}
