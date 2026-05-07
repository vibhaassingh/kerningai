export type Service = {
  slug: string;
  number: string;
  title: string;
  tagline: string;
  summary: string;
  outcomes: string[];
  capabilities: string[];
};

export const SERVICES: Service[] = [
  {
    slug: "operational-ontology",
    number: "01",
    title: "Operational Ontology",
    tagline: "One model of the operation.",
    summary:
      "A living object graph fused from sensors, machine telemetry, ERP, BMS, POS, HR and the operator's own voice. Not a dashboard — the model the whole company can reason on.",
    outcomes: [
      "Single source of truth across sites and systems",
      "Vendor-, language- and silo-agnostic by design",
      "Governed lineage from sensor to signal to decision",
    ],
    capabilities: [
      "Schema-first ingestion across IoT, ERP, BMS, POS, HR",
      "Semantic enrichment and entity resolution",
      "Event stream and time-series fusion",
      "Lineage, observability, and policy enforcement",
    ],
  },
  {
    slug: "agentic-workflows",
    number: "02",
    title: "Agentic Workflows",
    tagline: "Reasoning, not reporting.",
    summary:
      "Reasoning agents that act on the ontology — flag a failing combi oven before service, re-route a chiller load when grid tariffs spike, draft an FSMS variance back to the QA lead. Humans approve; the agent does the boring work.",
    outcomes: [
      "Decisions executed in seconds, not shifts",
      "Audit-trailed action with named approvers",
      "Operators reclaim hours from clipboard work",
    ],
    capabilities: [
      "Goal-driven agents with tool-use guardrails",
      "Human-in-the-loop approval surfaces",
      "Retrieval-augmented domain reasoning",
      "Action ledger with rollback and replay",
    ],
  },
  {
    slug: "predictive-maintenance",
    number: "03",
    title: "Predictive Maintenance",
    tagline: "Failures called weeks before service stops.",
    summary:
      "Industrial-grade telemetry on assets running sixteen-hour shifts — bearings, compressors, hoods, robotic cells. Failure modes called weeks before service stops, not after.",
    outcomes: [
      "Up to 38% fewer unplanned outages",
      "25% reduction in emergency maintenance spend",
      "Equipment lifecycle extended 1.7×",
    ],
    capabilities: [
      "Multi-sensor anomaly detection",
      "Equipment health scoring and degradation models",
      "Maintenance scheduling automation",
      "Spare-parts inventory forecasting",
    ],
  },
  {
    slug: "energy-utility-emissions",
    number: "04",
    title: "Energy, Utility & Emissions",
    tagline: "Lower bills, lower carbon, audited.",
    summary:
      "Real-time tracking of power, gas, water, refrigerant — with automated tariff optimisation, scope-2 carbon ledgering, and bill-reduction targets the CFO can audit.",
    outcomes: [
      "12–22% reduction in utility bills",
      "Continuous scope-2 carbon ledger",
      "Automated demand-response participation",
    ],
    capabilities: [
      "Sub-metered consumption analytics",
      "HVAC and refrigeration optimisation",
      "ESG-grade reporting",
      "Anomaly alerts on consumption spikes",
    ],
  },
  {
    slug: "hygiene-safety-compliance",
    number: "05",
    title: "Hygiene, Safety & Compliance",
    tagline: "The clipboard, retired.",
    summary:
      "Digital audits, temperature logs, FSMS / ISO / GMP workflows — replacing the clipboard with a tablet that knows what to ask, when to escalate, and how to close the loop.",
    outcomes: [
      "100% temperature-log coverage",
      "Audit-ready evidence on demand",
      "Real-time corrective action prompts",
    ],
    capabilities: [
      "AI-vision protocol monitoring",
      "Cold-chain integrity tracking",
      "Automated incident logging and escalation",
      "Regulatory report generation",
    ],
  },
  {
    slug: "decision-intelligence",
    number: "06",
    title: "Decision Intelligence",
    tagline: "Decisions, not reports.",
    summary:
      "Plate-level P&L, line-level efficiency, brigade-level performance — modelled on the ontology, served as decisions rather than reports. The CFO and the line lead read the same number.",
    outcomes: [
      "P&L visibility down to plate / SKU / shift",
      "Same metric for executive and operator",
      "Predictive churn, upsell and demand scoring",
    ],
    capabilities: [
      "Unified metric layer across functions",
      "Scenario simulation and what-if modelling",
      "Operator-grade decision surfaces",
      "Sentiment, demand and forecast analytics",
    ],
  },
];
