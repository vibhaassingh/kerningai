#!/usr/bin/env node
/**
 * Generates supabase/migrations/0021_seed_saurabh_arora.sql from the
 * canonical TypeScript data in lib/workflow-canvas/seed/saurabh-arora.ts.
 *
 * Run after editing the seed data:
 *   pnpm dlx tsx scripts/generate-saurabh-seed.mjs
 *
 * Then commit both the .ts and .sql files together.
 */

import { writeFileSync } from "node:fs";
import { join, dirname } from "node:path";
import { fileURLToPath } from "node:url";

import {
  CURRENT_NODES,
  CURRENT_EDGES,
  ERP_NODES,
  ERP_EDGES,
  AI_NODES,
  AI_EDGES,
} from "../lib/workflow-canvas/seed/saurabh-arora.ts";

const __dirname = dirname(fileURLToPath(import.meta.url));
const OUT = join(__dirname, "..", "supabase", "migrations", "0021_seed_saurabh_arora.sql");

// Stable UUIDs — same across local, staging, prod.
const PARTNER_ORG_ID = "22222222-2222-2222-2222-222222220001";
const CLIENT_ORG_ID = "22222222-2222-2222-2222-222222220002";
const PROJECT_ID = "22222222-2222-2222-2222-222222220003";
const CANVAS_CURRENT_ID = "22222222-2222-2222-2222-222222220010";
const CANVAS_PROPOSED_ID = "22222222-2222-2222-2222-222222220011";
const CANVAS_AI_ID = "22222222-2222-2222-2222-222222220012";
const CANVAS_COMBINED_ID = "22222222-2222-2222-2222-222222220013";

function nodeInsert(canvasId, nodes) {
  const rows = nodes.map((n) => {
    const cols = [
      `'${canvasId}'`,
      `'${n.node_key}'`,
      `'${n.node_type}'`,
      `'${n.phase}'`,
      n.department ? `'${n.department}'` : "NULL",
      `'${n.visibility ?? "internal_only"}'`,
      `'${(n.title ?? "").replace(/'/g, "''")}'`,
      n.short_label ? `'${n.short_label.replace(/'/g, "''")}'` : "NULL",
      n.description ? `'${n.description.replace(/'/g, "''")}'` : "NULL",
      `ARRAY[${(n.actors ?? []).map((s) => `'${s.replace(/'/g, "''")}'`).join(",")}]::text[]`,
      n.current_process ? `'${n.current_process.replace(/'/g, "''")}'` : "NULL",
      n.proposed_process ? `'${n.proposed_process.replace(/'/g, "''")}'` : "NULL",
      n.ai_opportunity ? `'${n.ai_opportunity.replace(/'/g, "''")}'` : "NULL",
      `ARRAY[${(n.pain_points ?? []).map((s) => `'${s.replace(/'/g, "''")}'`).join(",")}]::text[]`,
      `ARRAY[${(n.erp_modules ?? []).map((s) => `'${s.replace(/'/g, "''")}'`).join(",")}]::text[]`,
      `ARRAY[${(n.documents ?? []).map((s) => `'${s.replace(/'/g, "''")}'`).join(",")}]::text[]`,
      `ARRAY[${(n.data_captured ?? []).map((s) => `'${s.replace(/'/g, "''")}'`).join(",")}]::text[]`,
      n.risk_level ? `'${n.risk_level}'` : "NULL",
      n.automation_potential ? `'${n.automation_potential}'` : "NULL",
      n.internal_notes ? `'${n.internal_notes.replace(/'/g, "''")}'` : "NULL",
      n.client_notes ? `'${n.client_notes.replace(/'/g, "''")}'` : "NULL",
      String(n.position_x),
      String(n.position_y),
    ];
    return `  (${cols.join(", ")})`;
  });

  return `INSERT INTO public.workflow_canvas_nodes (
  canvas_id, node_key, node_type, phase, department, visibility,
  title, short_label, description, actors,
  current_process, proposed_process, ai_opportunity,
  pain_points, erp_modules, documents, data_captured,
  risk_level, automation_potential, internal_notes, client_notes,
  position_x, position_y
) VALUES
${rows.join(",\n")}
ON CONFLICT (canvas_id, node_key) DO NOTHING;
`;
}

function edgeInsert(canvasId, edges) {
  const rows = edges.map((e) => {
    const cols = [
      `'${canvasId}'`,
      `'${e.edge_key}'`,
      `'${e.source_node_key}'`,
      `'${e.target_node_key}'`,
      `'${e.edge_type ?? "normal"}'`,
      `'${e.phase}'`,
      `'${e.visibility ?? "internal_only"}'`,
      e.label ? `'${e.label.replace(/'/g, "''")}'` : "NULL",
      e.condition ? `'${e.condition.replace(/'/g, "''")}'` : "NULL",
    ];
    return `  (${cols.join(", ")})`;
  });

  return `INSERT INTO public.workflow_canvas_edges (
  canvas_id, edge_key, source_node_key, target_node_key,
  edge_type, phase, visibility, label, condition
) VALUES
${rows.join(",\n")}
ON CONFLICT (canvas_id, edge_key) DO NOTHING;
`;
}

const sql = `-- =============================================================================
-- Migration 0021 — Seed Saurabh Arora (canonical reference client)
-- =============================================================================
-- Production-safe seed: stable UUIDs so the org + canvases exist in local,
-- staging, and production after migrations apply. Mirrors the pattern in
-- 0009_seed_core.sql.
--
-- This file is auto-generated from lib/workflow-canvas/seed/saurabh-arora.ts.
-- Re-generate with:  pnpm dlx tsx scripts/generate-saurabh-seed.mjs
--
-- Saurabh Arora — Refined Oil Distribution / C&F Operations.
-- Referred by Avinash Group (partner).
-- Canvases:
--   * Current Manual Workflow (${CURRENT_NODES.length} nodes, ${CURRENT_EDGES.length} edges)
--   * Proposed ERP Workflow   (${ERP_NODES.length} nodes, ${ERP_EDGES.length} edges)
--   * ERP + AI Workflow       (${AI_NODES.length} nodes, ${AI_EDGES.length} edges)
--   * Combined view           (all of the above)
-- =============================================================================

-- ---------------------------------------------------------------------------
-- 1. Partner org (Avinash Group)
-- ---------------------------------------------------------------------------
INSERT INTO public.organizations (id, name, slug, type, region, billing_email, metadata) VALUES
  ('${PARTNER_ORG_ID}'::uuid,
   'Avinash Group — Partner Referral',
   'avinash-partner',
   'partner',
   'ap-south-1',
   'partner@avinash.example.com',
   '{"channel":"partner_referral"}'::jsonb)
ON CONFLICT (slug) DO NOTHING;

-- ---------------------------------------------------------------------------
-- 2. Client org (Saurabh Arora)
-- ---------------------------------------------------------------------------
INSERT INTO public.organizations (id, name, slug, type, region, billing_email, metadata) VALUES
  ('${CLIENT_ORG_ID}'::uuid,
   'Saurabh Arora — Refined Oil Distribution',
   'saurabh-arora',
   'client',
   'ap-south-1',
   'finance@saurabh-arora.example.com',
   '{"industry":"refined_oil_distribution","business":"C&F Operations"}'::jsonb)
ON CONFLICT (slug) DO NOTHING;

INSERT INTO public.client_settings (organization_id, industry, deployment_type, modules_enabled, currency)
VALUES ('${CLIENT_ORG_ID}'::uuid,
        'refined_oil_distribution',
        'cloud',
        ARRAY['workflow_canvas','agentic_workflows','decision_intelligence']::text[],
        'INR')
ON CONFLICT (organization_id) DO NOTHING;

-- ---------------------------------------------------------------------------
-- 3. Project
-- ---------------------------------------------------------------------------
INSERT INTO public.projects (
  id, organization_id, partner_org_id, partner_visible_to_client,
  name, slug, description, status, industry_label, business_label, badges
) VALUES (
  '${PROJECT_ID}'::uuid,
  '${CLIENT_ORG_ID}'::uuid,
  '${PARTNER_ORG_ID}'::uuid,
  true,
  'Saurabh Arora — ERP + AI Workflow Blueprint',
  'erp-ai-blueprint',
  'Refined oil distribution / C&F operations: discovery, ERP design, AI overlay, proposal preparation.',
  'discovery',
  'Refined Oil Distribution',
  'Refined Oil Distribution / C&F Operations',
  ARRAY['Actual Client','Partner Referral','Discovery','ERP + AI Workflow']::text[]
)
ON CONFLICT (organization_id, slug) DO NOTHING;

-- ---------------------------------------------------------------------------
-- 4. Canvases (one per phase + combined)
-- ---------------------------------------------------------------------------
INSERT INTO public.workflow_canvases (
  id, organization_id, project_id, template_slug,
  title, subtitle, canvas_type, status, visibility, badges
) VALUES
  ('${CANVAS_CURRENT_ID}'::uuid,
   '${CLIENT_ORG_ID}'::uuid, '${PROJECT_ID}'::uuid, 'refined_oil_cf',
   'Saurabh Arora — Current Manual Workflow',
   'Refined Oil Distribution / C&F Operations',
   'current_manual', 'internal_review', 'shared_all',
   ARRAY['Actual Client','Partner Referral','Discovery']::text[]),

  ('${CANVAS_PROPOSED_ID}'::uuid,
   '${CLIENT_ORG_ID}'::uuid, '${PROJECT_ID}'::uuid, 'refined_oil_cf',
   'Saurabh Arora — Proposed ERP Workflow',
   'Refined Oil Distribution / C&F Operations',
   'proposed_erp', 'internal_review', 'shared_all',
   ARRAY['Actual Client','Partner Referral','Discovery']::text[]),

  ('${CANVAS_AI_ID}'::uuid,
   '${CLIENT_ORG_ID}'::uuid, '${PROJECT_ID}'::uuid, 'refined_oil_cf',
   'Saurabh Arora — ERP + AI Workflow',
   'Refined Oil Distribution / C&F Operations',
   'erp_ai', 'internal_review', 'shared_all',
   ARRAY['Actual Client','Partner Referral','Discovery','ERP + AI']::text[]),

  ('${CANVAS_COMBINED_ID}'::uuid,
   '${CLIENT_ORG_ID}'::uuid, '${PROJECT_ID}'::uuid, 'refined_oil_cf',
   'Saurabh Arora — Workflow Canvas',
   'Refined Oil Distribution / C&F Operations',
   'combined', 'internal_review', 'shared_all',
   ARRAY['Actual Client','Partner Referral','Discovery','ERP + AI Workflow']::text[])
ON CONFLICT (id) DO NOTHING;

-- ---------------------------------------------------------------------------
-- 5. Current Manual nodes + edges
-- ---------------------------------------------------------------------------
${nodeInsert(CANVAS_CURRENT_ID, CURRENT_NODES)}
${edgeInsert(CANVAS_CURRENT_ID, CURRENT_EDGES)}

-- ---------------------------------------------------------------------------
-- 6. Proposed ERP nodes + edges
-- ---------------------------------------------------------------------------
${nodeInsert(CANVAS_PROPOSED_ID, ERP_NODES)}
${edgeInsert(CANVAS_PROPOSED_ID, ERP_EDGES)}

-- ---------------------------------------------------------------------------
-- 7. ERP + AI nodes + edges (AI nodes here, plus all ERP nodes for context)
-- ---------------------------------------------------------------------------
${nodeInsert(CANVAS_AI_ID, ERP_NODES)}
${nodeInsert(CANVAS_AI_ID, AI_NODES)}
${edgeInsert(CANVAS_AI_ID, ERP_EDGES.map((e) => ({ ...e, edge_key: `ai_ctx.${e.edge_key}` })))}
${edgeInsert(CANVAS_AI_ID, AI_EDGES)}

-- ---------------------------------------------------------------------------
-- 8. Combined canvas — every node, every edge
-- ---------------------------------------------------------------------------
${nodeInsert(CANVAS_COMBINED_ID, [...CURRENT_NODES, ...ERP_NODES, ...AI_NODES])}
${edgeInsert(CANVAS_COMBINED_ID, [
    ...CURRENT_EDGES.map((e) => ({ ...e, edge_key: `c.${e.edge_key}` })),
    ...ERP_EDGES.map((e) => ({ ...e, edge_key: `e.${e.edge_key}` })),
    ...AI_EDGES.map((e) => ({ ...e, edge_key: `a.${e.edge_key}` })),
  ])}
`;

writeFileSync(OUT, sql, "utf8");
console.log(`Wrote ${OUT} (${sql.length} bytes)`);
