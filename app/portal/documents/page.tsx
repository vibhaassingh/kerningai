import { redirect } from "next/navigation";

import { DataTable, type DataTableColumn } from "@/components/data/DataTable";
import { DocumentRowLink } from "@/components/portal/DocumentRowLink";
import { Eyebrow } from "@/components/primitives/Eyebrow";
import { UploadDocumentForm } from "@/components/portal/UploadDocumentForm";
import { formatRelative } from "@/lib/admin/format";
import { hasPermissionAny } from "@/lib/auth/require";
import { listDocuments, type DocumentRow } from "@/lib/portal/documents";
import { getPortalContext } from "@/lib/portal/team";

export const metadata = { title: "Documents" };
export const dynamic = "force-dynamic";

const KIND_LABEL: Record<DocumentRow["kind"], string> = {
  general: "General",
  contract: "Contract",
  sow: "SOW",
  evidence: "Compliance evidence",
  report: "Report",
  sop: "SOP / runbook",
  other: "Other",
};

function formatBytes(bytes: number | null): string {
  if (bytes == null) return "—";
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
}

export default async function PortalDocumentsPage() {
  const ctx = await getPortalContext();
  if (!ctx) redirect("/portal");

  const canUpload = await hasPermissionAny("manage_documents");
  const docs = await listDocuments(ctx.organizationId);

  const columns: DataTableColumn<DocumentRow>[] = [
    {
      key: "name",
      header: "Document",
      cell: (d) => (
        <div className="space-y-0.5">
          <div className="text-text">{d.name}</div>
          {d.description && (
            <div className="text-[11.5px] text-[var(--color-text-muted)]">
              {d.description}
            </div>
          )}
        </div>
      ),
      className: "w-[36%]",
    },
    {
      key: "kind",
      header: "Kind",
      cell: (d) => (
        <span className="font-mono text-[11px] uppercase tracking-[0.1em] text-[var(--color-text-faded)]">
          {KIND_LABEL[d.kind]}
        </span>
      ),
    },
    {
      key: "size",
      header: "Size",
      cell: (d) => (
        <span className="font-mono tabular-nums text-[var(--color-text-faded)]">
          {formatBytes(d.size_bytes)}
        </span>
      ),
    },
    {
      key: "uploaded",
      header: "Uploaded",
      cell: (d) => (
        <div className="space-y-0.5">
          <div className="text-text">{formatRelative(d.uploaded_at)}</div>
          {d.uploaded_by_name && (
            <div className="text-[11.5px] text-[var(--color-text-muted)]">
              {d.uploaded_by_name}
            </div>
          )}
        </div>
      ),
    },
    {
      key: "download",
      header: "",
      headerClassName: "text-right",
      className: "text-right",
      cell: (d) => <DocumentRowLink documentId={d.id} label="Download ↗" />,
    },
  ];

  return (
    <div className="space-y-12">
      <header className="space-y-4">
        <Eyebrow number="11">Documents</Eyebrow>
        <h1 className="text-display text-[clamp(2rem,5vw,3rem)] font-medium leading-[1.05] tracking-[-0.03em]">
          Every <span className="italic text-[var(--color-signal)]">document</span>, in one place.
        </h1>
        <p className="max-w-xl text-[15px] leading-relaxed text-[var(--color-text-faded)]">
          Backed by Supabase Storage with per-org RLS. Downloads issue
          short-lived signed URLs.
        </p>
      </header>

      {canUpload ? (
        <section className="rounded-2xl border border-hairline bg-bg-elev/30 p-8">
          <Eyebrow number="01">Upload</Eyebrow>
          <h2 className="mt-3 text-display text-[clamp(1.4rem,3vw,1.8rem)] font-medium tracking-[-0.02em]">
            Add a document.
          </h2>
          <p className="mt-2 text-[14px] text-[var(--color-text-faded)]">
            Files land in the <code className="font-mono text-text">client-documents</code> bucket
            under your organization id. Max 50 MB.
          </p>
          <div className="mt-8">
            <UploadDocumentForm />
          </div>
        </section>
      ) : (
        <section className="rounded-2xl border border-dashed border-hairline bg-bg-elev/20 p-6 text-[13.5px] text-[var(--color-text-muted)]">
          You have read-only access. Ask the{" "}
          <strong className="text-text">Client owner</strong> or anyone with{" "}
          <strong className="text-text">manage_documents</strong> permission to upload.
        </section>
      )}

      <section className="space-y-4">
        <header className="flex items-end justify-between gap-3">
          <Eyebrow number="02">Library</Eyebrow>
          <span className="font-mono text-[11px] uppercase tracking-[0.14em] text-[var(--color-text-muted)]">
            {docs.length} total
          </span>
        </header>
        <DataTable
          rows={docs}
          columns={columns}
          rowKey={(r) => r.id}
          emptyState={
            canUpload
              ? "No documents yet. Upload the first one above."
              : "No documents yet. Once your team uploads, they'll show here."
          }
        />
      </section>
    </div>
  );
}
