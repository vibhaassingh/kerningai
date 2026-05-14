import type { CanvasNodeType } from "@/lib/workflow-canvas/types";

const LEGEND: Array<{ type: CanvasNodeType; label: string; token: string }> = [
  { type: "process", label: "Process", token: "var(--color-canvas-process)" },
  { type: "approval", label: "Approval", token: "var(--color-canvas-approval)" },
  { type: "document", label: "Document", token: "var(--color-canvas-document)" },
  { type: "data", label: "Data", token: "var(--color-canvas-data)" },
  { type: "pain_point", label: "Pain point", token: "var(--color-canvas-pain)" },
  { type: "ai", label: "AI", token: "var(--color-canvas-ai)" },
  { type: "erp_module", label: "ERP module", token: "var(--color-canvas-erp-module)" },
  { type: "decision", label: "Decision", token: "var(--color-canvas-decision)" },
  { type: "external_actor", label: "External", token: "var(--color-canvas-external)" },
  { type: "system", label: "System", token: "var(--color-canvas-system)" },
];

export function WorkflowCanvasLegend() {
  return (
    <div className="flex flex-wrap items-center gap-x-4 gap-y-2 rounded-2xl border border-hairline bg-bg-elev/30 px-4 py-3">
      <span className="font-mono text-[10px] uppercase tracking-[0.16em] text-[var(--color-text-muted)]">
        Legend
      </span>
      {LEGEND.map((l) => (
        <span
          key={l.type}
          className="inline-flex items-center gap-1.5 font-mono text-[10.5px] uppercase tracking-[0.14em] text-[var(--color-text-faded)]"
        >
          <span
            aria-hidden
            className="inline-block h-2 w-4 rounded-sm"
            style={{ background: l.token }}
          />
          {l.label}
        </span>
      ))}
    </div>
  );
}
