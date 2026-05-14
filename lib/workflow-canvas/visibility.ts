import type {
  CanvasAudience,
  CanvasVisibility,
  WorkflowCanvas,
  WorkflowCanvasBundle,
  WorkflowCanvasComment,
  WorkflowCanvasEdge,
  WorkflowCanvasNode,
} from "@/lib/workflow-canvas/types";

/**
 * Pure helpers that gate which fields/rows a given audience may see.
 *
 * RLS in Postgres already prevents unauthorized reads. These helpers run
 * a second time on the server-side result so we strip *fields* (not just
 * rows) the audience shouldn't see — for example client_visible nodes
 * still carry `internal_notes` in the DB row, but the client must never
 * receive that field.
 *
 * Internal-only nodes/edges/comments must never appear in client or
 * partner queries, even if the parent canvas is shared.
 */

const VISIBLE_TO_CLIENT: CanvasVisibility[] = ["client_visible", "shared_all"];
const VISIBLE_TO_PARTNER: CanvasVisibility[] = ["partner_visible", "shared_all"];

export function nodeVisibleTo(
  node: Pick<WorkflowCanvasNode, "visibility">,
  audience: CanvasAudience,
): boolean {
  if (audience === "admin") return true;
  if (audience === "client") return VISIBLE_TO_CLIENT.includes(node.visibility);
  return VISIBLE_TO_PARTNER.includes(node.visibility);
}

export function edgeVisibleTo(
  edge: Pick<WorkflowCanvasEdge, "visibility">,
  audience: CanvasAudience,
): boolean {
  if (audience === "admin") return true;
  if (audience === "client") return VISIBLE_TO_CLIENT.includes(edge.visibility);
  return VISIBLE_TO_PARTNER.includes(edge.visibility);
}

export function commentVisibleTo(
  comment: Pick<WorkflowCanvasComment, "visibility">,
  audience: CanvasAudience,
): boolean {
  if (audience === "admin") return true;
  if (audience === "client") return VISIBLE_TO_CLIENT.includes(comment.visibility);
  return VISIBLE_TO_PARTNER.includes(comment.visibility);
}

/**
 * Strips fields the audience shouldn't see from a node. Returns a fresh
 * object — does not mutate.
 */
export function redactNode(
  node: WorkflowCanvasNode,
  audience: CanvasAudience,
): WorkflowCanvasNode {
  if (audience === "admin") return node;

  const redacted: WorkflowCanvasNode = {
    ...node,
    internal_notes: null,
  };

  if (audience === "partner") {
    redacted.client_notes = null;
  }

  return redacted;
}

/**
 * Filters node array to those visible to the audience and redacts each.
 */
export function filterNodes(
  nodes: WorkflowCanvasNode[],
  audience: CanvasAudience,
): WorkflowCanvasNode[] {
  return nodes
    .filter((n) => nodeVisibleTo(n, audience))
    .map((n) => redactNode(n, audience));
}

/**
 * Filters edges to those visible to the audience AND whose endpoints
 * remain visible after node filtering.
 */
export function filterEdges(
  edges: WorkflowCanvasEdge[],
  visibleNodeKeys: Set<string>,
  audience: CanvasAudience,
): WorkflowCanvasEdge[] {
  return edges.filter(
    (e) =>
      edgeVisibleTo(e, audience) &&
      visibleNodeKeys.has(e.source_node_key) &&
      visibleNodeKeys.has(e.target_node_key),
  );
}

/**
 * Apply all visibility filtering to a canvas bundle. The returned bundle
 * is what gets sent to the client/server-component.
 */
export function filterCanvasForAudience(
  bundle: WorkflowCanvasBundle,
  audience: CanvasAudience,
): WorkflowCanvasBundle {
  const nodes = filterNodes(bundle.nodes, audience);
  const visibleKeys = new Set(nodes.map((n) => n.node_key));
  const edges = filterEdges(bundle.edges, visibleKeys, audience);
  return { canvas: bundle.canvas, nodes, edges };
}

/**
 * Whether the canvas itself should be readable by the given audience.
 * RLS enforces this server-side; this is a client-side guard for UI
 * gating and a defense-in-depth for direct access by ID.
 */
export function canvasVisibleTo(
  canvas: Pick<WorkflowCanvas, "visibility" | "status">,
  audience: CanvasAudience,
): boolean {
  if (audience === "admin") return true;

  if (audience === "client") {
    return (
      VISIBLE_TO_CLIENT.includes(canvas.visibility) &&
      ["client_ready", "shared_with_client", "approved"].includes(canvas.status)
    );
  }

  // partner
  return (
    VISIBLE_TO_PARTNER.includes(canvas.visibility) &&
    ["shared_with_client", "approved"].includes(canvas.status)
  );
}
