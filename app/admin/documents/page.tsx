import Link from "next/link";
import { redirect } from "next/navigation";

import { AdminDocumentDownloadLink } from "@/components/admin/AdminDocumentDownloadLink";
import { DataTable, type DataTableColumn } from "@/components/data/DataTable";
import { Eyebrow } from "@/components/primitives/Eyebrow";
import { formatRelative } from "@/lib/admin/format";
import {
  listAllDocuments,
  type AdminDocumentRow,
} from "@/lib/admin/documents";
import { hasPermissionAny } from "@/lib/auth/require";

export const metadata = { title: "Documents" };
export const dynamic = "force-dynamic";

const KIND_LABEL: Record<AdminDocumentRow["kind"], string> = {
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

export default async function AdminDocumentsPage() {
  if (!(await hasPermissionAny("view_clients"))) redirect("/admin");

  const docs = await listAllDocuments();

  const columns: DataTableColumn<AdminDocumentRow>[] = [
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
      className: "w-[34%]",
    },
    {
      key: "client",
      header: "Client",
      cell: (d) => (
        <Link
          href={`/admin/clients/${d.organization_id}`}
          className="text-[var(--color-signal)] hover:underline"
        >
          {d.organization_name ?? "—"}
        </Link>
      ),
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
      cell: (d) => <AdminDocumentDownloadLink documentId={d.id} />,
    },
  ];

  return (
    <div className="space-y-12">
      <header className="space-y-4">
        <Eyebrow number="08">Documents · cross-client</Eyebrow>
        <h1 className="text-display text-[clamp(2rem,5vw,3rem)] font-medium leading-[1.05] tracking-[-0.03em]">
          Every <span className="italic text-[var(--color-signal)]">document</span>, every workspace.
        </h1>
        <p className="max-w-xl text-[15px] leading-relaxed text-[var(--color-text-faded)]">
          Read-only browser of every client's document library. Each
          download issues a 60-second signed URL and writes an audit row.
        </p>
      </header>

      <DataTable
        rows={docs}
        columns={columns}
        rowKey={(r) => r.id}
        emptyState="No documents uploaded across any client yet."
      />
    </div>
  );
}
