"use server";

import { hasPermissionAny } from "@/lib/auth/require";
import { createServiceClient } from "@/lib/supabase/service";

/**
 * Internal-staff signed URL — bypasses the per-org check the portal
 * version applies, since support reads across clients.
 */
export async function getAdminDocumentDownloadUrl(
  documentId: string,
): Promise<{ ok: true; url: string } | { ok: false; error: string }> {
  if (!(await hasPermissionAny("view_clients"))) {
    return { ok: false, error: "Not permitted." };
  }
  const service = createServiceClient();

  const { data: doc } = await service
    .from("documents")
    .select("storage_path")
    .eq("id", documentId)
    .maybeSingle();
  if (!doc) return { ok: false, error: "Document not found." };

  const { data: signed, error } = await service.storage
    .from("client-documents")
    .createSignedUrl((doc as { storage_path: string }).storage_path, 60);
  if (error || !signed) {
    return { ok: false, error: error?.message ?? "Could not sign URL." };
  }
  return { ok: true, url: signed.signedUrl };
}
