import "server-only";

import { createServiceClient } from "@/lib/supabase/service";

export interface MfaFactorSummary {
  id: string;
  status: "pending" | "active" | "revoked";
  label: string;
  enrolled_at: string;
  activated_at: string | null;
  last_used_at: string | null;
  remaining_backup_codes: number;
}

/**
 * Returns the current user's MFA factor summary (no secret/backup-hash
 * leak). Returns null when the user has never enrolled.
 */
export async function getCurrentMfaFactor(
  userId: string,
): Promise<MfaFactorSummary | null> {
  const service = createServiceClient();
  const { data } = await service
    .from("user_mfa_factors")
    .select(
      "id, status, label, enrolled_at, activated_at, last_used_at, backup_code_hashes, used_backup_code_hashes",
    )
    .eq("user_id", userId)
    .neq("status", "revoked")
    .order("created_at", { ascending: false })
    .limit(1)
    .maybeSingle();

  if (!data) return null;
  type Row = {
    id: string;
    status: "pending" | "active" | "revoked";
    label: string;
    enrolled_at: string;
    activated_at: string | null;
    last_used_at: string | null;
    backup_code_hashes: string[];
    used_backup_code_hashes: string[];
  };
  const row = data as Row;
  return {
    id: row.id,
    status: row.status,
    label: row.label,
    enrolled_at: row.enrolled_at,
    activated_at: row.activated_at,
    last_used_at: row.last_used_at,
    remaining_backup_codes:
      (row.backup_code_hashes?.length ?? 0) -
      (row.used_backup_code_hashes?.length ?? 0),
  };
}
