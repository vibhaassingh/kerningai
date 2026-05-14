import { SAURABH_TEMPLATE } from "@/lib/workflow-canvas/seed/saurabh-arora";
import type { CanvasTemplateSeed } from "@/lib/workflow-canvas/types";

/**
 * Canonical templates for the "Create from Template" admin action.
 *
 * Phase A ships the Refined Oil C&F template (the Saurabh canvas) as the
 * only fully-populated template. The other slugs are placeholders that
 * return an empty canvas of the right type — Phase B fills them.
 */

const EMPTY = (
  slug: string,
  title: string,
  subtitle: string,
): CanvasTemplateSeed => ({
  slug,
  title,
  subtitle,
  canvas_type: "combined",
  badges: ["Template"],
  nodes: [],
  edges: [],
});

const TEMPLATES: Record<string, CanvasTemplateSeed> = {
  refined_oil_cf: SAURABH_TEMPLATE,
  generic_erp_discovery: EMPTY(
    "generic_erp_discovery",
    "Generic ERP Discovery Workflow",
    "Empty canvas — populate during discovery",
  ),
  sales_dispatch: EMPTY(
    "sales_dispatch",
    "Sales + Dispatch Workflow",
    "Empty canvas — populate during discovery",
  ),
  purchase_inventory: EMPTY(
    "purchase_inventory",
    "Purchase + Inventory Workflow",
    "Empty canvas — populate during discovery",
  ),
  ai_automation_mapping: EMPTY(
    "ai_automation_mapping",
    "AI Automation Mapping Workflow",
    "Empty canvas — populate during discovery",
  ),
};

export function listTemplates(): CanvasTemplateSeed[] {
  return Object.values(TEMPLATES);
}

export function getTemplate(slug: string): CanvasTemplateSeed | null {
  return TEMPLATES[slug] ?? null;
}
