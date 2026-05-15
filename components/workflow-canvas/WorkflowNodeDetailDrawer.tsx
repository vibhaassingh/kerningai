"use client";

import { Eyebrow } from "@/components/primitives/Eyebrow";
import type {
  CanvasAudience,
  WorkflowCanvasNode,
} from "@/lib/workflow-canvas/types";

interface WorkflowNodeDetailDrawerProps {
  node: WorkflowCanvasNode | null;
  audience: CanvasAudience;
  onClose: () => void;
}

const TYPE_LABEL: Record<string, string> = {
  process: "Process",
  approval: "Approval",
  document: "Document",
  data: "Data",
  pain_point: "Pain Point",
  ai: "AI Opportunity",
  erp_module: "ERP Module",
  decision: "Decision",
  external_actor: "External Actor",
  system: "System",
};

export function WorkflowNodeDetailDrawer({
  node,
  audience,
  onClose,
}: WorkflowNodeDetailDrawerProps) {
  if (!node) return null;

  return (
    <aside
      className="fixed right-0 top-0 z-50 flex h-dvh w-full max-w-[440px] flex-col border-l border-hairline bg-bg-elev/95 backdrop-blur-md"
      role="dialog"
      aria-label={`Detail for ${node.title}`}
    >
      <header className="flex items-start justify-between gap-3 border-b border-hairline px-6 py-5">
        <div className="space-y-1">
          <p className="font-mono text-[10.5px] uppercase tracking-[0.16em] text-[var(--color-signal)]">
            {TYPE_LABEL[node.node_type] ?? node.node_type}
          </p>
          <h2 className="font-display text-[1.3rem] tracking-[-0.01em] text-text">
            {node.title}
          </h2>
          {node.department && (
            <p className="font-mono text-[10.5px] uppercase tracking-[0.14em] text-[var(--color-text-muted)]">
              {node.department.replace("_", " ")}
            </p>
          )}
        </div>
        <button
          type="button"
          onClick={onClose}
          aria-label="Close"
          className="rounded-full border border-hairline px-2.5 py-1 font-mono text-[10px] uppercase tracking-[0.14em] text-[var(--color-text-faded)] hover:border-[var(--color-signal)] hover:text-text"
        >
          Close
        </button>
      </header>

      <div className="flex-1 space-y-6 overflow-y-auto px-6 py-6">
        {node.actors.length > 0 && (
          <section className="space-y-1.5">
            <Eyebrow number="01">Actors</Eyebrow>
            <p className="text-[13px] text-[var(--color-text-faded)]">
              {node.actors.join(" · ")}
            </p>
          </section>
        )}

        {node.current_process && (
          <section className="space-y-1.5">
            <Eyebrow number="02">Current process</Eyebrow>
            <p className="whitespace-pre-line text-[13.5px] leading-relaxed text-text">
              {node.current_process}
            </p>
          </section>
        )}

        {node.pain_points.length > 0 && (
          <section className="space-y-1.5">
            <Eyebrow number="03">Pain points</Eyebrow>
            <ul className="space-y-1 text-[13px] text-[var(--color-canvas-pain)]">
              {node.pain_points.map((p) => (
                <li key={p}>· {p}</li>
              ))}
            </ul>
          </section>
        )}

        {node.proposed_process && (
          <section className="space-y-1.5">
            <Eyebrow number="04">Proposed ERP process</Eyebrow>
            <p className="whitespace-pre-line text-[13.5px] leading-relaxed text-text">
              {node.proposed_process}
            </p>
          </section>
        )}

        {node.ai_opportunity && (
          <section className="space-y-1.5">
            <Eyebrow number="05">AI opportunity</Eyebrow>
            <p className="whitespace-pre-line text-[13.5px] leading-relaxed text-[var(--color-canvas-ai)]">
              {node.ai_opportunity}
            </p>
          </section>
        )}

        {node.erp_modules.length > 0 && (
          <section className="space-y-1.5">
            <Eyebrow number="06">ERP modules</Eyebrow>
            <p className="text-[13px] text-[var(--color-text-faded)]">
              {node.erp_modules.join(" · ")}
            </p>
          </section>
        )}

        {node.documents.length > 0 && (
          <section className="space-y-1.5">
            <Eyebrow number="07">Documents</Eyebrow>
            <ul className="space-y-1 text-[13px] text-[var(--color-text-faded)]">
              {node.documents.map((d) => (
                <li key={d}>· {d}</li>
              ))}
            </ul>
          </section>
        )}

        {node.data_captured.length > 0 && (
          <section className="space-y-1.5">
            <Eyebrow number="08">Data captured</Eyebrow>
            <p className="text-[13px] text-[var(--color-text-faded)]">
              {node.data_captured.join(" · ")}
            </p>
          </section>
        )}

        {(node.risk_level || node.automation_potential) && (
          <section className="grid grid-cols-2 gap-3">
            {node.risk_level && (
              <div className="rounded-lg border border-hairline px-3 py-3">
                <p className="font-mono text-[10px] uppercase tracking-[0.14em] text-[var(--color-text-muted)]">
                  Risk
                </p>
                <p className="text-[13px] text-text capitalize">{node.risk_level}</p>
              </div>
            )}
            {node.automation_potential && (
              <div className="rounded-lg border border-hairline px-3 py-3">
                <p className="font-mono text-[10px] uppercase tracking-[0.14em] text-[var(--color-text-muted)]">
                  Automation potential
                </p>
                <p className="text-[13px] text-text capitalize">
                  {node.automation_potential}
                </p>
              </div>
            )}
          </section>
        )}

        {audience !== "partner" && node.client_notes && (
          <section className="space-y-1.5 rounded-lg border border-[var(--color-signal-deep)] bg-[var(--color-signal)]/5 px-4 py-3">
            <Eyebrow number="09">Client-facing notes</Eyebrow>
            <p className="whitespace-pre-line text-[13px] text-text">
              {node.client_notes}
            </p>
          </section>
        )}

        {audience === "admin" && node.internal_notes && (
          <section className="space-y-1.5 rounded-lg border border-[var(--color-canvas-pain)] bg-[var(--color-canvas-pain)]/5 px-4 py-3">
            <Eyebrow number="10">Internal notes</Eyebrow>
            <p className="whitespace-pre-line text-[13px] text-text">
              {node.internal_notes}
            </p>
            <p className="font-mono text-[9.5px] uppercase tracking-[0.14em] text-[var(--color-text-muted)]">
              Internal only · never shown to client or partner
            </p>
          </section>
        )}
      </div>
    </aside>
  );
}
