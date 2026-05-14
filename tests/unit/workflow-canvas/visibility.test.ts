import { describe, expect, it } from "vitest";

import {
  canvasVisibleTo,
  commentVisibleTo,
  edgeVisibleTo,
  filterCanvasForAudience,
  filterEdges,
  filterNodes,
  nodeVisibleTo,
  redactNode,
} from "@/lib/workflow-canvas/visibility";
import type {
  CanvasAudience,
  CanvasVisibility,
  WorkflowCanvasBundle,
  WorkflowCanvasNode,
} from "@/lib/workflow-canvas/types";

const AUDIENCES: CanvasAudience[] = ["admin", "client", "partner"];
const VISIBILITIES: CanvasVisibility[] = [
  "internal_only",
  "partner_visible",
  "client_visible",
  "shared_all",
];

function makeNode(
  visibility: CanvasVisibility,
  overrides: Partial<WorkflowCanvasNode> = {},
): WorkflowCanvasNode {
  return {
    id: `node-${visibility}`,
    canvas_id: "canvas-1",
    node_key: `key-${visibility}`,
    node_type: "process",
    phase: "current_manual",
    department: null,
    visibility,
    title: "Test node",
    short_label: null,
    description: null,
    actors: [],
    current_process: null,
    proposed_process: null,
    ai_opportunity: null,
    pain_points: [],
    erp_modules: [],
    documents: [],
    data_captured: [],
    risk_level: null,
    automation_potential: null,
    internal_notes: "INTERNAL ONLY",
    client_notes: "CLIENT NOTE",
    position_x: 0,
    position_y: 0,
    metadata: {},
    ...overrides,
  };
}

describe("nodeVisibleTo", () => {
  it("admin sees every node visibility", () => {
    for (const v of VISIBILITIES) {
      expect(nodeVisibleTo({ visibility: v }, "admin")).toBe(true);
    }
  });

  it("client only sees client_visible and shared_all", () => {
    expect(nodeVisibleTo({ visibility: "internal_only" }, "client")).toBe(false);
    expect(nodeVisibleTo({ visibility: "partner_visible" }, "client")).toBe(false);
    expect(nodeVisibleTo({ visibility: "client_visible" }, "client")).toBe(true);
    expect(nodeVisibleTo({ visibility: "shared_all" }, "client")).toBe(true);
  });

  it("partner only sees partner_visible and shared_all", () => {
    expect(nodeVisibleTo({ visibility: "internal_only" }, "partner")).toBe(false);
    expect(nodeVisibleTo({ visibility: "client_visible" }, "partner")).toBe(false);
    expect(nodeVisibleTo({ visibility: "partner_visible" }, "partner")).toBe(true);
    expect(nodeVisibleTo({ visibility: "shared_all" }, "partner")).toBe(true);
  });
});

describe("edgeVisibleTo + commentVisibleTo follow same rules", () => {
  for (const audience of AUDIENCES) {
    for (const v of VISIBILITIES) {
      it(`audience=${audience} v=${v} consistent across node/edge/comment`, () => {
        const n = nodeVisibleTo({ visibility: v }, audience);
        const e = edgeVisibleTo({ visibility: v }, audience);
        const c = commentVisibleTo({ visibility: v }, audience);
        expect(e).toBe(n);
        expect(c).toBe(n);
      });
    }
  }
});

describe("redactNode", () => {
  it("admin keeps all notes", () => {
    const n = makeNode("shared_all");
    const r = redactNode(n, "admin");
    expect(r.internal_notes).toBe("INTERNAL ONLY");
    expect(r.client_notes).toBe("CLIENT NOTE");
  });

  it("client loses internal_notes but keeps client_notes", () => {
    const n = makeNode("shared_all");
    const r = redactNode(n, "client");
    expect(r.internal_notes).toBeNull();
    expect(r.client_notes).toBe("CLIENT NOTE");
  });

  it("partner loses internal_notes AND client_notes", () => {
    const n = makeNode("shared_all");
    const r = redactNode(n, "partner");
    expect(r.internal_notes).toBeNull();
    expect(r.client_notes).toBeNull();
  });
});

describe("filterNodes / filterEdges", () => {
  it("strips internal_only nodes and dependent edges for client", () => {
    const nodes = [
      makeNode("internal_only", { node_key: "a" }),
      makeNode("client_visible", { node_key: "b" }),
      makeNode("client_visible", { node_key: "c" }),
    ];
    const edges = [
      {
        id: "e1",
        canvas_id: "canvas-1",
        edge_key: "e1",
        source_node_key: "a",
        target_node_key: "b",
        edge_type: "normal" as const,
        phase: "current_manual" as const,
        visibility: "shared_all" as const,
        label: null,
        condition: null,
        metadata: {},
      },
      {
        id: "e2",
        canvas_id: "canvas-1",
        edge_key: "e2",
        source_node_key: "b",
        target_node_key: "c",
        edge_type: "normal" as const,
        phase: "current_manual" as const,
        visibility: "shared_all" as const,
        label: null,
        condition: null,
        metadata: {},
      },
    ];

    const filteredNodes = filterNodes(nodes, "client");
    expect(filteredNodes.map((n) => n.node_key)).toEqual(["b", "c"]);

    const visibleKeys = new Set(filteredNodes.map((n) => n.node_key));
    const filteredEdges = filterEdges(edges, visibleKeys, "client");
    expect(filteredEdges.map((e) => e.edge_key)).toEqual(["e2"]);
  });
});

describe("filterCanvasForAudience integration", () => {
  it("partner can never see internal_notes or client_notes", () => {
    const bundle: WorkflowCanvasBundle = {
      canvas: {
        id: "c1",
        organization_id: "o1",
        project_id: "p1",
        blueprint_id: null,
        template_slug: null,
        title: "x",
        subtitle: null,
        description: null,
        canvas_type: "combined",
        status: "shared_with_client",
        visibility: "shared_all",
        viewport: { x: 0, y: 0, zoom: 1 },
        version: 1,
        badges: [],
        created_by_id: null,
        updated_by_id: null,
        shared_with_client_at: null,
        shared_with_partner_at: null,
        created_at: "",
        updated_at: "",
        metadata: {},
      },
      nodes: [makeNode("shared_all"), makeNode("internal_only", { node_key: "internal" })],
      edges: [],
    };
    const result = filterCanvasForAudience(bundle, "partner");
    expect(result.nodes.length).toBe(1);
    expect(result.nodes[0].internal_notes).toBeNull();
    expect(result.nodes[0].client_notes).toBeNull();
  });
});

describe("canvasVisibleTo", () => {
  it("client requires status to be at least client_ready", () => {
    expect(
      canvasVisibleTo({ visibility: "client_visible", status: "draft" }, "client"),
    ).toBe(false);
    expect(
      canvasVisibleTo({ visibility: "client_visible", status: "client_ready" }, "client"),
    ).toBe(true);
  });

  it("partner requires status to be at least shared_with_client", () => {
    expect(
      canvasVisibleTo({ visibility: "partner_visible", status: "client_ready" }, "partner"),
    ).toBe(false);
    expect(
      canvasVisibleTo({ visibility: "partner_visible", status: "shared_with_client" }, "partner"),
    ).toBe(true);
  });
});
