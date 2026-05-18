import "server-only";

import { cache } from "react";

import { createClient } from "@/lib/supabase/server";

/**
 * Request-scoped session primitives.
 *
 * Every authenticated render previously re-ran `supabase.auth.getUser()`,
 * the memberships query, and the profile lookup multiple times (shell +
 * `getCurrentMembership` + `getPortalContext` + `requireUser` +
 * permission checks). React `cache()` memoizes these for the lifetime of
 * a single RSC request only — it is NOT cross-request caching, so RLS and
 * tenant isolation are unchanged. The cache is keyed by arguments; these
 * take none, so each runs at most once per request.
 */

/** The authenticated Supabase user, or null. One auth round-trip / request. */
export const getRequestUser = cache(async () => {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  return user;
});

export interface RequestProfile {
  id: string;
  full_name: string | null;
  email: string;
  default_org_id: string | null;
}

/** The current user's app_users row. One DB round-trip / request. */
export const getRequestProfile = cache(
  async (): Promise<RequestProfile | null> => {
    const user = await getRequestUser();
    if (!user) return null;
    const supabase = await createClient();
    const { data } = await supabase
      .from("app_users")
      .select("id, full_name, email, default_org_id")
      .eq("id", user.id)
      .maybeSingle();
    return (data as RequestProfile | null) ?? null;
  },
);
