import Link from "next/link";
import { notFound } from "next/navigation";

import { ShareButton } from "@/components/workflow-canvas/ShareDialogs";
import { WorkflowCanvasLegend } from "@/components/workflow-canvas/WorkflowCanvasLegend";
import { WorkflowCanvasShell } from "@/components/workflow-canvas/WorkflowCanvasShell";
import { Eyebrow } from "@/components/primitives/Eyebrow";
import { hasPermissionAny } from "@/lib/auth/require";
import { getCanvasBundle } from "@/lib/workflow-canvas/canvas";

export const metadata = { title: "Workflow Canvas — Editor" };
export const dynamic = "force-dynamic";

interface Props {
  params: Promise<{ clientId: string; projectId: string; canvasId: string }>;
}

export default async function CanvasEditPage({ params }: Props) {
  const { clientId, projectId, canvasId } = await params;
  const bundle = await getCanvasBundle(canvasId, "admin");
  if (!bundle) notFound();

  const canShare = await hasPermissionAny("share_workflow_canvas");

  return (
    <div className="space-y-6">
      <header className="flex flex-wrap items-baseline justify-between gap-3">
        <div className="space-y-1">
          <Eyebrow number="01">Workflow canvas</Eyebrow>
          <h2 className="font-display text-[1.5rem] tracking-[-0.01em] text-text">
            {bundle.canvas.title}
          </h2>
          {bundle.canvas.subtitle && (
            <p className="font-mono text-[10.5px] uppercase tracking-[0.14em] text-[var(--color-text-muted)]">
              {bundle.canvas.subtitle}
            </p>
          )}
        </div>
        <div className="flex flex-wrap items-center gap-3">
          <Link
            href={`/admin/clients/${clientId}/projects/${projectId}/workflow-canvas/${canvasId}/present`}
            className="rounded-full border border-hairline px-4 py-1.5 font-mono text-[10.5px] uppercase tracking-[0.14em] text-[var(--color-text-faded)] hover:border-[var(--color-signal)] hover:text-[var(--color-signal)]"
          >
            Presentation mode →
          </Link>
          {canShare && (
            <>
              <ShareButton
                kind="client"
                canvasId={canvasId}
                organizationId={clientId}
                projectId={projectId}
              />
              <ShareButton
                kind="partner"
                canvasId={canvasId}
                organizationId={clientId}
                projectId={projectId}
              />
            </>
          )}
        </div>
      </header>

      <WorkflowCanvasLegend />

      <WorkflowCanvasShell
        canvas={bundle.canvas}
        initialNodes={bundle.nodes}
        initialEdges={bundle.edges}
        audience="admin"
        mode="edit"
        organizationId={clientId}
        projectId={projectId}
      />
    </div>
  );
}
