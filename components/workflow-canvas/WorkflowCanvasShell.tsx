"use client";

import {
  Background,
  BackgroundVariant,
  Controls,
  MiniMap,
  ReactFlow,
  ReactFlowProvider,
  applyEdgeChanges,
  applyNodeChanges,
  type Edge,
  type EdgeChange,
  type Node,
  type NodeChange,
} from "@xyflow/react";
import { toPng } from "html-to-image";
import {
  useCallback,
  useMemo,
  useRef,
  useState,
  useTransition,
} from "react";

import { saveCanvas } from "@/lib/workflow-canvas/canvas-actions";
import type {
  CanvasAudience,
  CanvasNodePhase,
  CanvasVisibility,
  WorkflowCanvas,
  WorkflowCanvasEdge,
  WorkflowCanvasNode,
} from "@/lib/workflow-canvas/types";
import { NODE_TYPES, type CanvasNodeData } from "@/components/workflow-canvas/nodes";
import { WorkflowNodeDetailDrawer } from "@/components/workflow-canvas/WorkflowNodeDetailDrawer";

interface WorkflowCanvasShellProps {
  canvas: WorkflowCanvas;
  initialNodes: WorkflowCanvasNode[];
  initialEdges: WorkflowCanvasEdge[];
  audience: CanvasAudience;
  mode: "edit" | "present" | "review";
  organizationId: string;
  projectId: string;
}

const PHASE_LABEL: Record<CanvasNodePhase, string> = {
  current_manual: "Current Manual Workflow",
  proposed_erp: "Proposed ERP Workflow",
  erp_ai: "ERP + AI Workflow",
  module_mapping: "Module Mapping",
};

type ViewMode = "all" | CanvasNodePhase | "before_erp" | "after_erp";

const VIEW_OPTIONS: Array<{ value: ViewMode; label: string }> = [
  { value: "all", label: "Combined" },
  { value: "before_erp", label: "Before ERP" },
  { value: "after_erp", label: "After ERP + AI" },
  { value: "current_manual", label: "— Current Manual" },
  { value: "proposed_erp", label: "— Proposed ERP" },
  { value: "erp_ai", label: "— ERP + AI" },
];

function viewToPhases(view: ViewMode): Set<CanvasNodePhase> | "all" {
  if (view === "all") return "all";
  if (view === "before_erp") return new Set<CanvasNodePhase>(["current_manual"]);
  if (view === "after_erp") return new Set<CanvasNodePhase>(["proposed_erp", "erp_ai"]);
  return new Set<CanvasNodePhase>([view]);
}

function toReactFlowNode(
  n: WorkflowCanvasNode,
  onOpenDetail: (key: string) => void,
): Node<CanvasNodeData> {
  return {
    id: n.node_key,
    position: { x: n.position_x, y: n.position_y },
    type: n.node_type,
    data: { payload: n, onOpenDetail },
  };
}

function toReactFlowEdge(e: WorkflowCanvasEdge): Edge {
  const baseColor =
    e.edge_type === "ai_assisted"
      ? "var(--color-canvas-ai)"
      : e.edge_type === "exception"
        ? "var(--color-canvas-pain)"
        : e.edge_type === "system_automation"
          ? "var(--color-canvas-system)"
          : e.edge_type === "approval"
            ? "var(--color-canvas-approval)"
            : "var(--color-text-faint)";
  const dashed = e.edge_type === "exception" || e.edge_type === "ai_assisted";
  return {
    id: e.edge_key,
    source: e.source_node_key,
    target: e.target_node_key,
    label: e.label ?? undefined,
    labelStyle: e.label
      ? { fill: "var(--color-text-faded)", fontSize: 10, fontFamily: "var(--font-mono)" }
      : undefined,
    labelBgStyle: e.label
      ? { fill: "var(--color-bg-elev)", fillOpacity: 0.92 }
      : undefined,
    style: {
      stroke: baseColor,
      strokeDasharray: dashed ? "4 4" : undefined,
      strokeWidth: 1.4,
    },
    animated: e.edge_type === "ai_assisted",
  };
}

function fromReactFlowNode(
  n: Node<CanvasNodeData>,
): Omit<WorkflowCanvasNode, "id" | "canvas_id" | "metadata"> {
  const p = n.data.payload;
  return {
    node_key: p.node_key,
    node_type: p.node_type,
    phase: p.phase,
    department: p.department,
    visibility: p.visibility,
    title: p.title,
    short_label: p.short_label,
    description: p.description,
    actors: p.actors,
    current_process: p.current_process,
    proposed_process: p.proposed_process,
    ai_opportunity: p.ai_opportunity,
    pain_points: p.pain_points,
    erp_modules: p.erp_modules,
    documents: p.documents,
    data_captured: p.data_captured,
    risk_level: p.risk_level,
    automation_potential: p.automation_potential,
    internal_notes: p.internal_notes,
    client_notes: p.client_notes,
    position_x: n.position.x,
    position_y: n.position.y,
  };
}

function InnerCanvas(props: WorkflowCanvasShellProps) {
  const {
    canvas,
    initialNodes,
    initialEdges,
    audience,
    mode,
    organizationId,
    projectId,
  } = props;

  const [view, setView] = useState<ViewMode>("all");
  const [openDetailKey, setOpenDetailKey] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();
  const [savedAt, setSavedAt] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [isExporting, setIsExporting] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);

  const handleOpenDetail = useCallback((key: string) => {
    setOpenDetailKey(key);
  }, []);

  const allNodes = useMemo(
    () => initialNodes.map((n) => toReactFlowNode(n, handleOpenDetail)),
    [initialNodes, handleOpenDetail],
  );
  const allEdges = useMemo(
    () => initialEdges.map(toReactFlowEdge),
    [initialEdges],
  );

  const [nodes, setNodes] = useState<Node<CanvasNodeData>[]>(allNodes);
  const [edges, setEdges] = useState<Edge[]>(allEdges);

  const visibleNodes = useMemo(() => {
    const phaseSet = viewToPhases(view);
    if (phaseSet === "all") return nodes;
    return nodes.filter((n) => phaseSet.has(n.data.payload.phase));
  }, [nodes, view]);

  const visibleNodeIds = useMemo(
    () => new Set(visibleNodes.map((n) => n.id)),
    [visibleNodes],
  );

  const visibleEdges = useMemo(
    () =>
      edges.filter(
        (e) => visibleNodeIds.has(e.source) && visibleNodeIds.has(e.target),
      ),
    [edges, visibleNodeIds],
  );

  const isEditable = mode === "edit" && audience === "admin";

  const onNodesChange = useCallback(
    (changes: NodeChange[]) => {
      if (!isEditable) return;
      setNodes((nds) => applyNodeChanges(changes, nds) as Node<CanvasNodeData>[]);
    },
    [isEditable],
  );

  const onEdgesChange = useCallback(
    (changes: EdgeChange[]) => {
      if (!isEditable) return;
      setEdges((eds) => applyEdgeChanges(changes, eds));
    },
    [isEditable],
  );

  const saveTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const triggerAutosave = useCallback(() => {
    if (!isEditable) return;
    if (saveTimer.current) clearTimeout(saveTimer.current);
    saveTimer.current = setTimeout(() => {
      startTransition(async () => {
        const result = await saveCanvas({
          canvasId: canvas.id,
          organizationId,
          projectId,
          viewport: canvas.viewport,
          nodes: nodes.map(fromReactFlowNode),
          edges: edges.map((e) => {
            const seed = initialEdges.find((ie) => ie.edge_key === e.id);
            return {
              edge_key: e.id,
              source_node_key: e.source,
              target_node_key: e.target,
              edge_type: seed?.edge_type ?? "normal",
              phase: seed?.phase ?? "current_manual",
              visibility: (seed?.visibility ?? "internal_only") as CanvasVisibility,
              label: typeof e.label === "string" ? e.label : null,
              condition: seed?.condition ?? null,
            };
          }),
        });
        if (result.ok) {
          setSavedAt(result.data?.savedAt ?? new Date().toISOString());
          setError(null);
        } else {
          setError(result.error);
        }
      });
    }, 1500);
  }, [canvas, nodes, edges, organizationId, projectId, isEditable, initialEdges]);

  const onNodeDragStop = useCallback(() => triggerAutosave(), [triggerAutosave]);

  const handleExportPng = useCallback(async () => {
    if (!containerRef.current) return;
    setIsExporting(true);
    try {
      // Find the actual ReactFlow viewport element to capture (not the toolbar).
      const viewport = containerRef.current.querySelector(
        ".react-flow__viewport",
      ) as HTMLElement | null;
      const target = viewport?.parentElement ?? containerRef.current;
      const dataUrl = await toPng(target, {
        backgroundColor: "#0c0c0e",
        pixelRatio: 2,
        cacheBust: true,
        filter: (node) => {
          // Skip the minimap and controls in the export.
          const className =
            (node as HTMLElement).className?.toString?.() ?? "";
          return (
            !className.includes("react-flow__minimap") &&
            !className.includes("react-flow__controls")
          );
        },
      });
      const link = document.createElement("a");
      link.download = `${canvas.title.toLowerCase().replace(/\s+/g, "-")}-${view}.png`;
      link.href = dataUrl;
      link.click();
    } catch (err) {
      setError(`PNG export failed: ${err instanceof Error ? err.message : String(err)}`);
    } finally {
      setIsExporting(false);
    }
  }, [canvas.title, view]);

  const handleToggleFullscreen = useCallback(async () => {
    if (!containerRef.current) return;
    if (!document.fullscreenElement) {
      try {
        await containerRef.current.requestFullscreen();
        setIsFullscreen(true);
      } catch {
        // Some browsers reject fullscreen requests outside user-gesture
        // contexts — silently no-op.
      }
    } else {
      await document.exitFullscreen();
      setIsFullscreen(false);
    }
  }, []);

  const openDetailNode = openDetailKey
    ? initialNodes.find((n) => n.node_key === openDetailKey) ?? null
    : null;

  const heightClass = isFullscreen
    ? "h-screen"
    : mode === "present"
      ? "h-[calc(100dvh-160px)]"
      : "h-[calc(100dvh-220px)]";

  return (
    <div
      ref={containerRef}
      className={`relative ${heightClass} min-h-[600px] overflow-hidden rounded-2xl border border-hairline bg-bg-elev/40`}
    >
      {/* Toolbar */}
      <div className="absolute left-0 right-0 top-0 z-10 flex flex-wrap items-center gap-3 border-b border-hairline bg-bg-elev/80 px-4 py-3 backdrop-blur">
        <div className="flex items-center gap-2">
          <span className="font-mono text-[10px] uppercase tracking-[0.16em] text-[var(--color-text-muted)]">
            View
          </span>
          <select
            value={view}
            onChange={(ev) => setView(ev.target.value as ViewMode)}
            className="rounded-md border border-hairline bg-bg px-2 py-1 text-[12px] text-text"
            aria-label="Canvas view"
          >
            {VIEW_OPTIONS.map((o) => (
              <option key={o.value} value={o.value}>
                {o.label}
              </option>
            ))}
          </select>
        </div>

        {mode !== "present" && (
          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={handleExportPng}
              disabled={isExporting}
              className="rounded-full border border-hairline px-3 py-1 font-mono text-[10px] uppercase tracking-[0.14em] text-[var(--color-text-faded)] hover:border-[var(--color-signal)] hover:text-[var(--color-signal)] disabled:opacity-50"
            >
              {isExporting ? "Exporting…" : "Export PNG"}
            </button>
            <button
              type="button"
              onClick={handleToggleFullscreen}
              className="rounded-full border border-hairline px-3 py-1 font-mono text-[10px] uppercase tracking-[0.14em] text-[var(--color-text-faded)] hover:border-[var(--color-signal)] hover:text-[var(--color-signal)]"
            >
              {isFullscreen ? "Exit fullscreen" : "Fullscreen"}
            </button>
          </div>
        )}

        <div className="ml-auto flex items-center gap-3 text-[11px] text-[var(--color-text-faded)]">
          {error && (
            <span className="text-[var(--color-canvas-pain)]">{error}</span>
          )}
          {!error && isEditable && (
            <span aria-live="polite">
              {isPending
                ? "Saving…"
                : savedAt
                  ? `Saved ${new Date(savedAt).toLocaleTimeString()}`
                  : "Drag a node to autosave"}
            </span>
          )}
          <span className="font-mono uppercase tracking-[0.14em] text-[var(--color-text-muted)]">
            {audience} · {mode}
          </span>
        </div>
      </div>

      <div className="absolute inset-0 pt-[58px]">
        <ReactFlow
          nodes={visibleNodes}
          edges={visibleEdges}
          onNodesChange={onNodesChange}
          onEdgesChange={onEdgesChange}
          onNodeDragStop={onNodeDragStop}
          nodeTypes={NODE_TYPES}
          nodesDraggable={isEditable}
          nodesConnectable={isEditable}
          elementsSelectable
          fitView
          fitViewOptions={{ padding: 0.2 }}
          proOptions={{ hideAttribution: true }}
        >
          <Background variant={BackgroundVariant.Dots} gap={24} size={1} color="var(--color-hairline)" />
          {mode !== "present" && (
            <Controls position="bottom-right" showInteractive={isEditable} />
          )}
          {mode !== "present" && (
            <MiniMap
              position="top-right"
              pannable
              zoomable
              nodeColor={(n) => {
                const data = n.data as CanvasNodeData | undefined;
                const t = data?.payload.node_type;
                const map: Record<string, string> = {
                  process: "rgba(236, 233, 226, 0.6)",
                  approval: "#f1ad3d",
                  document: "#6ea7d8",
                  data: "#8fa3c6",
                  pain_point: "#e57373",
                  ai: "#b294d8",
                  erp_module: "#7fbf9e",
                  decision: "#d8a05f",
                  external_actor: "#8a857c",
                  system: "#5fb0c2",
                };
                return t ? map[t] ?? "#888" : "#888";
              }}
              maskColor="rgba(12,12,14,0.6)"
              style={{ background: "var(--color-bg-elev)" }}
            />
          )}
        </ReactFlow>
      </div>

      {/* View badge */}
      {view !== "all" && (
        <div className="absolute bottom-4 left-4 z-10 rounded-lg border border-hairline bg-bg-elev/90 px-3 py-2 backdrop-blur">
          <p className="font-mono text-[10px] uppercase tracking-[0.14em] text-[var(--color-signal)]">
            {view === "before_erp"
              ? "Before ERP — current manual workflow"
              : view === "after_erp"
                ? "After ERP + AI — proposed system + AI overlay"
                : PHASE_LABEL[view]}
          </p>
          <p className="font-mono text-[9.5px] uppercase tracking-[0.14em] text-[var(--color-text-muted)]">
            {visibleNodes.length} nodes · {visibleEdges.length} edges
          </p>
        </div>
      )}

      <WorkflowNodeDetailDrawer
        node={openDetailNode}
        audience={audience}
        onClose={() => setOpenDetailKey(null)}
      />
    </div>
  );
}

export function WorkflowCanvasShell(props: WorkflowCanvasShellProps) {
  return (
    <ReactFlowProvider>
      <InnerCanvas {...props} />
    </ReactFlowProvider>
  );
}
