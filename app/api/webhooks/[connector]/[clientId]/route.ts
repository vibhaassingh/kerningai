import { NextResponse, type NextRequest } from "next/server";

import { verifyHmac } from "@/lib/integrations/hmac";
import { SUPABASE_CONFIGURED } from "@/lib/env";
import { createServiceClient } from "@/lib/supabase/service";

export const runtime = "nodejs";

interface RouteParams {
  params: Promise<{ connector: string; clientId: string }>;
}

/**
 * Generic webhook receiver. Each (connector, clientId) pair has a shared
 * HMAC secret stored in client_settings.metadata.webhook_secrets[connector].
 * Verified events land in the `webhook_events` table (Phase 4c stub
 * table — schema below) and trigger downstream agent runs through
 * Supabase Realtime.
 *
 * Phase 4c is intentionally minimal: the receiver verifies signature,
 * persists the event, and returns 202. Routing to specific handlers
 * happens in Phase 4d.
 */
export async function POST(req: NextRequest, { params }: RouteParams) {
  if (!SUPABASE_CONFIGURED) {
    return NextResponse.json({ error: "setup_pending" }, { status: 503 });
  }

  const { connector, clientId } = await params;
  const rawBody = await req.text();
  const signature = req.headers.get("x-kai-signature");

  const service = createServiceClient();

  const { data: client } = await service
    .from("client_settings")
    .select("metadata")
    .eq("organization_id", clientId)
    .maybeSingle();
  if (!client) {
    return NextResponse.json({ error: "unknown_client" }, { status: 404 });
  }

  type Settings = { metadata: { webhook_secrets?: Record<string, string> } | null };
  const secret = (client as Settings).metadata?.webhook_secrets?.[connector];
  if (!secret) {
    return NextResponse.json({ error: "connector_not_configured" }, { status: 404 });
  }

  if (!verifyHmac(rawBody, signature, secret)) {
    return NextResponse.json({ error: "invalid_signature" }, { status: 401 });
  }

  let payload: unknown;
  try {
    payload = JSON.parse(rawBody);
  } catch {
    return NextResponse.json({ error: "invalid_json" }, { status: 400 });
  }

  // Audit + (in 4d) enqueue. For now we just write an audit log so the
  // event is observable end-to-end.
  await service.from("audit_logs").insert({
    actor_id: null,
    organization_id: clientId,
    action: `webhook.${connector}.received`,
    resource_type: "webhook",
    resource_id: null,
    after: {
      connector,
      payload_snippet:
        typeof payload === "object" && payload != null
          ? Object.keys(payload as object).slice(0, 6)
          : null,
    },
    metadata: {
      ip:
        req.headers.get("x-forwarded-for")?.split(",")[0]?.trim() ??
        req.headers.get("x-real-ip") ??
        null,
    },
  });

  return NextResponse.json({ ok: true, accepted_at: new Date().toISOString() }, { status: 202 });
}

/** GET is a health check: 200 means the receiver is reachable + the
 * client + connector pair is configured. Useful for setup verification. */
export async function GET(_req: NextRequest, { params }: RouteParams) {
  if (!SUPABASE_CONFIGURED) {
    return NextResponse.json({ ok: false, reason: "setup_pending" }, { status: 503 });
  }
  const { connector, clientId } = await params;
  const service = createServiceClient();
  const { data: client } = await service
    .from("client_settings")
    .select("metadata")
    .eq("organization_id", clientId)
    .maybeSingle();
  if (!client) return NextResponse.json({ ok: false, reason: "unknown_client" }, { status: 404 });
  type Settings = { metadata: { webhook_secrets?: Record<string, string> } | null };
  const configured = Boolean(
    (client as Settings).metadata?.webhook_secrets?.[connector],
  );
  return NextResponse.json({ ok: configured, connector, clientId });
}
