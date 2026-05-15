"use server";

import { revalidatePath } from "next/cache";
import { z } from "zod";

import type { ActionResult } from "@/lib/auth/actions";
import { hasPermissionAny, requirePermission, requireUser } from "@/lib/auth/require";
import { withAudit } from "@/lib/audit/with-audit";
import { createServiceClient } from "@/lib/supabase/service";
import type {
  CanvasEdgeType,
  CanvasNodeType,
  CanvasVisibility,
  WorkflowCanvasEdge,
  WorkflowCanvasNode,
} from "@/lib/workflow-canvas/types";

// ---------------------------------------------------------------------------
// Schemas
// ---------------------------------------------------------------------------
const visibilityEnum = z.enum([
  "internal_only",
  "partner_visible",
  "client_visible",
  "shared_all",
]);

const phaseEnum = z.enum([
  "current_manual",
  "proposed_erp",
  "erp_ai",
  "module_mapping",
]);

const nodeTypeEnum = z.enum([
  "process",
  "approval",
  "document",
  "data",
  "pain_point",
  "ai",
  "erp_module",
  "decision",
  "external_actor",
  "system",
]);

const edgeTypeEnum = z.enum([
  "normal",
  "approval",
  "document_flow",
  "data_flow",
  "exception",
  "ai_assisted",
  "system_automation",
]);

const departmentEnum = z.enum([
  "management",
  "accounts",
  "commercial",
  "sales",
  "depot_godown",
  "head_office",
  "driver_transporter",
  "partner",
  "client",
  "system",
  "ai_layer",
]);

const nodeSchema = z.object({
  node_key: z.string().min(1),
  node_type: nodeTypeEnum,
  phase: phaseEnum,
  department: departmentEnum.nullable().optional(),
  visibility: visibilityEnum,
  title: z.string().min(1),
  short_label: z.string().nullable().optional(),
  description: z.string().nullable().optional(),
  actors: z.array(z.string()).optional(),
  current_process: z.string().nullable().optional(),
  proposed_process: z.string().nullable().optional(),
  ai_opportunity: z.string().nullable().optional(),
  pain_points: z.array(z.string()).optional(),
  erp_modules: z.array(z.string()).optional(),
  documents: z.array(z.string()).optional(),
  data_captured: z.array(z.string()).optional(),
  risk_level: z.enum(["low", "medium", "high"]).nullable().optional(),
  automation_potential: z.enum(["low", "medium", "high"]).nullable().optional(),
  internal_notes: z.string().nullable().optional(),
  client_notes: z.string().nullable().optional(),
  position_x: z.number(),
  position_y: z.number(),
});

const edgeSchema = z.object({
  edge_key: z.string().min(1),
  source_node_key: z.string().min(1),
  target_node_key: z.string().min(1),
  edge_type: edgeTypeEnum,
  phase: phaseEnum,
  visibility: visibilityEnum,
  label: z.string().nullable().optional(),
  condition: z.string().nullable().optional(),
});

const viewportSchema = z.object({
  x: z.number(),
  y: z.number(),
  zoom: z.number(),
});

// ---------------------------------------------------------------------------
// createCanvas
// ---------------------------------------------------------------------------
const createCanvasSchema = z.object({
  organizationId: z.string().uuid(),
  projectId: z.string().uuid(),
  title: z.string().min(2).max(200),
  subtitle: z.string().optional(),
  canvasType: z.enum([
    "current_manual",
    "proposed_erp",
    "erp_ai",
    "combined",
    "module_mapping",
  ]),
  templateSlug: z.string().optional(),
});

export async function createCanvas(
  _prev: ActionResult<{ canvasId: string }> | undefined,
  formData: FormData,
): Promise<ActionResult<{ canvasId: string }>> {
  const parsed = createCanvasSchema.safeParse({
    organizationId: formData.get("organizationId"),
    projectId: formData.get("projectId"),
    title: formData.get("title"),
    subtitle: formData.get("subtitle") || undefined,
    canvasType: formData.get("canvasType"),
    templateSlug: formData.get("templateSlug") || undefined,
  });
  if (!parsed.success) {
    return { ok: false, error: parsed.error.issues[0].message };
  }

  try {
    await requirePermission("manage_workflow_canvas", parsed.data.organizationId);
  } catch {
    return { ok: false, error: "Not permitted." };
  }

  const user = await requireUser();
  const service = createServiceClient();

  const { data, error } = await service
    .from("workflow_canvases")
    .insert({
      organization_id: parsed.data.organizationId,
      project_id: parsed.data.projectId,
      title: parsed.data.title,
      subtitle: parsed.data.subtitle ?? null,
      canvas_type: parsed.data.canvasType,
      template_slug: parsed.data.templateSlug ?? null,
      status: "draft",
      visibility: "internal_only",
      created_by_id: user.id,
      updated_by_id: user.id,
    })
    .select("id")
    .single();
  if (error || !data) {
    return { ok: false, error: error?.message ?? "Could not create canvas." };
  }

  await withAudit(
    {
      action: "canvas.created",
      resourceType: "workflow_canvas",
      resourceId: data.id,
      organizationId: parsed.data.organizationId,
      after: { title: parsed.data.title, canvas_type: parsed.data.canvasType },
    },
    async () => null,
  );

  revalidatePath(
    `/admin/clients/${parsed.data.organizationId}/projects/${parsed.data.projectId}/workflow-canvas`,
  );
  return { ok: true, data: { canvasId: data.id } };
}

// ---------------------------------------------------------------------------
// saveCanvas — full snapshot replace (autosave pathway)
// ---------------------------------------------------------------------------
const saveCanvasSchema = z.object({
  canvasId: z.string().uuid(),
  organizationId: z.string().uuid(),
  projectId: z.string().uuid(),
  viewport: viewportSchema,
  nodes: z.array(nodeSchema),
  edges: z.array(edgeSchema),
});

export interface SaveCanvasInput {
  canvasId: string;
  organizationId: string;
  projectId: string;
  viewport: { x: number; y: number; zoom: number };
  nodes: Array<Omit<WorkflowCanvasNode, "id" | "canvas_id" | "metadata"> & { metadata?: Record<string, unknown> }>;
  edges: Array<Omit<WorkflowCanvasEdge, "id" | "canvas_id" | "metadata"> & { metadata?: Record<string, unknown> }>;
}

export async function saveCanvas(
  input: SaveCanvasInput,
): Promise<ActionResult<{ savedAt: string }>> {
  const parsed = saveCanvasSchema.safeParse(input);
  if (!parsed.success) {
    return { ok: false, error: parsed.error.issues[0].message };
  }

  try {
    await requirePermission("manage_workflow_canvas", parsed.data.organizationId);
  } catch {
    return { ok: false, error: "Not permitted." };
  }
  const user = await requireUser();
  const service = createServiceClient();

  const now = new Date().toISOString();

  // 1. Update canvas viewport + version + updated_by
  const { error: cvError } = await service
    .from("workflow_canvases")
    .update({
      viewport: parsed.data.viewport,
      updated_by_id: user.id,
      updated_at: now,
    })
    .eq("id", parsed.data.canvasId);
  if (cvError) return { ok: false, error: cvError.message };

  // 2. Replace nodes (delete-all-then-insert is simplest for autosave).
  await service
    .from("workflow_canvas_nodes")
    .delete()
    .eq("canvas_id", parsed.data.canvasId);

  if (parsed.data.nodes.length > 0) {
    const { error: nError } = await service
      .from("workflow_canvas_nodes")
      .insert(
        parsed.data.nodes.map((n) => ({
          canvas_id: parsed.data.canvasId,
          node_key: n.node_key,
          node_type: n.node_type,
          phase: n.phase,
          department: n.department ?? null,
          visibility: n.visibility,
          title: n.title,
          short_label: n.short_label ?? null,
          description: n.description ?? null,
          actors: n.actors ?? [],
          current_process: n.current_process ?? null,
          proposed_process: n.proposed_process ?? null,
          ai_opportunity: n.ai_opportunity ?? null,
          pain_points: n.pain_points ?? [],
          erp_modules: n.erp_modules ?? [],
          documents: n.documents ?? [],
          data_captured: n.data_captured ?? [],
          risk_level: n.risk_level ?? null,
          automation_potential: n.automation_potential ?? null,
          internal_notes: n.internal_notes ?? null,
          client_notes: n.client_notes ?? null,
          position_x: n.position_x,
          position_y: n.position_y,
        })),
      );
    if (nError) return { ok: false, error: nError.message };
  }

  // 3. Replace edges
  await service
    .from("workflow_canvas_edges")
    .delete()
    .eq("canvas_id", parsed.data.canvasId);

  if (parsed.data.edges.length > 0) {
    const { error: eError } = await service
      .from("workflow_canvas_edges")
      .insert(
        parsed.data.edges.map((e) => ({
          canvas_id: parsed.data.canvasId,
          edge_key: e.edge_key,
          source_node_key: e.source_node_key,
          target_node_key: e.target_node_key,
          edge_type: e.edge_type,
          phase: e.phase,
          visibility: e.visibility,
          label: e.label ?? null,
          condition: e.condition ?? null,
        })),
      );
    if (eError) return { ok: false, error: eError.message };
  }

  await withAudit(
    {
      action: "canvas.saved",
      resourceType: "workflow_canvas",
      resourceId: parsed.data.canvasId,
      organizationId: parsed.data.organizationId,
      after: {
        nodes: parsed.data.nodes.length,
        edges: parsed.data.edges.length,
      },
    },
    async () => null,
  );

  revalidatePath(
    `/admin/clients/${parsed.data.organizationId}/projects/${parsed.data.projectId}/workflow-canvas/${parsed.data.canvasId}`,
  );
  return { ok: true, data: { savedAt: now } };
}

// ---------------------------------------------------------------------------
// shareWithClient / shareWithPartner
// ---------------------------------------------------------------------------
const shareSchema = z.object({
  canvasId: z.string().uuid(),
  organizationId: z.string().uuid(),
  projectId: z.string().uuid(),
});

async function setVisibility(
  input: z.infer<typeof shareSchema>,
  audience: "client" | "partner",
): Promise<ActionResult> {
  if (!(await hasPermissionAny("share_workflow_canvas"))) {
    return { ok: false, error: "Not permitted to share canvases." };
  }
  const service = createServiceClient();

  const { data: cur } = await service
    .from("workflow_canvases")
    .select("visibility, status")
    .eq("id", input.canvasId)
    .maybeSingle();
  if (!cur) return { ok: false, error: "Canvas not found." };

  // Visibility upgrade lattice — never narrow except via explicit revoke.
  const visibility: CanvasVisibility =
    cur.visibility === "shared_all"
      ? "shared_all"
      : audience === "client"
        ? cur.visibility === "partner_visible"
          ? "shared_all"
          : "client_visible"
        : cur.visibility === "client_visible"
          ? "shared_all"
          : "partner_visible";

  const status =
    audience === "client"
      ? cur.status === "approved"
        ? "approved"
        : "shared_with_client"
      : cur.status === "approved"
        ? "approved"
        : cur.status;

  const sharedAtCol =
    audience === "client" ? "shared_with_client_at" : "shared_with_partner_at";

  const { error } = await service
    .from("workflow_canvases")
    .update({
      visibility,
      status,
      [sharedAtCol]: new Date().toISOString(),
    })
    .eq("id", input.canvasId);
  if (error) return { ok: false, error: error.message };

  await withAudit(
    {
      action:
        audience === "client"
          ? "canvas.shared_with_client"
          : "canvas.shared_with_partner",
      resourceType: "workflow_canvas",
      resourceId: input.canvasId,
      organizationId: input.organizationId,
      after: { visibility, status },
    },
    async () => null,
  );

  revalidatePath(
    `/admin/clients/${input.organizationId}/projects/${input.projectId}/workflow-canvas/${input.canvasId}`,
  );
  if (audience === "client") {
    revalidatePath(`/portal/projects/${input.projectId}/workflow-canvas/${input.canvasId}`);
  } else {
    revalidatePath(`/partner/projects/${input.projectId}/workflow-summary`);
  }
  return { ok: true };
}

export async function shareCanvasWithClient(
  _prev: ActionResult | undefined,
  formData: FormData,
): Promise<ActionResult> {
  const parsed = shareSchema.safeParse({
    canvasId: formData.get("canvasId"),
    organizationId: formData.get("organizationId"),
    projectId: formData.get("projectId"),
  });
  if (!parsed.success) return { ok: false, error: parsed.error.issues[0].message };
  return setVisibility(parsed.data, "client");
}

export async function shareCanvasWithPartner(
  _prev: ActionResult | undefined,
  formData: FormData,
): Promise<ActionResult> {
  const parsed = shareSchema.safeParse({
    canvasId: formData.get("canvasId"),
    organizationId: formData.get("organizationId"),
    projectId: formData.get("projectId"),
  });
  if (!parsed.success) return { ok: false, error: parsed.error.issues[0].message };
  return setVisibility(parsed.data, "partner");
}

// ---------------------------------------------------------------------------
// saveAsVersion — snapshot the current canvas state into the versions table
// ---------------------------------------------------------------------------
const saveVersionSchema = z.object({
  canvasId: z.string().uuid(),
  organizationId: z.string().uuid(),
  title: z.string().min(2).max(200),
  changeSummary: z.string().optional(),
});

export async function saveCanvasVersion(
  _prev: ActionResult<{ version: number }> | undefined,
  formData: FormData,
): Promise<ActionResult<{ version: number }>> {
  const parsed = saveVersionSchema.safeParse({
    canvasId: formData.get("canvasId"),
    organizationId: formData.get("organizationId"),
    title: formData.get("title"),
    changeSummary: formData.get("changeSummary") || undefined,
  });
  if (!parsed.success) return { ok: false, error: parsed.error.issues[0].message };

  if (!(await hasPermissionAny("manage_workflow_versions"))) {
    return { ok: false, error: "Not permitted to manage versions." };
  }
  const user = await requireUser();
  const service = createServiceClient();

  // Snapshot current state.
  const [{ data: nodes }, { data: edges }, { data: canvas }] = await Promise.all([
    service.from("workflow_canvas_nodes").select("*").eq("canvas_id", parsed.data.canvasId),
    service.from("workflow_canvas_edges").select("*").eq("canvas_id", parsed.data.canvasId),
    service.from("workflow_canvases").select("viewport, version").eq("id", parsed.data.canvasId).maybeSingle(),
  ]);
  if (!canvas) return { ok: false, error: "Canvas not found." };

  const nextVersion = (canvas.version ?? 1) + 1;
  const snapshot = {
    nodes: nodes ?? [],
    edges: edges ?? [],
    viewport: canvas.viewport,
  };

  const { error: vError } = await service.from("workflow_canvas_versions").insert({
    canvas_id: parsed.data.canvasId,
    version: nextVersion,
    title: parsed.data.title,
    snapshot,
    change_summary: parsed.data.changeSummary ?? null,
    created_by_id: user.id,
  });
  if (vError) return { ok: false, error: vError.message };

  await service
    .from("workflow_canvases")
    .update({ version: nextVersion, updated_by_id: user.id })
    .eq("id", parsed.data.canvasId);

  await withAudit(
    {
      action: "canvas.version_saved",
      resourceType: "workflow_canvas",
      resourceId: parsed.data.canvasId,
      organizationId: parsed.data.organizationId,
      after: { version: nextVersion, title: parsed.data.title },
    },
    async () => null,
  );

  return { ok: true, data: { version: nextVersion } };
}

// ---------------------------------------------------------------------------
// duplicateCanvas
// ---------------------------------------------------------------------------
const duplicateSchema = z.object({
  canvasId: z.string().uuid(),
  organizationId: z.string().uuid(),
  projectId: z.string().uuid(),
  newTitle: z.string().min(2).max(200),
});

export async function duplicateCanvas(
  _prev: ActionResult<{ canvasId: string }> | undefined,
  formData: FormData,
): Promise<ActionResult<{ canvasId: string }>> {
  const parsed = duplicateSchema.safeParse({
    canvasId: formData.get("canvasId"),
    organizationId: formData.get("organizationId"),
    projectId: formData.get("projectId"),
    newTitle: formData.get("newTitle"),
  });
  if (!parsed.success) return { ok: false, error: parsed.error.issues[0].message };

  try {
    await requirePermission("manage_workflow_canvas", parsed.data.organizationId);
  } catch {
    return { ok: false, error: "Not permitted." };
  }
  const user = await requireUser();
  const service = createServiceClient();

  const { data: src } = await service
    .from("workflow_canvases")
    .select("*")
    .eq("id", parsed.data.canvasId)
    .maybeSingle();
  if (!src) return { ok: false, error: "Source canvas not found." };

  const { data: created, error: cError } = await service
    .from("workflow_canvases")
    .insert({
      organization_id: parsed.data.organizationId,
      project_id: parsed.data.projectId,
      blueprint_id: src.blueprint_id,
      template_slug: src.template_slug,
      title: parsed.data.newTitle,
      subtitle: src.subtitle,
      description: src.description,
      canvas_type: src.canvas_type,
      status: "draft",
      visibility: "internal_only",
      viewport: src.viewport,
      created_by_id: user.id,
      updated_by_id: user.id,
    })
    .select("id")
    .single();
  if (cError || !created) {
    return { ok: false, error: cError?.message ?? "Could not duplicate canvas." };
  }

  // Copy nodes
  const { data: srcNodes } = await service
    .from("workflow_canvas_nodes")
    .select("*")
    .eq("canvas_id", parsed.data.canvasId);
  if (srcNodes && srcNodes.length > 0) {
    type NodeRow = Record<string, unknown>;
    const rows = (srcNodes as NodeRow[]).map((n) => {
      const copy = { ...n };
      delete copy.id;
      delete copy.created_at;
      delete copy.updated_at;
      copy.canvas_id = created.id;
      return copy;
    });
    await service.from("workflow_canvas_nodes").insert(rows);
  }

  // Copy edges
  const { data: srcEdges } = await service
    .from("workflow_canvas_edges")
    .select("*")
    .eq("canvas_id", parsed.data.canvasId);
  if (srcEdges && srcEdges.length > 0) {
    type EdgeRow = Record<string, unknown>;
    const rows = (srcEdges as EdgeRow[]).map((e) => {
      const copy = { ...e };
      delete copy.id;
      delete copy.created_at;
      copy.canvas_id = created.id;
      return copy;
    });
    await service.from("workflow_canvas_edges").insert(rows);
  }

  await withAudit(
    {
      action: "canvas.duplicated",
      resourceType: "workflow_canvas",
      resourceId: created.id,
      organizationId: parsed.data.organizationId,
      after: { source_canvas_id: parsed.data.canvasId, title: parsed.data.newTitle },
    },
    async () => null,
  );

  revalidatePath(
    `/admin/clients/${parsed.data.organizationId}/projects/${parsed.data.projectId}/workflow-canvas`,
  );
  return { ok: true, data: { canvasId: created.id } };
}

// Re-export types referenced in inputs for callers
export type { CanvasNodeType, CanvasEdgeType, CanvasVisibility };
