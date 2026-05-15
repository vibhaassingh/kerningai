/**
 * Pure scoring helpers. Given a flat map of question-slug → answer,
 * produce a complexity score 0–100 and a coarse band.
 *
 * Scoring intentionally biased toward operational complexity rather
 * than deal size: a small sovereign-cloud install at a single site is
 * more complex than a 12-site cloud rollout.
 */
export type ComplexityBand = "low" | "medium" | "high" | "very_high";

export interface ComplexityResult {
  score: number;
  band: ComplexityBand;
  drivers: { factor: string; weight: number; reason: string }[];
}

export interface AnswerMap {
  [slug: string]: unknown;
}

export function scoreComplexity(answers: AnswerMap): ComplexityResult {
  const drivers: ComplexityResult["drivers"] = [];

  // --- Deployment surface ------------------------------------------------
  const deployment =
    (answers["deployment.preference"] as string) ??
    (answers["dep.preference"] as string) ??
    null;
  switch (deployment) {
    case "air_gapped":
      drivers.push({ factor: "deployment", weight: 25, reason: "Air-gapped deployment" });
      break;
    case "on_prem":
      drivers.push({ factor: "deployment", weight: 18, reason: "On-prem deployment" });
      break;
    case "sovereign_cloud":
      drivers.push({ factor: "deployment", weight: 10, reason: "Sovereign cloud" });
      break;
    case "cloud":
      drivers.push({ factor: "deployment", weight: 3, reason: "Cloud deployment" });
      break;
    default:
      drivers.push({ factor: "deployment", weight: 5, reason: "Deployment to be determined" });
  }

  // --- Site & user footprint --------------------------------------------
  const sites = numOr0(answers["ctx.sites"]);
  if (sites >= 25) drivers.push({ factor: "scale", weight: 18, reason: `${sites} sites` });
  else if (sites >= 10) drivers.push({ factor: "scale", weight: 12, reason: `${sites} sites` });
  else if (sites >= 4) drivers.push({ factor: "scale", weight: 6, reason: `${sites} sites` });
  else if (sites >= 1) drivers.push({ factor: "scale", weight: 3, reason: `${sites} sites` });

  const users = numOr0(answers["users.count"]) || numOr0(answers["ctx.users"]);
  if (users >= 200) drivers.push({ factor: "users", weight: 8, reason: `${users} operators` });
  else if (users >= 50) drivers.push({ factor: "users", weight: 5, reason: `${users} operators` });
  else if (users >= 10) drivers.push({ factor: "users", weight: 2, reason: `${users} operators` });

  // --- Data sources / integrations --------------------------------------
  const sources = arrayOr<string>(answers["data.sources"]);
  if (sources.length >= 6) drivers.push({ factor: "integrations", weight: 14, reason: `${sources.length} data sources` });
  else if (sources.length >= 3) drivers.push({ factor: "integrations", weight: 8, reason: `${sources.length} data sources` });
  else if (sources.length >= 1) drivers.push({ factor: "integrations", weight: 3, reason: `${sources.length} data source(s)` });

  // --- Sensitivity & compliance posture ---------------------------------
  const sensitivity = answers["security.sensitivity"] as string | undefined;
  switch (sensitivity) {
    case "regulated":
      drivers.push({ factor: "compliance", weight: 18, reason: "Regulated data" });
      break;
    case "confidential":
      drivers.push({ factor: "compliance", weight: 10, reason: "Confidential data" });
      break;
    case "internal":
      drivers.push({ factor: "compliance", weight: 4, reason: "Internal-only data" });
      break;
  }

  // --- Agent risk tolerance ---------------------------------------------
  const risk = answers["guardrails.risk"] as string | undefined;
  if (risk === "low") {
    drivers.push({ factor: "agent_governance", weight: 8, reason: "High-touch agent governance" });
  } else if (risk === "high") {
    drivers.push({ factor: "agent_governance", weight: 4, reason: "Permissive agent governance" });
  }

  // --- Decision breadth --------------------------------------------------
  const signals = arrayOr<string>(answers["dec.signals"]);
  if (signals.length >= 4) drivers.push({ factor: "scope", weight: 10, reason: `${signals.length} decision domains` });
  else if (signals.length >= 2) drivers.push({ factor: "scope", weight: 5, reason: `${signals.length} decision domains` });

  // --- Audit trail required ---------------------------------------------
  if (answers["security.audit"] === true) {
    drivers.push({ factor: "audit", weight: 4, reason: "Full action ledger required" });
  }

  // --- Multilingual ------------------------------------------------------
  if (answers["users.multilingual"] === true) {
    drivers.push({ factor: "localisation", weight: 4, reason: "Multilingual operator surfaces" });
  }

  // Total
  const raw = drivers.reduce((acc, d) => acc + d.weight, 0);
  const score = Math.min(100, raw);
  const band: ComplexityBand =
    score >= 75 ? "very_high" : score >= 55 ? "high" : score >= 30 ? "medium" : "low";

  return { score, band, drivers };
}

function numOr0(v: unknown): number {
  if (typeof v === "number" && Number.isFinite(v)) return v;
  if (typeof v === "string" && v.trim() !== "" && !Number.isNaN(Number(v))) return Number(v);
  return 0;
}

function arrayOr<T>(v: unknown): T[] {
  return Array.isArray(v) ? (v as T[]) : [];
}
