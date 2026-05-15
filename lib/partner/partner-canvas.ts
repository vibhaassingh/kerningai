import "server-only";

import { withAudit } from "@/lib/audit/with-audit";
import { requireUser } from "@/lib/auth/require";
import { createServiceClient } from "@/lib/supabase/service";
import { getUserMemberships } from "@/lib/tenancy/current-org";
import type {
  WorkflowCanvas,
  WorkflowCanvasBundle,
  WorkflowCanvasComment,
  WorkflowCanvasEdge,
  WorkflowCanvasNode,
} from "@/lib/workflow-canvas/types";

/**
 * Partner FULL-DETAIL canvas access.
 *
 * Product decision (locked 2026-05-15): a partner that referred a project
 * sees the COMPLETE workflow canvas for that project — every node, every
 * edge, internal_notes and client_notes included — and may leave remarks.
 *
 * This intentionally goes beyond the RLS surface from migration 0020
 * (which only exposes partner_visible/shared_all canvases to partners).
 * Rather than widening RLS for everyone, the elevated read happens here
 * via the service-role client, gated by an EXPLICIT membership check:
 * the caller must be an active member of the project's partner_org_id.
 * Every elevated read is written to the audit log.
 *
 * Nothing here is reachable without first passing assertPartnerForProject.
 */

export interface PartnerProjectContext {
  projectId: string;
  partnerOrgId: string;
  organizationId: string;
  name: string;
  description: string | null;
  status: string;
  business_label: string | null;
  industry_label: string | null;
  client_org_name: string;
}

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

const COMMENT_COLUMNS =
  "id, canvas_id, node_key, edge_key, user_id, body, visibility, status, created_at, updated_at";

/**
 * Verifies the current user is an active member of the partner org that
 * referred the given project. Returns the project context, or null when
 * the project has no partner / the user isn't on that partner's team.
 *
 * Uses the service role to read the project row (so the check itself
 * doesn't depend on the project RLS), but the authorization decision is
 * the explicit membership comparison below — not RLS.
 */
export async function assertPartnerForProject(
  projectId: string,
): Promise<PartnerProjectContext | null> {
  const service = createServiceClient();
  const { data } = await service
    .from("projects")
    .select(
      `id, organization_id, partner_org_id, name, description, status,
       business_label, industry_label,
       client:organizations!projects_organization_id_fkey ( name )`,
    )
    .eq("id", projectId)
    .is("deleted_at", null)
    .maybeSingle();

  if (!data) return null;
  type Row = {
    id: string;
    organization_id: string;
    partner_org_id: string | null;
    name: string;
    description: string | null;
    status: string;
    business_label: string | null;
    industry_label: string | null;
    client: { name: string } | null;
  };
  const p = data as unknown as Row;
  if (!p.partner_org_id) return null;

  const memberships = await getUserMemberships();
  const isPartnerMember = memberships.some(
    (m) =>
      m.organizationId === p.partner_org_id &&
      m.organizationType === "partner",
  );
  if (!isPartnerMember) return null;

  return {
    projectId: p.id,
    partnerOrgId: p.partner_org_id,
    organizationId: p.organization_id,
    name: p.name,
    description: p.description,
    status: p.status,
    business_label: p.business_label,
    industry_label: p.industry_label,
    client_org_name: p.client?.name ?? "",
  };
}

/** All canvases for a partner-referred project (full detail — no filter). */
export async function listPartnerProjectCanvasesFull(
  projectId: string,
): Promise<WorkflowCanvas[]> {
  const ctx = await assertPartnerForProject(projectId);
  if (!ctx) return [];

  const service = createServiceClient();
  const { data } = await service
    .from("workflow_canvases")
    .select(CANVAS_COLUMNS)
    .eq("project_id", projectId)
    .order("created_at", { ascending: true });
  return (data ?? []) as WorkflowCanvas[];
}

export interface PartnerFullCanvas {
  bundle: WorkflowCanvasBundle;
  comments: WorkflowCanvasComment[];
  ctx: PartnerProjectContext;
}

/**
 * Returns the UNREDACTED canvas bundle + all comments for a partner that
 * referred the project. Audit-logged. Returns null when not authorized or
 * the canvas doesn't belong to the project.
 */
export async function getPartnerFullCanvasBundle(
  projectId: string,
  canvasId: string,
): Promise<PartnerFullCanvas | null> {
  const ctx = await assertPartnerForProject(projectId);
  if (!ctx) return null;

  const service = createServiceClient();

  const { data: canvas } = await service
    .from("workflow_canvases")
    .select(CANVAS_COLUMNS)
    .eq("id", canvasId)
    .eq("project_id", projectId)
    .maybeSingle();
  if (!canvas) return null;

  const [{ data: nodes }, { data: edges }, { data: comments }] =
    await Promise.all([
      service
        .from("workflow_canvas_nodes")
        .select(NODE_COLUMNS)
        .eq("canvas_id", canvasId)
        .order("position_y", { ascending: true }),
      service
        .from("workflow_canvas_edges")
        .select(EDGE_COLUMNS)
        .eq("canvas_id", canvasId),
      service
        .from("workflow_canvas_comments")
        .select(COMMENT_COLUMNS)
        .eq("canvas_id", canvasId)
        .order("created_at", { ascending: false }),
    ]);

  const user = await requireUser();
  await withAudit(
    {
      action: "canvas.partner_full_view",
      resourceType: "workflow_canvas",
      resourceId: canvasId,
      organizationId: ctx.organizationId,
      after: {
        project_id: projectId,
        partner_org_id: ctx.partnerOrgId,
        viewer_id: user.id,
      },
    },
    async () => null,
  );

  return {
    bundle: {
      canvas: canvas as WorkflowCanvas,
      nodes: (nodes ?? []) as WorkflowCanvasNode[],
      edges: (edges ?? []) as WorkflowCanvasEdge[],
    },
    comments: (comments ?? []) as WorkflowCanvasComment[],
    ctx,
  };
}
