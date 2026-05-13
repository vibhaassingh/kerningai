import "server-only";

import { createClient as createSupabaseClient } from "@supabase/supabase-js";

import { requireSupabaseEnv } from "@/lib/env";

/**
 * Service-role Supabase client. Bypasses RLS entirely — use sparingly and
 * only from trusted server code: cron jobs, webhook handlers writing to
 * audit_logs, account-linking flows that need to touch identities.
 *
 * Never import this from a Client Component. The `server-only` directive
 * above will fail the build if you do.
 *
 * Every call site should be paired with explicit permission/tenancy
 * checks performed BEFORE invoking the service client. RLS is the
 * backstop, not the only line of defence.
 */
export function createServiceClient() {
  const env = requireSupabaseEnv();

  return createSupabaseClient(
    env.NEXT_PUBLIC_SUPABASE_URL,
    env.SUPABASE_SERVICE_ROLE_KEY,
    {
      auth: {
        autoRefreshToken: false,
        persistSession: false,
        detectSessionInUrl: false,
      },
    },
  );
}
