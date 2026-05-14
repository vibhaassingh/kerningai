import "server-only";

import { createClient } from "@/lib/supabase/server";
import { createServiceClient } from "@/lib/supabase/service";
import {
  filterCanvasForAudience,
} from "@/lib/workflow-canvas/visibility";
import type {
  CanvasAudience,
  WorkflowCanvas,
  WorkflowCanvasBundle,
  WorkflowCanvasComment,
  WorkflowCanvasEdge,
  WorkflowCanvasNode,
  WorkflowCanvasVersion,
} from "@/lib/workflow-canvas/types";

/**
 * Read functions for the workflow-canvas feature.
 *
 * All public functions accept an `audience` argument so the server can
 * strip fields the audience shouldn't see, even though RLS already gates
 * which canvases are returned at all.
 */

const CANVAS_COLUMNS = `
  id, organization_id, project_id, blueprint_id, template_slug,
  title, subtitle, description, canvas_type, status, visibility,
  viewport, version, badges,
  created_by_id, updated_by_id,
  shared_with_client_at, shared_with_partner_at,
  created_at, updated_at, metadata
`;

const NODE_COLUMNS = `
  id, canvas_id, node_key, node_type, phase, department, visibility,
  title, short_label, description, actors,
  current_process, proposed_process, ai_opportunity,
  pain_points, erp_modules, documents, data_captured,
  risk_level, automation_potential, internal_notes, client_notes,
  position_x, position_y, metadata
`;

const EDGE_COLUMNS = `
  id, canvas_id, edge_key, source_node_key, target_node_key,
  edge_type, phase, visibility, label, condition, metadata
`;

export async function getCanvasBundle(
  canvasId: string,
  audience: CanvasAudience,
): Promise<WorkflowCanvasBundle | null> {
  const supabase = await createClient();

  const { data: canvas } = await supabase
    .from("workflow_canvases")
    .select(CANVAS_COLUMNS)
    .eq("id", canvasId)
    .maybeSingle();

  if (!canvas) return null;

  const { data: nodes } = await supabase
    .from("workflow_canvas_nodes")
    .select(NODE_COLUMNS)
    .eq("canvas_id", canvasId)
    .order("position_y", { ascending: true });

  const { data: edges } = await supabase
    .from("workflow_canvas_edges")
    .select(EDGE_COLUMNS)
    .eq("canvas_id", canvasId);

  const bundle: WorkflowCanvasBundle = {
    canvas: canvas as WorkflowCanvas,
    nodes: (nodes ?? []) as WorkflowCanvasNode[],
    edges: (edges ?? []) as WorkflowCanvasEdge[],
  };

  return filterCanvasForAudience(bundle, audience);
}

export async function listCanvasesForProject(
  projectId: string,
  audience: CanvasAudience,
): Promise<WorkflowCanvas[]> {
  const supabase = await createClient();

  let query = supabase
    .from("workflow_canvases")
    .select(CANVAS_COLUMNS)
    .eq("project_id", projectId)
    .order("created_at", { ascending: true });

  // RLS already filters; this is defense-in-depth for direct callers.
  if (audience === "client") {
    query = query
      .in("visibility", ["client_visible", "shared_all"])
      .in("status", ["client_ready", "shared_with_client", "approved"]);
  } else if (audience === "partner") {
    query = query
      .in("visibility", ["partner_visible", "shared_all"])
      .in("status", ["shared_with_client", "approved"]);
  }

  const { data } = await query;
  return (data ?? []) as WorkflowCanvas[];
}

export async function listCanvasesForOrg(
  organizationId: string,
  audience: CanvasAudience,
): Promise<WorkflowCanvas[]> {
  const supabase = await createClient();

  let query = supabase
    .from("workflow_canvases")
    .select(CANVAS_COLUMNS)
    .eq("organization_id", organizationId)
    .order("updated_at", { ascending: false });

  if (audience === "client") {
    query = query
      .in("visibility", ["client_visible", "shared_all"])
      .in("status", ["client_ready", "shared_with_client", "approved"]);
  } else if (audience === "partner") {
    query = query
      .in("visibility", ["partner_visible", "shared_all"])
      .in("status", ["shared_with_client", "approved"]);
  }

  const { data } = await query;
  return (data ?? []) as WorkflowCanvas[];
}

export async function listCanvasComments(
  canvasId: string,
  audience: CanvasAudience,
): Promise<WorkflowCanvasComment[]> {
  const supabase = await createClient();

  let query = supabase
    .from("workflow_canvas_comments")
    .select(
      "id, canvas_id, node_key, edge_key, user_id, body, visibility, status, created_at, updated_at",
    )
    .eq("canvas_id", canvasId)
    .order("created_at", { ascending: false });

  if (audience !== "admin") {
    const visible =
      audience === "client"
        ? ["client_visible", "shared_all"]
        : ["partner_visible", "shared_all"];
    query = query.in("visibility", visible);
  }

  const { data } = await query;
  return (data ?? []) as WorkflowCanvasComment[];
}

export async function listCanvasVersions(
  canvasId: string,
): Promise<WorkflowCanvasVersion[]> {
  // Versions are admin-only — service-role read.
  const service = createServiceClient();
  const { data } = await service
    .from("workflow_canvas_versions")
    .select("id, canvas_id, version, title, snapshot, change_summary, created_by_id, created_at")
    .eq("canvas_id", canvasId)
    .order("version", { ascending: false });
  return (data ?? []) as WorkflowCanvasVersion[];
}
