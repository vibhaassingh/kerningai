"use server";

import { revalidatePath } from "next/cache";
import { z } from "zod";

import type { ActionResult } from "@/lib/auth/actions";
import { withAudit } from "@/lib/audit/with-audit";
import { hasPermissionAny, requireUser } from "@/lib/auth/require";
import { createServiceClient } from "@/lib/supabase/service";

const MAX_DOC_BYTES = 50 * 1024 * 1024; // matches the bucket file_size_limit

function sanitizeDocName(name: string): string {
  return (
    name
      .replace(/[^a-zA-Z0-9._-]+/g, "_")
      .replace(/_{2,}/g, "_")
      .slice(-120) || "file"
  );
}

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

// ---------------------------------------------------------------------------
// uploadAdminDocument — staff uploads a file into a client's library
// ---------------------------------------------------------------------------
const uploadSchema = z.object({
  organizationId: z.string().uuid("Pick a client."),
  kind: z.enum([
    "general",
    "contract",
    "sow",
    "evidence",
    "report",
    "sop",
    "other",
  ]),
  name: z.string().max(200).optional().or(z.literal("")),
});

export async function uploadAdminDocument(
  _prev: ActionResult<{ documentId: string }> | undefined,
  formData: FormData,
): Promise<ActionResult<{ documentId: string }>> {
  if (!(await hasPermissionAny("manage_documents"))) {
    return { ok: false, error: "Not permitted to upload documents." };
  }

  const parsed = uploadSchema.safeParse({
    organizationId: formData.get("organizationId"),
    kind: formData.get("kind"),
    name: formData.get("name") || "",
  });
  if (!parsed.success) {
    const issue = parsed.error.issues[0];
    return { ok: false, error: issue.message, field: issue.path.join(".") };
  }

  const file = formData.get("file");
  if (!(file instanceof File) || file.size === 0) {
    return { ok: false, error: "Choose a file to upload.", field: "file" };
  }
  if (file.size > MAX_DOC_BYTES) {
    return { ok: false, error: "File exceeds the 50 MB limit.", field: "file" };
  }

  const user = await requireUser();
  const service = createServiceClient();

  const safe = sanitizeDocName(file.name);
  const storagePath = `admin/${parsed.data.organizationId}/${Date.now()}-${safe}`;
  const bytes = new Uint8Array(await file.arrayBuffer());

  const { error: upErr } = await service.storage
    .from("client-documents")
    .upload(storagePath, bytes, {
      contentType: file.type || "application/octet-stream",
      upsert: false,
    });
  if (upErr) {
    return { ok: false, error: `Upload failed: ${upErr.message}` };
  }

  const { data, error } = await service
    .from("documents")
    .insert({
      organization_id: parsed.data.organizationId,
      kind: parsed.data.kind,
      name: parsed.data.name || file.name,
      bucket: "client-documents",
      storage_path: storagePath,
      mime_type: file.type || null,
      size_bytes: file.size,
      uploaded_by_id: user.id,
      metadata: { entered_via: "admin_manual" },
    })
    .select("id")
    .single();
  if (error || !data) {
    // Roll back the orphaned object so a retry isn't blocked by the path.
    await service.storage.from("client-documents").remove([storagePath]);
    return { ok: false, error: error?.message ?? "Could not save document." };
  }

  await withAudit(
    {
      action: "document.uploaded",
      resourceType: "document",
      resourceId: data.id,
      organizationId: parsed.data.organizationId,
      after: { name: parsed.data.name || file.name, kind: parsed.data.kind },
    },
    async () => null,
  );

  revalidatePath("/admin/documents");
  return { ok: true, data: { documentId: data.id } };
}
