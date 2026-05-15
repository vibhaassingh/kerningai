import Link from "next/link";
import { notFound } from "next/navigation";

import { PartnerRemarkForm } from "@/components/partner/PartnerRemarkForm";
import { WorkflowCanvasLegend } from "@/components/workflow-canvas/WorkflowCanvasLegend";
import { WorkflowCanvasShell } from "@/components/workflow-canvas/WorkflowCanvasShell";
import { Eyebrow } from "@/components/primitives/Eyebrow";
import { hasPermissionAny } from "@/lib/auth/require";
import {
  assertPartnerForProject,
  getPartnerFullCanvasBundle,
  listPartnerProjectCanvasesFull,
} from "@/lib/partner/partner-canvas";
import { createServiceClient } from "@/lib/supabase/service";

export const metadata = { title: "Workflow Summary" };
export const dynamic = "force-dynamic";

interface Props {
  params: Promise<{ projectId: string }>;
  searchParams: Promise<{ canvas?: string }>;
}

const VISIBILITY_LABEL: Record<string, string> = {
  internal_only: "Internal",
  partner_visible: "Partner",
  client_visible: "Client",
  shared_all: "Shared",
};

export default async function PartnerWorkflowSummaryPage({
  params,
  searchParams,
}: Props) {
  const { projectId } = await params;
  const { canvas: canvasParam } = await searchParams;

  const ctx = await assertPartnerForProject(projectId);
  if (!ctx) notFound();

  const canvases = await listPartnerProjectCanvasesFull(projectId);
  if (canvases.length === 0) {
    return (
      <div className="space-y-6">
        <header className="space-y-2">
          <Eyebrow number="01">Workflow summary</Eyebrow>
          <h1 className="font-display text-[1.6rem] tracking-[-0.01em] text-text">
            {ctx.name}
          </h1>
        </header>
        <p className="rounded-2xl border border-hairline bg-bg-elev/30 px-5 py-8 text-center text-[13px] text-[var(--color-text-muted)]">
          No workflow canvas has been built for this project yet.
        </p>
      </div>
    );
  }

  const selected =
    canvases.find((c) => c.id === canvasParam) ??
    canvases.find((c) => c.canvas_type === "combined") ??
    canvases[0];

  const full = await getPartnerFullCanvasBundle(projectId, selected.id);
  if (!full) notFound();

  const { bundle, comments } = full;
  const canComment = await hasPermissionAny("comment_on_workflow_canvas");

  // Resolve comment author names (service-role; partner full-detail path).
  const authorIds = [...new Set(comments.map((c) => c.user_id))];
  const authorMap = new Map<string, string>();
  if (authorIds.length > 0) {
    const service = createServiceClient();
    const { data: authors } = await service
      .from("app_users")
      .select("id, full_name, email")
      .in("id", authorIds);
    for (const a of (authors ?? []) as {
      id: string;
      full_name: string | null;
      email: string;
    }[]) {
      authorMap.set(a.id, a.full_name ?? a.email);
    }
  }

  return (
    <div className="space-y-6">
      <header className="flex items-baseline justify-between gap-3">
        <div className="space-y-1">
          <Eyebrow number="01">Workflow summary</Eyebrow>
          <h1 className="font-display text-[1.5rem] tracking-[-0.01em] text-text">
            {ctx.name}
          </h1>
          <p className="font-mono text-[10.5px] uppercase tracking-[0.14em] text-[var(--color-text-muted)]">
            Partner view · full detail · read-only
          </p>
        </div>
        <Link
          href={`/partner/projects/${projectId}`}
          className="font-mono text-[10.5px] uppercase tracking-[0.14em] text-[var(--color-text-faded)] hover:text-[var(--color-signal)]"
        >
          ← Project
        </Link>
      </header>

      {canvases.length > 1 && (
        <div className="flex flex-wrap gap-2">
          {canvases.map((c) => (
            <Link
              key={c.id}
              href={`/partner/projects/${projectId}/workflow-summary?canvas=${c.id}`}
              className={
                c.id === selected.id
                  ? "rounded-full border border-[var(--color-signal)] px-3 py-1 font-mono text-[10px] uppercase tracking-[0.14em] text-[var(--color-signal)]"
                  : "rounded-full border border-hairline px-3 py-1 font-mono text-[10px] uppercase tracking-[0.14em] text-[var(--color-text-faded)] hover:border-[var(--color-signal)] hover:text-[var(--color-signal)]"
              }
            >
              {c.title}
            </Link>
          ))}
        </div>
      )}

      <WorkflowCanvasLegend />

      <WorkflowCanvasShell
        canvas={bundle.canvas}
        initialNodes={bundle.nodes}
        initialEdges={bundle.edges}
        audience="admin"
        mode="review"
        organizationId={bundle.canvas.organization_id}
        projectId={projectId}
      />

      <section className="space-y-4">
        <Eyebrow number="02">Remarks</Eyebrow>
        {canComment ? (
          <PartnerRemarkForm projectId={projectId} canvasId={selected.id} />
        ) : (
          <p className="rounded-2xl border border-hairline bg-bg-elev/30 px-5 py-4 text-[12px] text-[var(--color-text-muted)]">
            Your role is read-only. Partner Owners and Partner Users can post
            remarks.
          </p>
        )}

        {comments.length === 0 ? (
          <p className="text-[13px] text-[var(--color-text-muted)]">
            No remarks yet.
          </p>
        ) : (
          <ul className="space-y-3">
            {comments.map((c) => (
              <li
                key={c.id}
                className="space-y-1.5 rounded-2xl border border-hairline bg-bg-elev/30 px-5 py-4"
              >
                <div className="flex flex-wrap items-baseline gap-x-3 gap-y-1 text-[11px] text-[var(--color-text-muted)]">
                  <span className="text-text">
                    {authorMap.get(c.user_id) ?? "Kerning"}
                  </span>
                  <span>·</span>
                  <span className="font-mono uppercase tracking-[0.14em]">
                    {VISIBILITY_LABEL[c.visibility] ?? c.visibility}
                  </span>
                  <span>·</span>
                  <time dateTime={c.created_at}>
                    {new Date(c.created_at).toLocaleDateString("en-GB", {
                      day: "numeric",
                      month: "short",
                      year: "numeric",
                    })}
                  </time>
                  {c.status === "resolved" && (
                    <span className="font-mono uppercase tracking-[0.14em] text-[var(--color-signal)]">
                      · resolved
                    </span>
                  )}
                </div>
                <p className="whitespace-pre-line text-[13.5px] leading-relaxed text-text">
                  {c.body}
                </p>
              </li>
            ))}
          </ul>
        )}
      </section>
    </div>
  );
}
