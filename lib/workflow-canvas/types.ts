/**
 * Canonical types for the Workflow Canvas feature. Mirror the enums in
 * migration 0020_workflow_canvas.sql.
 */

export type CanvasVisibility =
  | "internal_only"
  | "partner_visible"
  | "client_visible"
  | "shared_all";

export type CanvasStatus =
  | "draft"
  | "internal_review"
  | "client_ready"
  | "shared_with_client"
  | "approved"
  | "archived";

export type CanvasType =
  | "current_manual"
  | "proposed_erp"
  | "erp_ai"
  | "combined"
  | "module_mapping";

export type CanvasNodeType =
  | "process"
  | "approval"
  | "document"
  | "data"
  | "pain_point"
  | "ai"
  | "erp_module"
  | "decision"
  | "external_actor"
  | "system";

export type CanvasNodePhase =
  | "current_manual"
  | "proposed_erp"
  | "erp_ai"
  | "module_mapping";

export type CanvasDepartment =
  | "management"
  | "accounts"
  | "commercial"
  | "sales"
  | "depot_godown"
  | "head_office"
  | "driver_transporter"
  | "partner"
  | "client"
  | "system"
  | "ai_layer";

export type CanvasEdgeType =
  | "normal"
  | "approval"
  | "document_flow"
  | "data_flow"
  | "exception"
  | "ai_assisted"
  | "system_automation";

export type CanvasAudience = "admin" | "client" | "partner";

export type RiskLevel = "low" | "medium" | "high";
export type AutomationPotential = "low" | "medium" | "high";

export interface WorkflowCanvasNode {
  id: string;
  canvas_id: string;
  node_key: string;
  node_type: CanvasNodeType;
  phase: CanvasNodePhase;
  department: CanvasDepartment | null;
  visibility: CanvasVisibility;
  title: string;
  short_label: string | null;
  description: string | null;
  actors: string[];
  current_process: string | null;
  proposed_process: string | null;
  ai_opportunity: string | null;
  pain_points: string[];
  erp_modules: string[];
  documents: string[];
  data_captured: string[];
  risk_level: RiskLevel | null;
  automation_potential: AutomationPotential | null;
  internal_notes: string | null;
  client_notes: string | null;
  position_x: number;
  position_y: number;
  metadata: Record<string, unknown>;
}

export interface WorkflowCanvasEdge {
  id: string;
  canvas_id: string;
  edge_key: string;
  source_node_key: string;
  target_node_key: string;
  edge_type: CanvasEdgeType;
  phase: CanvasNodePhase;
  visibility: CanvasVisibility;
  label: string | null;
  condition: string | null;
  metadata: Record<string, unknown>;
}

export interface WorkflowCanvasViewport {
  x: number;
  y: number;
  zoom: number;
}

export interface WorkflowCanvas {
  id: string;
  organization_id: string;
  project_id: string;
  blueprint_id: string | null;
  template_slug: string | null;
  title: string;
  subtitle: string | null;
  description: string | null;
  canvas_type: CanvasType;
  status: CanvasStatus;
  visibility: CanvasVisibility;
  viewport: WorkflowCanvasViewport;
  version: number;
  badges: string[];
  created_by_id: string | null;
  updated_by_id: string | null;
  shared_with_client_at: string | null;
  shared_with_partner_at: string | null;
  created_at: string;
  updated_at: string;
  metadata: Record<string, unknown>;
}

export interface WorkflowCanvasComment {
  id: string;
  canvas_id: string;
  node_key: string | null;
  edge_key: string | null;
  user_id: string;
  body: string;
  visibility: CanvasVisibility;
  status: "open" | "resolved";
  created_at: string;
  updated_at: string;
}

export interface WorkflowCanvasVersion {
  id: string;
  canvas_id: string;
  version: number;
  title: string;
  snapshot: {
    nodes: WorkflowCanvasNode[];
    edges: WorkflowCanvasEdge[];
    viewport: WorkflowCanvasViewport;
  };
  change_summary: string | null;
  created_by_id: string | null;
  created_at: string;
}

export interface WorkflowCanvasBundle {
  canvas: WorkflowCanvas;
  nodes: WorkflowCanvasNode[];
  edges: WorkflowCanvasEdge[];
}

/**
 * Seed-time / template-time shape — IDs are not yet assigned.
 */
export interface CanvasNodeSeed {
  node_key: string;
  node_type: CanvasNodeType;
  phase: CanvasNodePhase;
  department?: CanvasDepartment;
  visibility?: CanvasVisibility;
  title: string;
  short_label?: string;
  description?: string;
  actors?: string[];
  current_process?: string;
  proposed_process?: string;
  ai_opportunity?: string;
  pain_points?: string[];
  erp_modules?: string[];
  documents?: string[];
  data_captured?: string[];
  risk_level?: RiskLevel;
  automation_potential?: AutomationPotential;
  internal_notes?: string;
  client_notes?: string;
  position_x: number;
  position_y: number;
}

export interface CanvasEdgeSeed {
  edge_key: string;
  source_node_key: string;
  target_node_key: string;
  edge_type?: CanvasEdgeType;
  phase: CanvasNodePhase;
  visibility?: CanvasVisibility;
  label?: string;
  condition?: string;
}

export interface CanvasTemplateSeed {
  slug: string;
  title: string;
  subtitle?: string;
  canvas_type: CanvasType;
  badges?: string[];
  nodes: CanvasNodeSeed[];
  edges: CanvasEdgeSeed[];
}
