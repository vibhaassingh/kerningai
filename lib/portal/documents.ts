import "server-only";

import { createClient } from "@/lib/supabase/server";

export interface DocumentRow {
  id: string;
  kind: "general" | "contract" | "sow" | "evidence" | "report" | "sop" | "other";
  name: string;
  description: string | null;
  storage_path: string;
  mime_type: string | null;
  size_bytes: number | null;
  uploaded_by_name: string | null;
  uploaded_at: string;
}

export async function listDocuments(organizationId: string): Promise<DocumentRow[]> {
  const supabase = await createClient();
  const { data } = await supabase
    .from("documents")
    .select(
      "id, kind, name, description, storage_path, mime_type, size_bytes, created_at, uploaded_by:app_users!documents_uploaded_by_id_fkey(full_name, email)",
    )
    .eq("organization_id", organizationId)
    .order("created_at", { ascending: false })
    .limit(200);

  type R = {
    id: string;
    kind: DocumentRow["kind"];
    name: string;
    description: string | null;
    storage_path: string;
    mime_type: string | null;
    size_bytes: number | null;
    created_at: string;
    uploaded_by: { full_name: string | null; email: string } | null;
  };

  return ((data ?? []) as unknown as R[]).map((r) => ({
    id: r.id,
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
