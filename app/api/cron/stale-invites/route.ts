import { NextResponse, type NextRequest } from "next/server";

import { isAuthorisedCron } from "@/lib/cron/auth";
import { SUPABASE_CONFIGURED } from "@/lib/env";
import { createServiceClient } from "@/lib/supabase/service";

export const runtime = "nodejs";

/**
 * Marks pending invites past their `expires_at` as `expired`. Vercel
 * Cron schedules this daily at 03:00 UTC.
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
    .from("invites")
    .update({ status: "expired" })
    .eq("status", "pending")
    .lt("expires_at", nowIso)
    .select("id");

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  await service.from("audit_logs").insert({
    actor_id: null,
    organization_id: null,
    action: "cron.stale_invites_swept",
    resource_type: "invite",
    after: { expired_count: data?.length ?? 0 },
  });

  return NextResponse.json({ ok: true, expired: data?.length ?? 0 });
}
