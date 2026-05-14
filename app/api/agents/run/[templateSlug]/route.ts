import { NextResponse, type NextRequest } from "next/server";

import { isAuthorisedCron } from "@/lib/cron/auth";
import { SUPABASE_CONFIGURED } from "@/lib/env";
import { createServiceClient } from "@/lib/supabase/service";

export const runtime = "nodejs";

interface RouteParams {
  params: Promise<{ templateSlug: string }>;
}

/**
 * Triggered run for a single agent template across every client whose
 * `client_settings.modules_enabled` includes the template's module.
 *
 * Phase 4c stub: the runner records an `agent_runs` row per client +
 * an audit entry, but does not yet produce real recommendations from
 * live signal. That ships in Phase 4d alongside the ingestion
 * pipeline. The endpoint exists today so the cron + manual trigger
 * surfaces compile against a real route.
 *
 * Authorised either via a CRON_SECRET bearer (scheduler) or by an
 * internal-staff session (manual trigger from /admin in 4d).
 */
export async function POST(request: NextRequest, { params }: RouteParams) {
  if (!isAuthorisedCron(request)) {
    return NextResponse.json({ error: "unauthorized" }, { status: 401 });
  }
  if (!SUPABASE_CONFIGURED) {
    return NextResponse.json({ error: "setup_pending" }, { status: 503 });
  }

  const { templateSlug } = await params;
  const service = createServiceClient();

  const { data: template } = await service
    .from("agent_templates")
    .select("slug, name, module_slug")
    .eq("slug", templateSlug)
    .maybeSingle();
  if (!template) {
    return NextResponse.json({ error: "unknown_template" }, { status: 404 });
  }

  type T = { slug: string; name: string; module_slug: string | null };
  const t = template as T;

  // Find every client with the template's module enabled.
  const { data: enabledClients } = await service
    .from("client_settings")
    .select("organization_id, modules_enabled");
  type C = { organization_id: string; modules_enabled: string[] };
  const targets = ((enabledClients ?? []) as C[]).filter(
    (c) => !t.module_slug || c.modules_enabled?.includes(t.module_slug),
  );

  const startedAt = new Date().toISOString();
  const finishedAt = new Date().toISOString();

  // Insert one agent_run per target client.
  if (targets.length > 0) {
    await service.from("agent_runs").insert(
      targets.map((c) => ({
        organization_id: c.organization_id,
        template_slug: t.slug,
        triggered_by: "cron",
        started_at: startedAt,
        finished_at: finishedAt,
        status: "succeeded" as const,
        metadata: { stub: true, note: "Phase 4c run-stub; full inference in Phase 4d." },
      })),
    );
  }

  await service.from("audit_logs").insert({
    actor_id: null,
    organization_id: null,
    action: `cron.agent_run.${templateSlug}`,
    resource_type: "agent_run",
    after: {
      template: t.slug,
      clients_run: targets.length,
    },
  });

  return NextResponse.json({
    ok: true,
    template: t.slug,
    clients_run: targets.length,
  });
}
