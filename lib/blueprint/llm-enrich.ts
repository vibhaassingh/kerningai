import "server-only";

import { ANTHROPIC_API_KEY, ANTHROPIC_MODEL, LLM_CONFIGURED } from "@/lib/env";
import type { BlueprintRecord } from "@/lib/blueprint/generate";

/**
 * LLM blueprint enrichment.
 *
 * The rule-based generator (lib/blueprint/generate.ts) is always
 * authoritative for SCORING, modules, phases, risks and checklist. This
 * only rewrites the narrative `summary` + `executiveBrief` into sharper,
 * client-ready prose grounded strictly in the rule-based output — it
 * never invents modules, numbers, or commitments.
 *
 * Gated by BOTH the `blueprint_llm_enrichment` feature flag (checked by
 * the caller) AND `ANTHROPIC_API_KEY` being set. Fails closed: any
 * error / timeout / malformed response returns null and the caller
 * keeps the rule-based text + `generated_by = 'rule_based'`.
 *
 * Direct fetch to the Anthropic Messages API (no SDK dependency) —
 * server-only, key never exposed. System block is marked
 * `cache_control` so repeated enrichments hit the prompt cache.
 */

export interface EnrichInput {
  templateName: string;
  service: string;
  industry: string | null;
  blueprint: BlueprintRecord;
}

export interface EnrichResult {
  summary: string;
  executiveBrief: string;
}

const SYSTEM_PROMPT = `You are a principal solutions architect at Kerning AI writing the narrative of a Solution Blueprint for a prospective client.

You are given a rule-based blueprint (complexity score, recommended modules with rationale, implementation phases, risks). Your ONLY job is to rewrite two fields — "summary" and "executiveBrief" — so they read as sharp, specific, confident consulting prose.

Hard rules:
- Ground every claim ONLY in the provided blueprint. Do NOT invent modules, integrations, timelines, prices, metrics, or guarantees.
- Keep the same complexity band and module set; you are rephrasing, not re-deciding.
- "summary": 2-3 sentences, plain and direct.
- "executiveBrief": 4-7 short sentences (may use \\n line breaks), executive tone, no marketing fluff, no bullet symbols.
- British/neutral English. No emojis. No headings.
- Respond with ONLY a single minified JSON object: {"summary": "...", "executiveBrief": "..."} and nothing else.`;

export async function enrichBlueprint(
  input: EnrichInput,
): Promise<EnrichResult | null> {
  if (!LLM_CONFIGURED) return null;

  const bp = input.blueprint;
  const grounding = {
    template: input.templateName,
    service: input.service,
    industry: input.industry,
    complexity: { score: bp.score.score, band: bp.score.band },
    modules: bp.modules.map((m) => ({
      name: m.name,
      emphasis: m.emphasis,
      rationale: m.rationale,
    })),
    phases: bp.phases.map((p) => ({
      name: p.name,
      duration_weeks: p.duration_weeks,
      deliverables: p.deliverables,
    })),
    risks: bp.risks.map((r) => ({
      category: r.category,
      severity: r.severity,
      description: r.description,
    })),
    rule_based_summary: bp.summary,
    rule_based_executive_brief: bp.executiveBrief,
  };

  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), 20_000);

  try {
    const res = await fetch("https://api.anthropic.com/v1/messages", {
      method: "POST",
      signal: controller.signal,
      headers: {
        "content-type": "application/json",
        "x-api-key": ANTHROPIC_API_KEY,
        "anthropic-version": "2023-06-01",
      },
      body: JSON.stringify({
        model: ANTHROPIC_MODEL,
        max_tokens: 900,
        temperature: 0.4,
        system: [
          {
            type: "text",
            text: SYSTEM_PROMPT,
            cache_control: { type: "ephemeral" },
          },
        ],
        messages: [
          {
            role: "user",
            content: `Rewrite summary + executiveBrief for this blueprint:\n\n${JSON.stringify(
              grounding,
            )}`,
          },
        ],
      }),
    });

    if (!res.ok) {
      console.error("[llm-enrich] anthropic non-200", res.status);
      return null;
    }

    const json = (await res.json()) as {
      content?: { type: string; text?: string }[];
    };
    const text =
      json.content?.find((c) => c.type === "text")?.text?.trim() ?? "";
    if (!text) return null;

    // Be tolerant of accidental code fences.
    const cleaned = text
      .replace(/^```(?:json)?\s*/i, "")
      .replace(/\s*```$/i, "")
      .trim();
    const parsed = JSON.parse(cleaned) as Partial<EnrichResult>;

    if (
      typeof parsed.summary !== "string" ||
      typeof parsed.executiveBrief !== "string" ||
      parsed.summary.trim().length < 10 ||
      parsed.executiveBrief.trim().length < 20
    ) {
      return null;
    }

    return {
      summary: parsed.summary.trim(),
      executiveBrief: parsed.executiveBrief.trim(),
    };
  } catch (err) {
    console.error("[llm-enrich] failed", err);
    return null;
  } finally {
    clearTimeout(timeout);
  }
}
