"use client";

import { Handle, Position, type NodeProps } from "@xyflow/react";
import type { CSSProperties, ReactNode } from "react";

import type {
  CanvasNodeType,
  WorkflowCanvasNode,
} from "@/lib/workflow-canvas/types";

// ---------------------------------------------------------------------------
// React Flow node data — every custom node receives this shape.
// ---------------------------------------------------------------------------
export interface CanvasNodeData extends Record<string, unknown> {
  payload: WorkflowCanvasNode;
  onOpenDetail?: (nodeKey: string) => void;
}

const TOKEN_BY_TYPE: Record<CanvasNodeType, string> = {
  process: "var(--color-canvas-process)",
  approval: "var(--color-canvas-approval)",
  document: "var(--color-canvas-document)",
  data: "var(--color-canvas-data)",
  pain_point: "var(--color-canvas-pain)",
  ai: "var(--color-canvas-ai)",
  erp_module: "var(--color-canvas-erp-module)",
  decision: "var(--color-canvas-decision)",
  external_actor: "var(--color-canvas-external)",
  system: "var(--color-canvas-system)",
};

const TYPE_LABEL: Record<CanvasNodeType, string> = {
  process: "Process",
  approval: "Approval",
  document: "Document",
  data: "Data",
  pain_point: "Pain Point",
  ai: "AI",
  erp_module: "ERP Module",
  decision: "Decision",
  external_actor: "External",
  system: "System",
};

// ---------------------------------------------------------------------------
// Shared shell — every node uses this; type-specific node component just
// wires the right shape/handle layout.
// ---------------------------------------------------------------------------
function NodeFrame({
  data,
  shape = "rect",
  children,
}: {
  data: CanvasNodeData;
  shape?: "rect" | "diamond" | "round" | "tag";
  children?: ReactNode;
}) {
  const accent = TOKEN_BY_TYPE[data.payload.node_type];
  const typeLabel = TYPE_LABEL[data.payload.node_type];
  const painCount = data.payload.pain_points?.length ?? 0;

  const baseStyle: CSSProperties = {
    borderColor: accent,
    boxShadow: `0 0 0 1px ${accent}33, 0 18px 36px -28px ${accent}88`,
  };

  const wrapperClass =
    "group relative bg-[var(--color-bg-elev)] text-text font-body text-[12px] leading-snug select-none cursor-pointer transition-shadow hover:shadow-md";
  const sizeClass = "min-w-[200px] max-w-[260px]";

  const shapeClass =
    shape === "diamond"
      ? "rotate-45 px-3 py-3"
      : shape === "round"
        ? "rounded-full px-5 py-4"
        : shape === "tag"
          ? "rounded-l-2xl rounded-r-md px-4 py-3"
          : "rounded-xl px-4 py-3";

  return (
    <div
      className={`${wrapperClass} ${sizeClass} ${shapeClass} border`}
      style={baseStyle}
      onClick={() => data.onOpenDetail?.(data.payload.node_key)}
    >
      <Handle type="target" position={Position.Left} className="!bg-text/40 !border-0" />
      <div className={shape === "diamond" ? "-rotate-45" : ""}>
        <header className="flex items-center justify-between gap-2 mb-1">
          <span
            className="font-mono text-[9.5px] uppercase tracking-[0.14em]"
            style={{ color: accent }}
          >
            {typeLabel}
          </span>
          {painCount > 0 && (
            <span className="font-mono text-[9px] uppercase tracking-[0.14em] text-[var(--color-canvas-pain)]">
              {painCount} pain
            </span>
          )}
        </header>
        <div className="font-display text-[13px] leading-tight text-text">
          {data.payload.short_label ?? data.payload.title}
        </div>
        {children && <div className="mt-1.5 text-[11px] text-[var(--color-text-faded)]">{children}</div>}
      </div>
      <Handle type="source" position={Position.Right} className="!bg-text/40 !border-0" />
    </div>
  );
}

// ---------------------------------------------------------------------------
// Per-type wrappers (kept thin so swapping shapes is local).
// ---------------------------------------------------------------------------
export function ProcessNode(props: NodeProps) {
  return <NodeFrame data={props.data as CanvasNodeData} shape="rect" />;
}

export function ApprovalNode(props: NodeProps) {
  const d = props.data as CanvasNodeData;
  return (
    <NodeFrame data={d} shape="rect">
      {d.payload.actors?.length ? d.payload.actors[0] : null}
    </NodeFrame>
  );
}

export function DocumentNode(props: NodeProps) {
  return <NodeFrame data={props.data as CanvasNodeData} shape="tag" />;
}

export function DataNode(props: NodeProps) {
  return <NodeFrame data={props.data as CanvasNodeData} shape="rect" />;
}

export function PainPointNode(props: NodeProps) {
  return <NodeFrame data={props.data as CanvasNodeData} shape="round" />;
}

export function AINode(props: NodeProps) {
  const d = props.data as CanvasNodeData;
  return (
    <NodeFrame data={d} shape="rect">
      {d.payload.ai_opportunity?.slice(0, 80)}
      {d.payload.ai_opportunity && d.payload.ai_opportunity.length > 80 ? "…" : ""}
    </NodeFrame>
  );
}

export function ERPModuleNode(props: NodeProps) {
  return <NodeFrame data={props.data as CanvasNodeData} shape="tag" />;
}

export function DecisionNode(props: NodeProps) {
  return <NodeFrame data={props.data as CanvasNodeData} shape="diamond" />;
}

export function ExternalActorNode(props: NodeProps) {
  return <NodeFrame data={props.data as CanvasNodeData} shape="round" />;
}

export function SystemNode(props: NodeProps) {
  return <NodeFrame data={props.data as CanvasNodeData} shape="rect" />;
}

export const NODE_TYPES: Record<CanvasNodeType, React.FC<NodeProps>> = {
  process: ProcessNode,
  approval: ApprovalNode,
  document: DocumentNode,
  data: DataNode,
  pain_point: PainPointNode,
  ai: AINode,
  erp_module: ERPModuleNode,
  decision: DecisionNode,
  external_actor: ExternalActorNode,
  system: SystemNode,
};
