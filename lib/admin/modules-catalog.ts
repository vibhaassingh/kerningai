/**
 * Canonical client module catalogue. Plain data (no "use server" /
 * "server-only") so the editor (client), the action (server) and the
 * read views all agree on the same slug set.
 *
 * Slugs must match what `client_settings.modules_enabled` stores and what
 * the portal shells gate on.
 */
export interface ClientModuleDef {
  slug: string;
  label: string;
  description: string;
}

export const CLIENT_MODULES: ClientModuleDef[] = [
  {
    slug: "operational_ontology",
    label: "Operational Ontology",
    description:
      "Object graph of equipment, sensors, recipes, regulations.",
  },
  {
    slug: "agentic_workflows",
    label: "Agentic Workflows",
    description:
      "Human-approved AI agents with action ledger + rollback.",
  },
  {
    slug: "predictive_maintenance",
    label: "Predictive Maintenance",
    description:
      "Health scoring, failure forecasts, work-order workflow.",
  },
  {
    slug: "energy",
    label: "Energy",
    description: "Utility metering, tariff windows, emissions ledger.",
  },
  {
    slug: "compliance",
    label: "Compliance",
    description:
      "FSMS/ISO audits, cold-chain logs, corrective actions.",
  },
  {
    slug: "decision_intelligence",
    label: "Decision Intelligence",
    description:
      "P&L by plate/SKU/shift/site, OEE, scenarios, forecasting.",
  },
];

export const MODULE_SLUGS: string[] = CLIENT_MODULES.map((m) => m.slug);
