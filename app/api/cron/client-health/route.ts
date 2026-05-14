import { NextResponse, type NextRequest } from "next/server";

import { isAuthorisedCron } from "@/lib/cron/auth";
import { SUPABASE_CONFIGURED } from "@/lib/env";
import { createServiceClient } from "@/lib/supabase/service";

export const runtime = "nodejs";

/**
 * Recomputes a basic health score per client based on:
 *   * pending agent approvals (more pending → score down)
 *   * open compliance corrective actions (more open → score down)
 *   * proportion of healthy assets (more healthy → score up)
 *
 * Daily cron at 05:00 UTC. Phase 4d swaps in the full model that
 * also weighs CSAT, NPS, and renewal-likelihood signals.
 */
export async function GET(request: NextRequest) {
  if (!isAuthorisedCron(request)) {
    return NextResponse.json({ error: "unauthorized" }, { status: 401 });
  }
  if (!SUPABASE_CONFIGURED) {
    return NextResponse.json({ error: "setup_pending" }, { status: 503 });
  }

  const service = createServiceClient();

  const { data: clients } = await service
    .from("client_settings")
    .select("organization_id");
  if (!clients) return NextResponse.json({ ok: true, updated: 0 });

  let updated = 0;
  for (const c of clients as { organization_id: string }[]) {
    const orgId = c.organization_id;

    const [{ count: pendingApprovals }, { count: openActions }, { data: assets }] =
      await Promise.all([
        service
          .from("agent_recommendations")
          .select("id", { count: "exact", head: true })
          .eq("organization_id", orgId)
          .eq("status", "pending"),
        service
          .from("corrective_actions")
          .select("id", { count: "exact", head: true })
          .eq("organization_id", orgId)
          .neq("status", "closed"),
        service.from("assets").select("status").eq("organization_id", orgId),
      ]);

    const total = (assets ?? []).length;
    const healthy = (assets ?? []).filter(
      (a) => (a as { status: string }).status === "healthy",
    ).length;
    const healthyPct = total === 0 ? 1 : healthy / total;

    let score = Math.round(80 + healthyPct * 20);
    score -= Math.min(20, (pendingApprovals ?? 0) * 2);
    score -= Math.min(20, (openActions ?? 0) * 3);
    score = Math.max(0, Math.min(100, score));

    const { error } = await service
      .from("client_settings")
      .update({ health_score: score })
      .eq("organization_id", orgId);
    if (!error) updated += 1;
  }

  await service.from("audit_logs").insert({
    actor_id: null,
    organization_id: null,
    action: "cron.client_health_recomputed",
    resource_type: "client_settings",
    after: { clients_updated: updated },
  });

  return NextResponse.json({ ok: true, updated });
}
