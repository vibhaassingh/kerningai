import type { SVGProps } from "react";
import { OntologyGlyph } from "./glyphs/Ontology";
import { AgenticWorkflowsGlyph } from "./glyphs/AgenticWorkflows";
import { PredictiveMaintenanceGlyph } from "./glyphs/PredictiveMaintenance";
import { EnergyGlyph } from "./glyphs/Energy";
import { ComplianceGlyph } from "./glyphs/Compliance";
import { DecisionIntelligenceGlyph } from "./glyphs/DecisionIntelligence";

/**
 * Glyph registry. Add new icons by creating a glyph file under
 * `components/icons/glyphs/` and registering it here.
 */
const GLYPHS = {
  ontology: OntologyGlyph,
  "agentic-workflows": AgenticWorkflowsGlyph,
  "predictive-maintenance": PredictiveMaintenanceGlyph,
  energy: EnergyGlyph,
  compliance: ComplianceGlyph,
  "decision-intelligence": DecisionIntelligenceGlyph,
} as const;

export type IconName = keyof typeof GLYPHS;

type Props = Omit<SVGProps<SVGSVGElement>, "stroke" | "fill"> & {
  name: IconName;
  /** Pixel size of the rendered SVG (square). Default 24. */
  size?: number;
  /** Stroke width override. Default 1.5. */
  strokeWidth?: number;
  /** Accessible label. Renders as <title>. Omit for purely decorative. */
  label?: string;
};

/**
 * KerningIcon — single entry point for the schematic icon system.
 * Renders the named glyph inside a 24-unit viewBox with `currentColor`
 * stroking so it adapts to the surrounding ink. Unstyled by default —
 * the parent's text colour drives it.
 */
export function KerningIcon({
  name,
  size = 24,
  strokeWidth = 1.5,
  label,
  className,
  ...rest
}: Props) {
  const Glyph = GLYPHS[name];
  if (!Glyph) {
    if (process.env.NODE_ENV !== "production") {
      console.warn(`[KerningIcon] unknown icon "${name}"`);
    }
    return null;
  }

  return (
    <svg
      viewBox="0 0 24 24"
      width={size}
      height={size}
      strokeWidth={strokeWidth}
      role={label ? "img" : "presentation"}
      aria-hidden={label ? undefined : true}
      aria-label={label}
      className={className}
      style={{ display: "inline-block", verticalAlign: "middle" }}
      {...rest}
    >
      {label && <title>{label}</title>}
      <Glyph />
    </svg>
  );
}

/**
 * Compile-time list of registered icon names.
 */
export const ICON_NAMES = Object.keys(GLYPHS) as IconName[];

/**
 * Map service slugs (from `content/services.ts`) to their schematic
 * icon. Centralised so the wiring lives in one place — anything that
 * shows a service can drop in the right glyph by slug.
 */
export const SERVICE_ICON_BY_SLUG: Record<string, IconName> = {
  "operational-ontology": "ontology",
  "agentic-workflows": "agentic-workflows",
  "predictive-maintenance": "predictive-maintenance",
  "energy-utility-emissions": "energy",
  "hygiene-safety-compliance": "compliance",
  "decision-intelligence": "decision-intelligence",
};
