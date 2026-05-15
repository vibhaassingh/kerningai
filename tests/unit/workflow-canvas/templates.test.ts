import { describe, expect, it } from "vitest";

import {
  AI_NODES,
  CURRENT_NODES,
  ERP_NODES,
  SAURABH_NODES,
  SAURABH_TEMPLATE,
} from "@/lib/workflow-canvas/seed/saurabh-arora";
import { getTemplate, listTemplates } from "@/lib/workflow-canvas/templates";

describe("Saurabh seed shape", () => {
  it("has the spec'd node counts per phase", () => {
    expect(CURRENT_NODES.length).toBe(25);
    expect(ERP_NODES.length).toBe(17);
    expect(AI_NODES.length).toBe(8);
    expect(SAURABH_NODES.length).toBe(50);
  });

  it("uses unique node_keys", () => {
    const keys = SAURABH_NODES.map((n) => n.node_key);
    expect(new Set(keys).size).toBe(keys.length);
  });

  it("does not contain the term Sauda anywhere user-facing", () => {
    const json = JSON.stringify(SAURABH_TEMPLATE);
    expect(/sauda/i.test(json)).toBe(false);
  });
});

describe("template registry", () => {
  it("lists at least the refined-oil template", () => {
    const all = listTemplates();
    expect(all.length).toBeGreaterThanOrEqual(5);
    expect(all.some((t) => t.slug === "refined_oil_cf")).toBe(true);
  });

  it("returns the Saurabh template by slug", () => {
    const t = getTemplate("refined_oil_cf");
    expect(t).not.toBeNull();
    expect(t?.title).toContain("Saurabh Arora");
    expect(t?.subtitle).toContain("Refined Oil");
  });

  it("returns null for unknown slugs", () => {
    expect(getTemplate("nope")).toBeNull();
  });
});
