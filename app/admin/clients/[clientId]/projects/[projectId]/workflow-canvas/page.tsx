import Link from "next/link";

import { Eyebrow } from "@/components/primitives/Eyebrow";
import { listCanvasesForProject } from "@/lib/workflow-canvas/canvas";

export const metadata = { title: "Workflow Canvas" };
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

const STATUS_LABEL: Record<string, string> = {
  draft: "Draft",
  internal_review: "Internal review",
  client_ready: "Client ready",
  shared_with_client: "Shared with client",
  approved: "Approved",
  archived: "Archived",
};

export default async function CanvasListPage({ params }: Props) {
  const { clientId, projectId } = await params;
  const canvases = await listCanvasesForProject(projectId, "admin");

  return (
    <div className="space-y-10">
      <section className="space-y-3">
        <Eyebrow number="01">Workflow canvases</Eyebrow>
        <p className="text-[14px] text-[var(--color-text-faded)]">
          Canvases are the visual representation of the project workflow. Build
          them during discovery, refine for proposal, share with the client.
        </p>
      </section>

      {canvases.length === 0 ? (
        <p className="rounded-2xl border border-hairline bg-bg-elev/30 px-5 py-8 text-center text-[13px] text-[var(--color-text-muted)]">
          No canvases yet for this project.
        </p>
      ) : (
        <ul className="grid gap-px overflow-hidden rounded-2xl border border-hairline bg-hairline lg:grid-cols-2">
          {canvases.map((c) => (
            <li key={c.id} className="bg-bg-elev/40 px-5 py-5">
              <Link
                href={`/admin/clients/${clientId}/projects/${projectId}/workflow-canvas/${c.id}`}
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
                <p className="font-mono text-[10px] uppercase tracking-[0.14em] text-[var(--color-text-faded)]">
                  Status · {STATUS_LABEL[c.status]} · v{c.version}
                </p>
                {c.badges.length > 0 && (
                  <div className="flex flex-wrap gap-1.5 pt-1">
                    {c.badges.map((b) => (
                      <span
                        key={b}
                        className="rounded-full border border-hairline px-2 py-0.5 font-mono text-[9.5px] uppercase tracking-[0.12em] text-[var(--color-text-faded)]"
                      >
                        {b}
                      </span>
                    ))}
                  </div>
                )}
              </Link>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
