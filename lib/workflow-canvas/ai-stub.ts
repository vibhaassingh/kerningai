"use server";

import { z } from "zod";

import type { ActionResult } from "@/lib/auth/actions";
import { requirePermission } from "@/lib/auth/require";
import { getTemplate } from "@/lib/workflow-canvas/templates";
import type { CanvasTemplateSeed } from "@/lib/workflow-canvas/types";

/**
 * generateWorkflowCanvasFromDocument — Server Action stub.
 *
 * Phase A:
 *   * If `documentIds` matches the Saurabh reference set, returns the
 *     refined-oil template (deterministic).
 *   * Otherwise returns ok:false with the canonical "not wired" message.
 *
 * Phase B+:
 *   * Wires to the real Kerning Ai workflow analysis service when
 *     environment is configured.
 */

const inputSchema = z.object({
  organizationId: z.string().uuid(),
  projectId: z.string().uuid(),
  documentIds: z.array(z.string()).optional(),
  rawWorkflowText: z.string().optional(),
  mode: z.enum(["current_manual", "proposed_erp", "erp_ai", "combined"]),
});

// Reference documents that — if uploaded — produce the Saurabh template.
// This is intentionally a tiny well-known list so the stub is testable.
const SAURABH_REFERENCE_DOC_IDS = new Set<string>([
  "saurabh-arora-workflow-spec",
  "refined-oil-cf-discovery-notes",
]);

export async function generateWorkflowCanvasFromDocument(
  input: z.infer<typeof inputSchema>,
): Promise<ActionResult<{ template: CanvasTemplateSeed }>> {
  const parsed = inputSchema.safeParse(input);
  if (!parsed.success) {
    return { ok: false, error: parsed.error.issues[0].message };
  }

  try {
    await requirePermission("manage_workflow_canvas", parsed.data.organizationId);
  } catch {
    return { ok: false, error: "Not permitted." };
  }

  // Deterministic Saurabh path.
  const docs = parsed.data.documentIds ?? [];
  if (docs.some((id) => SAURABH_REFERENCE_DOC_IDS.has(id))) {
    const template = getTemplate("refined_oil_cf");
    if (template) {
      return { ok: true, data: { template } };
    }
  }

  return {
    ok: false,
    error:
      "AI workflow generation will be connected to the Kerning Ai workflow analysis service.",
  };
}
