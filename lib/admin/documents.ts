import "server-only";

import { createClient } from "@/lib/supabase/server";

export interface AdminDocumentRow {
  id: string;
  organization_id: string;
  organization_name: string | null;
  kind: "general" | "contract" | "sow" | "evidence" | "report" | "sop" | "other";
  name: string;
  description: string | null;
  storage_path: string;
  mime_type: string | null;
  size_bytes: number | null;
  uploaded_by_name: string | null;
  uploaded_at: string;
}

export async function listAllDocuments(): Promise<AdminDocumentRow[]> {
  const supabase = await createClient();
  const { data } = await supabase
    .from("documents")
    .select(
      "id, organization_id, kind, name, description, storage_path, mime_type, size_bytes, created_at, organization:organizations(name), uploaded_by:app_users!documents_uploaded_by_id_fkey(full_name, email)",
    )
    .order("created_at", { ascending: false })
    .limit(300);

  type R = {
    id: string;
    organization_id: string;
    kind: AdminDocumentRow["kind"];
    name: string;
    description: string | null;
    storage_path: string;
    mime_type: string | null;
    size_bytes: number | null;
    created_at: string;
    organization: { name: string } | null;
    uploaded_by: { full_name: string | null; email: string } | null;
  };

  return ((data ?? []) as unknown as R[]).map((r) => ({
    id: r.id,
    organization_id: r.organization_id,
    organization_name: r.organization?.name ?? null,
    kind: r.kind,
    name: r.name,
    description: r.description,
    storage_path: r.storage_path,
    mime_type: r.mime_type,
    size_bytes: r.size_bytes,
    uploaded_by_name: r.uploaded_by?.full_name ?? r.uploaded_by?.email ?? null,
    uploaded_at: r.created_at,
  }));
}

// `getAdminDocumentDownloadUrl` lives in `lib/admin/document-actions.ts`
// (a "use server" file) so it can be invoked from Client Components without
// pulling the server-only chain into the browser bundle.
