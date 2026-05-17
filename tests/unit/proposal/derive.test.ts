import { describe, expect, it } from "vitest";

import { deriveProposalFromCanvas } from "@/lib/proposal/derive";
import { SAURABH_NODES } from "@/lib/workflow-canvas/seed/saurabh-arora";
import type {
  CanvasNodeSeed,
  WorkflowCanvasNode,
} from "@/lib/workflow-canvas/types";

// The seed exports IDs-not-yet-assigned shapes; widen them to the full
// node type the deriver consumes, defaulting the array fields it reads.
function toNode(s: CanvasNodeSeed): WorkflowCanvasNode {
  return {
    id: s.node_key,
    canvas_id: "test",
    node_key: s.node_key,
    node_type: s.node_type,
    phase: s.phase,
    department: s.department ?? null,
    visibility: s.visibility ?? "shared_all",
    title: s.title,
    short_label: s.short_label ?? null,
    description: s.description ?? null,
    actors: s.actors ?? [],
    current_process: s.current_process ?? null,
    proposed_process: s.proposed_process ?? null,
    ai_opportunity: s.ai_opportunity ?? null,
    pain_points: s.pain_points ?? [],
    erp_modules: s.erp_modules ?? [],
    documents: s.documents ?? [],
    data_captured: s.data_captured ?? [],
    risk_level: s.risk_level ?? null,
    automation_potential: s.automation_potential ?? null,
    internal_notes: s.internal_notes ?? null,
    client_notes: s.client_notes ?? null,
    position_x: s.position_x,
    position_y: s.position_y,
    metadata: {},
  };
}

const draft = deriveProposalFromCanvas({
  nodes: SAURABH_NODES.map(toNode),
  projectName: "Saurabh Arora — ERP + AI Workflow Blueprint",
  industry: "refined_oil_distribution",
});

describe("deriveProposalFromCanvas — Saurabh Arora canonical seed", () => {
  it("produces the recommended four-phase engagement", () => {
    expect(draft.phases).toHaveLength(4);
    expect(draft.phases[0].name).toMatch(/^Phase 0/);
    const names = draft.phases.map((p) => p.name).join(" | ");
    expect(names).toContain("Phase 1 — ERP Foundation");
    expect(names).toContain("Phase 2 — Operational Loop");
    expect(names).toContain("Phase 3 — AI Overlay");
    for (const p of draft.phases) {
      expect(p.duration_weeks).toBeGreaterThan(0);
    }
  });

  it("derives modules from the canvas erp_modules, including Purchase Management", () => {
    expect(draft.modules.length).toBeGreaterThan(0);
    expect(draft.modules.some((m) => m.name === "Purchase Management")).toBe(
      true,
    );
    // Highest-frequency / high-automation modules are core.
    expect(draft.modules.some((m) => m.emphasis === "core")).toBe(true);
  });

  it("captures the structural risks the canvas implies", () => {
    expect(
      draft.risks.some(
        (r) => r.category === "Sequencing" && r.severity === "high",
      ),
    ).toBe(true);
    // The seed transacts over WhatsApp, so change-management risk fires.
    expect(
      draft.risks.some(
        (r) => r.category === "Change management" && r.severity === "high",
      ),
    ).toBe(true);
  });

  it("emits every scope-boundary kind", () => {
    const kinds = new Set(draft.scopeItems.map((s) => s.kind));
    expect(kinds.has("in_scope")).toBe(true);
    expect(kinds.has("out_of_scope")).toBe(true);
    expect(kinds.has("assumption")).toBe(true);
    expect(kinds.has("dependency")).toBe(true);
  });

  it("builds a commercial schedule: one line per delivery phase + migration + subscription", () => {
    // Phases 1-3 are priced (Phase 0 is not) → 3 + data migration + subscription.
    expect(draft.commercials).toHaveLength(5);
    expect(draft.commercials.some((c) => c.label === "Data migration")).toBe(
      true,
    );
    expect(draft.commercials.some((c) => c.basis === "subscription")).toBe(
      true,
    );
    // Nothing is priced until the team fills it in.
    expect(draft.commercials.every((c) => c.amount === 0)).toBe(true);
  });

  it("writes a non-empty narrative tied to the project", () => {
    expect(draft.title).toContain("Saurabh Arora");
    expect(draft.summary.length).toBeGreaterThan(40);
    expect(draft.executiveBrief).toContain("not parallel scope");
  });
});
