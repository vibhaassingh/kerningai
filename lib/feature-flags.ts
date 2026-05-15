import "server-only";

import { createServiceClient } from "@/lib/supabase/service";

/**
 * Minimal feature-flag reader over the `feature_flags` table (seeded in
 * migration 0003). A flag is "on" globally when `enabled_globally` is
 * true. Per-org targeting (`enabled_org_ids`) is supported for callers
 * that pass an orgId.
 *
 * Reads are uncached for now (low call volume on the surfaces that use
 * flags). Add an LRU/`unstable_cache` wrapper if a hot path needs it.
 */
export async function isFeatureEnabled(
  slug: string,
  orgId?: string,
): Promise<boolean> {
  try {
    const service = createServiceClient();
    const { data } = await service
      .from("feature_flags")
      .select("enabled_globally, enabled_org_ids")
      .eq("slug", slug)
      .maybeSingle();
    if (!data) return false;
    const row = data as {
      enabled_globally: boolean;
      enabled_org_ids: string[];
    };
    if (row.enabled_globally) return true;
    if (orgId && row.enabled_org_ids?.includes(orgId)) return true;
    return false;
  } catch {
    // Fail closed — a flag we can't read is treated as off.
    return false;
  }
}
