import { NextResponse, type NextRequest } from "next/server";

import { isAuthorisedCron } from "@/lib/cron/auth";
import { SUPABASE_CONFIGURED } from "@/lib/env";
import { createServiceClient } from "@/lib/supabase/service";

export const runtime = "nodejs";

/**
 * Marks pending agent recommendations past their `expires_at` as
 * `expired`, so the inbox doesn't fill with stale items. Hourly cron.
 */
export async function GET(request: NextRequest) {
  if (!isAuthorisedCron(request)) {
    return NextResponse.json({ error: "unauthorized" }, { status: 401 });
  }
  if (!SUPABASE_CONFIGURED) {
    return NextResponse.json({ error: "setup_pending" }, { status: 503 });
  }

  const service = createServiceClient();
  const nowIso = new Date().toISOString();

  const { data, error } = await service
    .from("agent_recommendations")
    .update({ status: "expired", decided_at: nowIso })
    .eq("status", "pending")
    .lt("expires_at", nowIso)
    .select("id, organization_id");

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  for (const r of (data ?? []) as { id: string; organization_id: string }[]) {
    await service.from("agent_actions").insert({
      organization_id: r.organization_id,
      recommendation_id: r.id,
      kind: "rejected",
      reason: "Expired without decision.",
      payload: { auto: true, reason: "expired" },
    });
  }

  return NextResponse.json({ ok: true, expired: data?.length ?? 0 });
}
