import "server-only";

import { createClient } from "@/lib/supabase/server";

export interface AuditRunRow {
  id: string;
  name: string;
  framework_slug: string | null;
  framework_name: string | null;
  scheduled_for: string;
  status: string;
  score: number | null;
  completed_at: string | null;
  site_name: string | null;
}

export interface CorrectiveAction {
  id: string;
  title: string;
  description: string | null;
  status: string;
  due_at: string | null;
  closed_at: string | null;
  site_name: string | null;
}

export interface Incident {
  id: string;
  occurred_at: string;
  category: string;
  severity: string;
  title: string;
  description: string | null;
  status: string;
  site_name: string | null;
}

export interface TemperatureLogRow {
  id: string;
  recorded_at: string;
  temperature_c: number;
  setpoint_c: number | null;
  in_envelope: boolean;
  asset_name: string | null;
  site_name: string | null;
}

export async function getComplianceOverview(organizationId: string): Promise<{
  upcoming: AuditRunRow[];
  recent: AuditRunRow[];
  actions: CorrectiveAction[];
  incidents: Incident[];
  temperatureLogs: TemperatureLogRow[];
  readinessScore: number;
}> {
  const supabase = await createClient();

  const [{ data: audits }, { data: actions }, { data: incidents }, { data: temps }] =
    await Promise.all([
      supabase
        .from("audit_runs")
        .select(
          "id, name, framework_slug, scheduled_for, status, score, completed_at, framework:compliance_frameworks(name), site:sites(name)",
        )
        .eq("organization_id", organizationId)
        .order("scheduled_for", { ascending: false })
        .limit(50),
      supabase
        .from("corrective_actions")
        .select(
          "id, title, description, status, due_at, closed_at, site:sites(name)",
        )
        .eq("organization_id", organizationId)
        .order("status")
        .order("due_at", { ascending: true, nullsFirst: false })
        .limit(50),
      supabase
        .from("incidents")
        .select(
          "id, occurred_at, category, severity, title, description, status, site:sites(name)",
        )
        .eq("organization_id", organizationId)
        .order("occurred_at", { ascending: false })
        .limit(30),
      supabase
        .from("temperature_logs")
        .select(
          "id, recorded_at, temperature_c, setpoint_c, in_envelope, asset:assets(name), site:sites(name)",
        )
        .eq("organization_id", organizationId)
        .order("recorded_at", { ascending: false })
        .limit(20),
    ]);

  type AuditRow = {
    id: string;
    name: string;
    framework_slug: string | null;
    scheduled_for: string;
    status: string;
    score: number | null;
    completed_at: string | null;
    framework: { name: string } | null;
    site: { name: string } | null;
  };

  type CARow = {
    id: string;
    title: string;
    description: string | null;
    status: string;
    due_at: string | null;
    closed_at: string | null;
    site: { name: string } | null;
  };
  type IncRow = {
    id: string;
    occurred_at: string;
    category: string;
    severity: string;
    title: string;
    description: string | null;
    status: string;
    site: { name: string } | null;
  };
  type TempRow = {
    id: string;
    recorded_at: string;
    temperature_c: number;
    setpoint_c: number | null;
    in_envelope: boolean;
    asset: { name: string } | null;
    site: { name: string } | null;
  };

  const auditRows = ((audits ?? []) as unknown as AuditRow[]).map((a) => ({
    id: a.id,
    name: a.name,
    framework_slug: a.framework_slug,
    framework_name: a.framework?.name ?? null,
    scheduled_for: a.scheduled_for,
    status: a.status,
    score: a.score,
    completed_at: a.completed_at,
    site_name: a.site?.name ?? null,
  })) as AuditRunRow[];

  const today = new Date();
  const upcoming = auditRows.filter((a) => new Date(a.scheduled_for) >= today);
  const recent = auditRows.filter((a) => new Date(a.scheduled_for) < today);

  const actionRows: CorrectiveAction[] = ((actions ?? []) as unknown as CARow[]).map(
    (r) => ({
      id: r.id,
      title: r.title,
      description: r.description,
      status: r.status,
      due_at: r.due_at,
      closed_at: r.closed_at,
      site_name: r.site?.name ?? null,
    }),
  );

  const incRows: Incident[] = ((incidents ?? []) as unknown as IncRow[]).map((r) => ({
    id: r.id,
    occurred_at: r.occurred_at,
    category: r.category,
    severity: r.severity,
    title: r.title,
    description: r.description,
    status: r.status,
    site_name: r.site?.name ?? null,
  }));

  const tempRows: TemperatureLogRow[] = ((temps ?? []) as unknown as TempRow[]).map(
    (r) => ({
      id: r.id,
      recorded_at: r.recorded_at,
      temperature_c: Number(r.temperature_c),
      setpoint_c: r.setpoint_c != null ? Number(r.setpoint_c) : null,
      in_envelope: r.in_envelope,
      asset_name: r.asset?.name ?? null,
      site_name: r.site?.name ?? null,
    }),
  );

  // Readiness score: 100 minus penalty for open actions + flagged audits.
  const flaggedAudits = auditRows.filter((a) => a.status === "flagged").length;
  const openActions = actionRows.filter((a) => a.status !== "closed").length;
  const openIncidents = incRows.filter((i) => i.status !== "closed").length;
  const readinessScore = Math.max(
    0,
    100 - flaggedAudits * 6 - openActions * 3 - openIncidents * 4,
  );

  return {
    upcoming,
    recent,
    actions: actionRows,
    incidents: incRows,
    temperatureLogs: tempRows,
    readinessScore,
  };
}
