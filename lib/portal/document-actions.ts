"use server";

import { revalidatePath } from "next/cache";
import { z } from "zod";

import type { ActionResult } from "@/lib/auth/actions";
import { withAudit } from "@/lib/audit/with-audit";
import { hasPermissionAny, requireUser } from "@/lib/auth/require";
import { createServiceClient } from "@/lib/supabase/service";
import { getPortalContext } from "@/lib/portal/team";

const MAX_BYTES = 50 * 1024 * 1024; // 50 MB

const uploadSchema = z.object({
  name: z.string().min(2, "Give the document a name."),
  kind: z.enum(["general", "contract", "sow", "evidence", "report", "sop", "other"]).default("general"),
  description: z.string().optional(),
});

/**
 * Streams the file directly to the `client-documents` Supabase Storage
 * bucket using a per-org folder, then mirrors the metadata into the
 * `documents` table for fast listing + RLS-respecting access.
 */
export async function uploadDocument(
  _prev: ActionResult | undefined,
  formData: FormData,
): Promise<ActionResult> {
  const ctx = await getPortalContext();
  if (!ctx) return { ok: false, error: "No active workspace." };

  if (!(await hasPermissionAny("manage_documents"))) {
    return { ok: false, error: "You don't have permission to upload documents." };
  }

  const file = formData.get("file");
  if (!(file instanceof File) || file.size === 0) {
    return { ok: false, error: "Pick a file to upload.", field: "file" };
  }
  if (file.size > MAX_BYTES) {
    return { ok: false, error: "File is over 50 MB.", field: "file" };
  }

  const parsed = uploadSchema.safeParse({
    name: formData.get("name"),
    kind: formData.get("kind") || "general",
    description: (formData.get("description") as string | null) || undefined,
  });
  if (!parsed.success) {
    const issue = parsed.error.issues[0];
    return { ok: false, error: issue.message, field: issue.path.join(".") };
  }

  const user = await requireUser();
  const service = createServiceClient();

  // Upload bytes to the bucket under <orgId>/<uuid>-<filename>.
  const safeName = file.name.replace(/[^A-Za-z0-9._-]/g, "_").slice(0, 80);
  const key = `${ctx.organizationId}/${crypto.randomUUID()}-${safeName}`;

  const buf = new Uint8Array(await file.arrayBuffer());
  const { error: uploadError } = await service.storage
    .from("client-documents")
    .upload(key, buf, {
      contentType: file.type || "application/octet-stream",
      upsert: false,
    });

  if (uploadError) {
    return { ok: false, error: `Upload failed: ${uploadError.message}` };
  }

  // Mirror metadata.
  const { data: row, error: metaError } = await service
    .from("documents")
    .insert({
      organization_id: ctx.organizationId,
      kind: parsed.data.kind,
      name: parsed.data.name,
      description: parsed.data.description ?? null,
      bucket: "client-documents",
      storage_path: key,
      mime_type: file.type || null,
      size_bytes: file.size,
      uploaded_by_id: user.id,
    })
    .select("id")
    .single();

  if (metaError || !row) {
    // Roll back the upload.
    await service.storage.from("client-documents").remove([key]);
    return { ok: false, error: metaError?.message ?? "Could not save document." };
  }

  await withAudit(
    {
      action: "document.uploaded",
      resourceType: "document",
      resourceId: row.id,
      organizationId: ctx.organizationId,
      after: {
        name: parsed.data.name,
        kind: parsed.data.kind,
        size_bytes: file.size,
      },
    },
    async () => null,
  );

  revalidatePath("/portal/documents");
  return { ok: true };
}

const downloadSchema = z.object({ documentId: z.string().uuid() });

/**
 * Issues a signed URL for downloading a document. Expires in 60s — the
 * client is expected to redirect immediately.
 */
export async function getDocumentDownloadUrl(
  documentId: string,
): Promise<ActionResult<{ url: string }>> {
  const parsed = downloadSchema.safeParse({ documentId });
  if (!parsed.success) return { ok: false, error: "Invalid document id." };

  const ctx = await getPortalContext();
  if (!ctx) return { ok: false, error: "No active workspace." };

  const service = createServiceClient();
  const { data: doc } = await service
    .from("documents")
    .select("storage_path, organization_id")
    .eq("id", parsed.data.documentId)
    .maybeSingle();
  if (!doc || doc.organization_id !== ctx.organizationId) {
    return { ok: false, error: "Document not found." };
  }

  const { data: signed, error } = await service.storage
    .from("client-documents")
    .createSignedUrl(doc.storage_path, 60);
  if (error || !signed) {
    return { ok: false, error: error?.message ?? "Could not sign URL." };
  }

  await withAudit(
    {
      action: "document.signed_download",
      resourceType: "document",
      resourceId: parsed.data.documentId,
      organizationId: ctx.organizationId,
    },
    async () => null,
  );

  return { ok: true, data: { url: signed.signedUrl } };
}
