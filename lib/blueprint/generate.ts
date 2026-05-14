import "server-only";

import { scoreComplexity, type ComplexityResult } from "@/lib/blueprint/scoring";

export type BlueprintEmphasis = "core" | "recommended" | "optional";

export interface BlueprintRecord {
  summary: string;
  executiveBrief: string;
  score: ComplexityResult;
  modules: { slug: string; name: string; emphasis: BlueprintEmphasis; rationale: string }[];
  integrations: {
    system: string;
    direction: "read" | "write" | "bidirectional";
    frequency: "realtime" | "minutes" | "hourly" | "daily" | "weekly" | "manual";
    risk: "low" | "medium" | "high";
    notes: string | null;
  }[];
  risks: {
    category: string;
    description: string;
    severity: "low" | "medium" | "high" | "critical";
    mitigation: string;
  }[];
  phases: {
    name: string;
    description: string;
    duration_weeks: number;
    owners: string[];
    deliverables: string[];
  }[];
  checklist: { category: string; description: string; owner: "kerning" | "client" | "joint" }[];
}

interface GenerateInput {
  templateSlug: string;
  templateName: string;
  service: string;
  industry: string | null;
  answers: Record<string, unknown>;
}

const MODULE_LIBRARY: Record<
  string,
  { name: string; rationale: (i: GenerateInput) => string }
> = {
  operational_ontology: {
    name: "Operational Ontology",
    rationale: (i) =>
      `Anchors equipment, sensors, people, and workflows into a single graph for ${
        i.industry ?? "your operation"
      } — every other module reads from this layer.`,
  },
  agentic_workflows: {
    name: "Agentic Workflows",
    rationale: () =>
      "Human-approved agents with action ledger + rollback — required for the custom AI agent you're scoping.",
  },
  predictive_maintenance: {
    name: "Predictive Maintenance",
    rationale: () =>
      "Asset health scoring, anomaly detection, work-order workflow — the fastest ROI module for asset-heavy operations.",
  },
  energy: {
    name: "Energy & Emissions",
    rationale: () =>
      "Sub-metering, tariff optimization, emissions ledger — pays for itself when peak-shave alone exceeds the licence fee.",
  },
  compliance: {
    name: "Hygiene, Safety & Compliance",
    rationale: () =>
      "Digital audit checklists, cold-chain integrity, corrective actions — replaces the spreadsheet stack.",
  },
  decision_intelligence: {
    name: "Decision Intelligence",
    rationale: () =>
      "Plate/SKU/shift P&L, OEE, scenario modelling — the executive read on the same data the floor sees.",
  },
};

export function generateBlueprint(input: GenerateInput): BlueprintRecord {
  const score = scoreComplexity(input.answers);
  const modules = pickModules(input);
  const integrations = pickIntegrations(input);
  const risks = pickRisks(input, score);
  const phases = pickPhases(input, score);
  const checklist = pickChecklist(input);

  const summary = buildSummary(input, score, modules);
  const executiveBrief = buildExecutiveBrief(input, score, modules, phases);

  return {
    summary,
    executiveBrief,
    score,
    modules,
    integrations,
    risks,
    phases,
    checklist,
  };
}

// ---------------------------------------------------------------------------
function pickModules(input: GenerateInput): BlueprintRecord["modules"] {
  const out: BlueprintRecord["modules"] = [];
  const enabled = new Set<string>();

  const purpose = arrayOr<string>(input.answers["job.purpose"]);
  const signals = arrayOr<string>(input.answers["dec.signals"]);

  function add(slug: string, emphasis: BlueprintEmphasis) {
    if (enabled.has(slug)) return;
    const def = MODULE_LIBRARY[slug];
    if (!def) return;
    out.push({ slug, name: def.name, emphasis, rationale: def.rationale(input) });
    enabled.add(slug);
  }

  // Service-driven defaults.
  if (input.service === "custom_ai_agent") {
    add("agentic_workflows", "core");
    add("operational_ontology", "core");
  }
  if (input.service === "operational_intelligence") {
    add("operational_ontology", "core");
    add("decision_intelligence", "core");
  }

  // Job-driven enrichment.
  if (
    purpose.includes("monitoring") ||
    purpose.includes("anomaly_explain") ||
    signals.includes("maintenance")
  ) {
    add("predictive_maintenance", "recommended");
  }
  if (signals.includes("energy")) add("energy", "recommended");
  if (signals.includes("compliance")) add("compliance", "recommended");
  if (signals.includes("pnl") || signals.includes("throughput")) {
    add("decision_intelligence", "recommended");
  }

  // Industry-driven nudges.
  if (input.industry === "hospitality" || input.industry === "institutional") {
    add("compliance", "optional");
  }
  if (input.industry === "manufacturing") {
    add("predictive_maintenance", "optional");
  }

  return out;
}

function pickIntegrations(input: GenerateInput): BlueprintRecord["integrations"] {
  const sources = arrayOr<string>(input.answers["data.sources"]);
  const labels: Record<string, { system: string; risk: "low" | "medium" | "high" }> = {
    erp: { system: "ERP", risk: "medium" },
    crm: { system: "CRM", risk: "low" },
    pos: { system: "POS", risk: "medium" },
    bms: { system: "BMS / HVAC", risk: "medium" },
    iot: { system: "IoT sensors", risk: "medium" },
    csv: { system: "CSV / Sheets imports", risk: "low" },
    email: { system: "Email inbox", risk: "low" },
    calendar: { system: "Calendar", risk: "low" },
    object_storage: { system: "Object storage", risk: "low" },
    other: { system: "Other / bespoke", risk: "medium" },
  };

  return sources.map((s) => {
    const meta = labels[s] ?? { system: s, risk: "medium" as const };
    return {
      system: meta.system,
      direction:
        s === "iot" || s === "bms"
          ? "read"
          : s === "calendar"
            ? "bidirectional"
            : ("read" as "read" | "write" | "bidirectional"),
      frequency:
        s === "iot" || s === "bms"
          ? "realtime"
          : s === "pos"
            ? "minutes"
            : ("daily" as "realtime" | "minutes" | "hourly" | "daily" | "weekly" | "manual"),
      risk: meta.risk,
      notes:
        s === "iot"
          ? "Sensor topology + protocol mix (Modbus, BACnet, MQTT) needs a site survey."
          : null,
    };
  });
}

function pickRisks(
  input: GenerateInput,
  score: ComplexityResult,
): BlueprintRecord["risks"] {
  const risks: BlueprintRecord["risks"] = [];

  const sensitivity = input.answers["security.sensitivity"] as string | undefined;
  if (sensitivity === "regulated" || sensitivity === "confidential") {
    risks.push({
      category: "Compliance",
      description: `Data sensitivity is "${sensitivity}" — Kerning's contract + audit obligations expand.`,
      severity: sensitivity === "regulated" ? "high" : "medium",
      mitigation:
        "Stand up the action ledger + immutable audit trail in Phase 1; route legal review in parallel.",
    });
  }

  const deployment = input.answers["deployment.preference"] ?? input.answers["dep.preference"];
  if (deployment === "on_prem" || deployment === "air_gapped") {
    risks.push({
      category: "Deployment",
      description: `${deployment === "air_gapped" ? "Air-gapped" : "On-prem"} deployment slows iteration loops.`,
      severity: deployment === "air_gapped" ? "high" : "medium",
      mitigation:
        "Set up an identical sovereign-cloud staging mirror so Kerning can iterate without site visits.",
    });
  }

  const purpose = arrayOr<string>(input.answers["job.purpose"]);
  if (purpose.includes("approvals") && (input.answers["guardrails.risk"] as string) !== "low") {
    risks.push({
      category: "Governance",
      description: "Agent will act on consequential decisions; risk tolerance is not strict.",
      severity: "medium",
      mitigation:
        "Define explicit named approvers per decision class; enforce in HumanApprovalPolicy.",
    });
  }

  const integrationsCount = arrayOr<string>(input.answers["data.sources"]).length;
  if (integrationsCount >= 5) {
    risks.push({
      category: "Integration",
      description: `${integrationsCount} concurrent integrations — schema drift + auth-token rotation become real ops costs.`,
      severity: "medium",
      mitigation:
        "Land each connector behind a feature flag; schedule a weekly sync-log review until launch +30 days.",
    });
  }

  if (score.band === "very_high") {
    risks.push({
      category: "Schedule",
      description: "Complexity score is very high. Original timeline is likely optimistic.",
      severity: "high",
      mitigation:
        "Negotiate a phased launch: ship one core module live before integrations land at full scope.",
    });
  }

  if (risks.length === 0) {
    risks.push({
      category: "General",
      description: "No specific risk flags from your answers — straightforward rollout.",
      severity: "low",
      mitigation:
        "Proceed with the standard four-phase plan and a weekly check-in until launch.",
    });
  }
  return risks;
}

function pickPhases(
  input: GenerateInput,
  score: ComplexityResult,
): BlueprintRecord["phases"] {
  const integrations = arrayOr<string>(input.answers["data.sources"]).length;
  const longer = score.band === "high" || score.band === "very_high";

  return [
    {
      name: "01 / Discovery & architecture",
      description:
        "Confirm the data model, sites, and integration list. Lock the action policy.",
      duration_weeks: longer ? 3 : 2,
      owners: ["Kerning Deployment Manager", "Client IT admin"],
      deliverables: ["Ontology draft", "Integration map", "RBAC matrix"],
    },
    {
      name: "02 / Data plane",
      description: integrations > 0
        ? "Stand up read connectors first; defer writes until governance signs off."
        : "Bootstrap the ontology from CSV / Sheets uploads.",
      duration_weeks: longer ? 6 : 4,
      owners: ["Kerning Data Engineer"],
      deliverables: ["Sync logs green", "Lineage records populated"],
    },
    {
      name: "03 / Build",
      description: "Module configuration, dashboards, and agent templates.",
      duration_weeks: longer ? 5 : 3,
      owners: ["Kerning Engineering", "Kerning AI/ML"],
      deliverables: ["Agent runs producing recommendations in dev"],
    },
    {
      name: "04 / Training & sign-off",
      description: "Brigade / operator training, dry runs, sign-off.",
      duration_weeks: 2,
      owners: ["Kerning Client Success", "Client site managers"],
      deliverables: ["Operator certification", "Acceptance criteria green"],
    },
    {
      name: "05 / Go-live + watch",
      description: "Production cutover with 30-day intensive support window.",
      duration_weeks: 2,
      owners: ["Kerning Operations", "Client owner"],
      deliverables: ["Go-live runbook", "30-day stability report"],
    },
  ];
}

function pickChecklist(input: GenerateInput): BlueprintRecord["checklist"] {
  const out: BlueprintRecord["checklist"] = [];
  const sources = arrayOr<string>(input.answers["data.sources"]);

  out.push({
    category: "Discovery",
    description: "Confirm legal entity name, billing address, and primary technical contact.",
    owner: "client",
  });
  out.push({
    category: "Discovery",
    description: "Send a current site list with addresses + primary contact per site.",
    owner: "client",
  });
  out.push({
    category: "Identity",
    description: "Identify named approvers per agent decision class.",
    owner: "client",
  });

  if (sources.includes("erp")) {
    out.push({
      category: "Integration",
      description: "Provide ERP API credentials in Kerning's credential vault (read-only first).",
      owner: "client",
    });
  }
  if (sources.includes("iot")) {
    out.push({
      category: "Integration",
      description: "Run an on-site survey to inventory sensor protocols and gateway placement.",
      owner: "joint",
    });
  }

  out.push({
    category: "Compliance",
    description: "Sign DPA + master subscription agreement.",
    owner: "joint",
  });
  out.push({
    category: "Kerning",
    description: "Provision dedicated Supabase staging + Vercel preview project.",
    owner: "kerning",
  });
  out.push({
    category: "Kerning",
    description: "Configure RBAC matrix for client team during invite flow.",
    owner: "kerning",
  });
  return out;
}

function buildSummary(
  input: GenerateInput,
  score: ComplexityResult,
  modules: BlueprintRecord["modules"],
): string {
  const moduleNames = modules.filter((m) => m.emphasis !== "optional").map((m) => m.name);
  return [
    `${input.templateName} for ${input.industry ?? "an unspecified industry"}.`,
    `Complexity ${score.score}/100 (${score.band.replace("_", " ")}).`,
    `Core: ${moduleNames.slice(0, 3).join(", ") || "TBD"}.`,
  ].join(" ");
}

function buildExecutiveBrief(
  input: GenerateInput,
  score: ComplexityResult,
  modules: BlueprintRecord["modules"],
  phases: BlueprintRecord["phases"],
): string {
  const lines: string[] = [];
  lines.push(`This blueprint translates the discovery answers into a structured plan.`);

  const top = modules.slice(0, 3).map((m) => m.name);
  if (top.length) {
    lines.push(``, `Core modules: ${top.join(" · ")}.`);
  }

  const totalWeeks = phases.reduce((acc, p) => acc + p.duration_weeks, 0);
  lines.push(``, `Estimated timeline: ${totalWeeks} weeks across ${phases.length} phases.`);

  switch (score.band) {
    case "low":
      lines.push("Risk profile is low. Standard four-phase rollout fits comfortably.");
      break;
    case "medium":
      lines.push(
        "Risk profile is medium — primary watch-items are integration count and governance configuration.",
      );
      break;
    case "high":
      lines.push(
        "Risk profile is high. Recommend a phased launch — one core module live before integrations land at full scope.",
      );
      break;
    case "very_high":
      lines.push(
        "Risk profile is very high. Recommend a 30-day proof-of-value before contracting for the full programme.",
      );
      break;
  }

  return lines.join("\n");
}

function arrayOr<T>(v: unknown): T[] {
  return Array.isArray(v) ? (v as T[]) : [];
}
