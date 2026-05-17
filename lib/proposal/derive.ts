/**
 * Canvas → proposal derivation.
 *
 * Pure synthesis: takes a combined workflow-canvas bundle and produces a
 * structured proposal draft (scope / phases / modules / risks /
 * commercials). The rule-based output is authoritative; the admin can
 * edit every section afterwards and an optional LLM pass may rewrite the
 * narrative only.
 *
 * Kept free of `server-only` so it is unit-testable in isolation.
 */

import type { WorkflowCanvasNode } from "@/lib/workflow-canvas/types";

export type ProposalEmphasis = "core" | "recommended" | "optional";
export type ProposalScopeKind =
  | "in_scope"
  | "out_of_scope"
  | "assumption"
  | "dependency";
export type ProposalCommercialBasis =
  | "fixed"
  | "time_and_materials"
  | "license"
  | "subscription"
  | "one_time";

export interface ProposalDraft {
  title: string;
  summary: string;
  executiveBrief: string;
  phases: {
    name: string;
    description: string;
    duration_weeks: number;
    owners: string[];
    deliverables: string[];
    price: number | null;
  }[];
  modules: {
    slug: string;
    name: string;
    emphasis: ProposalEmphasis;
    rationale: string;
  }[];
  scopeItems: { kind: ProposalScopeKind; description: string }[];
  risks: {
    category: string;
    description: string;
    severity: "low" | "medium" | "high" | "critical";
    mitigation: string;
  }[];
  commercials: {
    label: string;
    basis: ProposalCommercialBasis;
    quantity: number;
    unit_rate: number;
    amount: number;
    notes: string | null;
  }[];
}

interface DeriveInput {
  nodes: WorkflowCanvasNode[];
  projectName: string;
  industry: string | null;
}

// Stages that form the "single source of truth" foundation; everything
// else in the proposed ERP is the operational loop on top of it.
const FOUNDATION_STAGES = new Set(["purchase", "inventory", "sales"]);

const STAGE_ORDER = [
  "purchase",
  "inventory",
  "sales",
  "dispatch",
  "billing",
  "freight",
  "dashboard",
];

function slugify(s: string): string {
  return s
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "_")
    .replace(/^_+|_+$/g, "");
}

function titleCase(s: string): string {
  return s
    .replace(/[_-]+/g, " ")
    .replace(/\b\w/g, (c) => c.toUpperCase())
    .trim();
}

/** Second token of a dotted node_key (`erp.purchase.foo` → `purchase`). */
function stageOf(node: WorkflowCanvasNode): string {
  const parts = node.node_key.split(".");
  if (parts.length >= 2 && parts[1]) return parts[1];
  return node.department ?? "general";
}

function clamp(n: number, lo: number, hi: number): number {
  return Math.max(lo, Math.min(hi, n));
}

export function deriveProposalFromCanvas(input: DeriveInput): ProposalDraft {
  const { nodes } = input;

  const current = nodes.filter((n) => n.phase === "current_manual");
  const erp = nodes.filter((n) => n.phase === "proposed_erp");
  const ai = nodes.filter((n) => n.phase === "erp_ai");

  const haystack = current
    .map((n) => `${n.current_process ?? ""} ${n.pain_points.join(" ")}`)
    .join(" ")
    .toLowerCase();
  const mentionsWhatsApp = haystack.includes("whatsapp");
  const mentionsBtst =
    haystack.includes("bill-to-ship-to") ||
    haystack.includes("bill to ship to") ||
    haystack.includes("btst");

  const phases = buildPhases(erp, ai);
  const modules = buildModules(erp, ai);
  const scopeItems = buildScopeItems(erp, ai);
  const risks = buildRisks(current, { mentionsWhatsApp, mentionsBtst });
  const commercials = buildCommercials(phases);

  const summary = buildSummary(input, current, erp, ai, phases);
  const executiveBrief = buildExecutiveBrief(input, current, erp, ai, phases);

  return {
    title: `${input.projectName} — Proposal`,
    summary,
    executiveBrief,
    phases,
    modules,
    scopeItems,
    risks,
    commercials,
  };
}

// ---------------------------------------------------------------------------
function nodeStages(list: WorkflowCanvasNode[]): Map<string, WorkflowCanvasNode[]> {
  const byStage = new Map<string, WorkflowCanvasNode[]>();
  for (const n of list) {
    const stage = stageOf(n);
    const arr = byStage.get(stage) ?? [];
    arr.push(n);
    byStage.set(stage, arr);
  }
  return byStage;
}

function buildPhases(
  erp: WorkflowCanvasNode[],
  ai: WorkflowCanvasNode[],
): ProposalDraft["phases"] {
  const foundation = erp.filter((n) => FOUNDATION_STAGES.has(stageOf(n)));
  const operational = erp.filter((n) => !FOUNDATION_STAGES.has(stageOf(n)));

  const phases: ProposalDraft["phases"] = [
    {
      name: "Phase 0 — Discovery & Sign-off",
      description:
        "Confirm scope, master-data inventory, deployment model and named owners. Lock the commercial schedule and acceptance criteria.",
      duration_weeks: 2,
      owners: ["Kerning Delivery Lead", "Client Project Sponsor"],
      deliverables: [
        "Signed proposal & commercial schedule",
        "Master-data & migration inventory",
        "RACI + named approvers",
      ],
      price: null,
    },
  ];

  if (foundation.length > 0) {
    phases.push({
      name: "Phase 1 — ERP Foundation",
      description:
        "Establish the single source of truth: purchase, inventory and sales with an approval trail and automated credit control. Eliminates duplicate entry and blind dispatch risk.",
      duration_weeks: clamp(Math.ceil(foundation.length * 1.5), 4, 12),
      owners: ["Kerning Delivery", "Client Process Owners"],
      deliverables: dedupe(foundation.map((n) => n.title)),
      price: null,
    });
  }

  if (operational.length > 0) {
    phases.push({
      name: "Phase 2 — Operational Loop, Mobile & Dashboard",
      description:
        "Close the loop: dispatch, mobile loading/goods-arrival, billing trigger, document checklist, freight, digital cash closing and the management dashboard.",
      duration_weeks: clamp(Math.ceil(operational.length * 1.5), 4, 14),
      owners: ["Kerning Delivery", "Client Depot & Accounts"],
      deliverables: dedupe(operational.map((n) => n.title)),
      price: null,
    });
  }

  if (ai.length > 0) {
    phases.push({
      name: "Phase 3 — AI Overlay",
      description:
        "Layer AI on the live ERP: WhatsApp-to-ERP capture, invoice matching, credit-risk alerts, OCR, the stock assistant and margin-leakage / exception intelligence. Sequenced strictly after ERP go-live.",
      duration_weeks: clamp(Math.ceil(ai.length * 1.2), 3, 12),
      owners: ["Kerning AI/ML", "Client Operations"],
      deliverables: dedupe(ai.map((n) => n.title)),
      price: null,
    });
  }

  return phases;
}

function buildModules(
  erp: WorkflowCanvasNode[],
  ai: WorkflowCanvasNode[],
): ProposalDraft["modules"] {
  const acc = new Map<
    string,
    { titles: Set<string>; count: number; highAutomation: boolean }
  >();

  for (const n of [...erp, ...ai]) {
    for (const m of n.erp_modules) {
      const key = m.trim();
      if (!key) continue;
      const entry = acc.get(key) ?? {
        titles: new Set<string>(),
        count: 0,
        highAutomation: false,
      };
      entry.titles.add(n.title);
      entry.count += 1;
      if (n.automation_potential === "high") entry.highAutomation = true;
      acc.set(key, entry);
    }
  }

  return [...acc.entries()]
    .sort((a, b) => b[1].count - a[1].count)
    .map(([name, e]) => {
      const emphasis: ProposalEmphasis =
        e.count >= 3 || e.highAutomation
          ? "core"
          : e.count === 2
            ? "recommended"
            : "optional";
      return {
        slug: slugify(name),
        name,
        emphasis,
        rationale: `Covers ${[...e.titles].slice(0, 4).join(", ")}${
          e.titles.size > 4 ? ` and ${e.titles.size - 4} more` : ""
        }.`,
      };
    });
}

function buildScopeItems(
  erp: WorkflowCanvasNode[],
  ai: WorkflowCanvasNode[],
): ProposalDraft["scopeItems"] {
  const items: ProposalDraft["scopeItems"] = [];
  const byStage = nodeStages(erp);

  const orderedStages = [
    ...STAGE_ORDER.filter((s) => byStage.has(s)),
    ...[...byStage.keys()].filter((s) => !STAGE_ORDER.includes(s)),
  ];

  for (const stage of orderedStages) {
    const titles = dedupe((byStage.get(stage) ?? []).map((n) => n.title));
    items.push({
      kind: "in_scope",
      description: `ERP — ${titleCase(stage)}: ${titles.join(", ")}.`,
    });
  }
  if (ai.length > 0) {
    items.push({
      kind: "in_scope",
      description: `AI overlay: ${dedupe(ai.map((n) => n.title)).join(", ")}.`,
    });
  }

  const mobileReferenced = erp.some((n) =>
    `${n.title} ${n.proposed_process ?? ""}`.toLowerCase().includes("mobile"),
  );

  items.push(
    {
      kind: "assumption",
      description:
        "Client provides timely access to the existing software and master data for migration.",
    },
    {
      kind: "assumption",
      description:
        "Key users are available for configuration workshops and UAT within each phase window.",
    },
    {
      kind: "dependency",
      description: "Signed acceptance of this proposal and the commercial schedule.",
    },
    {
      kind: "dependency",
      description:
        "Client-nominated process owners and named approvers per module.",
    },
    {
      kind: "dependency",
      description: "Deployment model (cloud / on-prem) confirmed before Phase 1.",
    },
    {
      kind: "out_of_scope",
      description:
        "Statutory GST / e-invoice filing engine — integration only, not a filing product.",
    },
    {
      kind: "out_of_scope",
      description:
        "Replacement of the existing financial accounting ledger — integrate, do not replace.",
    },
    {
      kind: "out_of_scope",
      description: "Supplier / principal company-side systems.",
    },
    {
      kind: "out_of_scope",
      description: "Hardware, network and device procurement.",
    },
  );

  if (mobileReferenced) {
    items.splice(orderedStages.length + (ai.length > 0 ? 1 : 0) + 2, 0, {
      kind: "assumption",
      description:
        "Depot / godown sites have the connectivity and mobile devices required for mobile capture.",
    });
  }

  return items;
}

function buildRisks(
  current: WorkflowCanvasNode[],
  flags: { mentionsWhatsApp: boolean; mentionsBtst: boolean },
): ProposalDraft["risks"] {
  const fromCanvas = current
    .filter((n) => n.risk_level === "high" || n.risk_level === "medium")
    .sort((a, b) =>
      a.risk_level === "high" && b.risk_level !== "high"
        ? -1
        : b.risk_level === "high" && a.risk_level !== "high"
          ? 1
          : 0,
    )
    .slice(0, 8)
    .map((n) => ({
      category: titleCase(n.department ?? "Operations"),
      description: n.pain_points.length
        ? `${n.title}: ${n.pain_points.join("; ")}.`
        : `${n.title} is a manual step today.`,
      severity: (n.risk_level === "high" ? "high" : "medium") as
        | "high"
        | "medium",
      mitigation: `Replaced by the proposed ERP (${titleCase(stageOf(n))}).`,
    }));

  const structural: ProposalDraft["risks"] = [
    {
      category: "Sequencing",
      description:
        "The AI overlay depends on a live ERP foundation — every AI capability attaches to an ERP process.",
      severity: "high",
      mitigation:
        "Sequence AI strictly after ERP go-live; do not contract AI as parallel scope.",
    },
    {
      category: "Data migration",
      description:
        "Parties, credit limits, opening and in-transit stock must migrate from the existing software.",
      severity: "medium",
      mitigation:
        "Dedicated migration workstream with a reconciliation sign-off gate before go-live.",
    },
  ];

  if (flags.mentionsWhatsApp) {
    structural.unshift({
      category: "Change management",
      description:
        "Deal capture, approvals and reporting happen in WhatsApp groups today; the value depends on moving these into the system.",
      severity: "high",
      mitigation:
        "Phase-1 adoption plan: named users, WhatsApp-to-ERP capture and a management mandate.",
    });
  }
  if (flags.mentionsBtst) {
    structural.push({
      category: "Process complexity",
      description:
        "Bill-to-ship-to flows span purchase, billing and freight and need explicit end-to-end handling.",
      severity: "medium",
      mitigation: "Model BTST per leg in Phase 2 with dedicated test cases.",
    });
  }

  return [...fromCanvas, ...structural];
}

function buildCommercials(
  phases: ProposalDraft["phases"],
): ProposalDraft["commercials"] {
  const lines: ProposalDraft["commercials"] = phases
    .filter((p) => !p.name.startsWith("Phase 0"))
    .map((p) => ({
      label: p.name,
      basis: "fixed" as const,
      quantity: 1,
      unit_rate: 0,
      amount: 0,
      notes: `${p.duration_weeks} weeks`,
    }));

  lines.push(
    {
      label: "Data migration",
      basis: "one_time",
      quantity: 1,
      unit_rate: 0,
      amount: 0,
      notes: "Master data, credit limits, opening & in-transit stock",
    },
    {
      label: "Platform & AI subscription (annual)",
      basis: "subscription",
      quantity: 1,
      unit_rate: 0,
      amount: 0,
      notes: "Recurring — billed annually from go-live",
    },
  );

  return lines;
}

function buildSummary(
  input: DeriveInput,
  current: WorkflowCanvasNode[],
  erp: WorkflowCanvasNode[],
  ai: WorkflowCanvasNode[],
  phases: ProposalDraft["phases"],
): string {
  const weeks = phases.reduce((a, p) => a + p.duration_weeks, 0);
  return [
    `${input.projectName} — formal proposal for ${
      input.industry ?? "the operation"
    }.`,
    `ERP + AI transformation across ${phases.length} phases (~${weeks} weeks).`,
    `Replaces ${current.length} manual steps with ${erp.length} system processes and ${ai.length} AI assists.`,
  ].join(" ");
}

function buildExecutiveBrief(
  input: DeriveInput,
  current: WorkflowCanvasNode[],
  erp: WorkflowCanvasNode[],
  ai: WorkflowCanvasNode[],
  phases: ProposalDraft["phases"],
): string {
  const topPains = current
    .filter((n) => n.risk_level === "high")
    .slice(0, 3)
    .map((n) => n.title);
  const weeks = phases.reduce((a, p) => a + p.duration_weeks, 0);

  const lines: string[] = [];
  lines.push(
    `This proposal translates the agreed workflow canvas into a phased, priced engagement.`,
  );
  if (topPains.length) {
    lines.push(
      ``,
      `Highest-risk manual areas today: ${topPains.join(" · ")}.`,
    );
  }
  lines.push(
    ``,
    `Approach: ${phases.map((p) => p.name.replace(/ —.*/, "")).join(" → ")} over ~${weeks} weeks.`,
  );
  lines.push(
    ``,
    `The AI overlay (${ai.length} capabilities) is sequenced strictly after the ERP foundation is live; it is not parallel scope.`,
  );
  lines.push(
    ``,
    `Commercials below are a structured schedule — phase fees, one-time data migration and a recurring platform & AI subscription. Figures are to be completed during pricing.`,
  );
  return lines.join("\n");
}

function dedupe(arr: string[]): string[] {
  return [...new Set(arr.filter(Boolean))];
}
