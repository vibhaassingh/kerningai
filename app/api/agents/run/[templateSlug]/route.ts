import { NextResponse, type NextRequest } from "next/server";

import { isAuthorisedCron } from "@/lib/cron/auth";
import { runInference } from "@/lib/agents/inference";
import { SUPABASE_CONFIGURED } from "@/lib/env";
import { createServiceClient } from "@/lib/supabase/service";
import { withSentry } from "@/lib/observability/sentry";

export const runtime = "nodejs";

interface RouteParams {
  params: Promise<{ templateSlug: string }>;
}

/**
 * Triggered run for a single agent template across every client whose
 * `client_settings.modules_enabled` includes the template's module.
 *
 * Phase 4d-late: each run now executes rule-based inference
 * (lib/agents/inference.ts) against live signal and persists fresh
 * `agent_recommendations`. Idempotent — re-running won't duplicate a
 * pending recommendation for the same signal.
 *
 * Authorised either via a CRON_SECRET bearer (scheduler) or by an
 * internal-staff session (manual trigger from /admin).
 */
export async function POST(request: NextRequest, { params }: RouteParams) {
  if (!isAuthorisedCron(request)) {
    return NextResponse.json({ error: "unauthorized" }, { status: 401 });
  }
  if (!SUPABASE_CONFIGURED) {
    return NextResponse.json({ error: "setup_pending" }, { status: 503 });
  }

  const { templateSlug } = await params;

  return withSentry(`agent_run.${templateSlug}`, async () => {
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

    const { data: enabledClients } = await service
      .from("client_settings")
      .select("organization_id, modules_enabled");
    type C = { organization_id: string; modules_enabled: string[] };
    const targets = ((enabledClients ?? []) as C[]).filter(
      (c) => !t.module_slug || c.modules_enabled?.includes(t.module_slug),
    );

    let totalRecs = 0;
    const perClient: { organization_id: string; recommendations: number }[] = [];

    for (const c of targets) {
      const startedAt = new Date().toISOString();

      const { data: run } = await service
        .from("agent_runs")
        .insert({
          organization_id: c.organization_id,
          template_slug: t.slug,
          triggered_by: "cron",
          started_at: startedAt,
          status: "running" as const,
          metadata: { engine: "rule_based" },
        })
        .select("id")
        .single();

      const runId = (run as { id: string } | null)?.id;
      let created = 0;
      let status: "succeeded" | "failed" = "succeeded";

      if (runId) {
        try {
          created = await runInference(
            service,
            c.organization_id,
            t.slug,
            runId,
          );
        } catch (err) {
          status = "failed";
          console.error("[agent_run] inference threw", err, {
            org: c.organization_id,
            template: t.slug,
          });
        }

        await service
          .from("agent_runs")
          .update({
            finished_at: new Date().toISOString(),
            status,
            metadata: { engine: "rule_based", recommendations: created },
          })
          .eq("id", runId);
      }

      totalRecs += created;
      perClient.push({
        organization_id: c.organization_id,
        recommendations: created,
      });
    }

    await service.from("audit_logs").insert({
      actor_id: null,
      organization_id: null,
      action: `cron.agent_run.${templateSlug}`,
      resource_type: "agent_run",
      after: {
        template: t.slug,
        clients_run: targets.length,
        recommendations_created: totalRecs,
      },
    });

    return NextResponse.json({
      ok: true,
      template: t.slug,
      clients_run: targets.length,
      recommendations_created: totalRecs,
      per_client: perClient,
    });
  });
}
