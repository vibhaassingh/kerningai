import "server-only";

import { createClient } from "@/lib/supabase/server";
import { createServiceClient } from "@/lib/supabase/service";

export interface AuditContext {
  action: string;
  resourceType: string;
  resourceId?: string;
  organizationId?: string;
  before?: unknown;
  after?: unknown;
  metadata?: Record<string, unknown>;
}

/**
 * Wraps a server-side action and writes an `audit_logs` row on success.
 *
 *   const result = await withAudit(
 *     { action: "client.update", resourceType: "client", resourceId: id },
 *     async () => { ... return updatedClient; }
 *   );
 *
 * The actor id is read from the current Supabase session. The audit row
 * is written via the service-role client so RLS never blocks the log
 * itself. The wrapper does NOT catch exceptions — a failed action does
 * not write an audit row.
 */
export async function withAudit<T>(
  ctx: AuditContext,
  fn: () => Promise<T>,
): Promise<T> {
  const result = await fn();

  try {
    const supabase = await createClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();

    const service = createServiceClient();
    await service.from("audit_logs").insert({
      actor_id: user?.id ?? null,
      organization_id: ctx.organizationId ?? null,
      action: ctx.action,
      resource_type: ctx.resourceType,
      resource_id: ctx.resourceId ?? null,
      before: ctx.before ?? null,
      after: ctx.after ?? null,
      metadata: ctx.metadata ?? {},
    });
  } catch (err) {
    // Audit-log writes must never break the underlying operation. If the
    // log fails, surface to console (and Sentry once wired) so it's
    // visible without blocking the user.
    console.error("[audit] failed to write audit log", err, ctx);
  }

  return result;
}

/**
 * Records a security event (login, password change, etc.). Always writes
 * via service-role since unauthenticated paths may need to record events.
 */
export async function recordSecurityEvent(opts: {
  userId: string | null;
  kind: SecurityEventKind;
  ip?: string | null;
  userAgent?: string | null;
  metadata?: Record<string, unknown>;
}) {
  try {
    const service = createServiceClient();
    await service.from("security_events").insert({
      user_id: opts.userId,
      kind: opts.kind,
      ip: opts.ip ?? null,
      user_agent: opts.userAgent ?? null,
      metadata: opts.metadata ?? {},
    });
  } catch (err) {
    console.error("[audit] failed to write security event", err, opts);
  }
}

export type SecurityEventKind =
  | "account_created"
  | "invite_accepted"
  | "email_verified"
  | "password_changed"
  | "password_reset_requested"
  | "password_reset_completed"
  | "login_succeeded"
  | "login_failed"
  | "logout"
  | "session_revoked"
  | "forced_logout"
  | "google_linked"
  | "google_unlinked"
  | "mfa_enabled"
  | "mfa_disabled"
  | "permission_changed"
  | "role_changed";
