import Link from "next/link";
import { redirect } from "next/navigation";

import { DataTable, type DataTableColumn } from "@/components/data/DataTable";
import { Eyebrow } from "@/components/primitives/Eyebrow";
import { formatRelative } from "@/lib/admin/format";
import {
  listSubmissions,
  type SubmissionListRow,
} from "@/lib/admin/submissions";
import { hasPermissionAny } from "@/lib/auth/require";

export const metadata = { title: "Submissions" };
export const dynamic = "force-dynamic";

export default async function SubmissionsListPage() {
  const canView = await hasPermissionAny("review_questionnaire_submissions");
  if (!canView) redirect("/admin");

  const rows = await listSubmissions();
  const submittedCount = rows.filter((r) => r.status !== "draft").length;
  const draftCount = rows.length - submittedCount;

  const columns: DataTableColumn<SubmissionListRow>[] = [
    {
      key: "submitter",
      header: "Submitter",
      cell: (row) => (
        <Link
          href={`/admin/questionnaires/submissions/${row.id}`}
          className="block space-y-0.5 hover:text-text"
        >
          <div className="text-text">
            {row.submitter_company ?? row.submitter_name ?? "Anonymous"}
          </div>
          <div className="text-[11.5px] text-[var(--color-text-muted)]">
            {row.submitter_name && row.submitter_email
              ? `${row.submitter_name} · ${row.submitter_email}`
              : row.submitter_email ?? "—"}
          </div>
        </Link>
      ),
      className: "w-[32%]",
    },
    {
      key: "template",
      header: "Template",
      cell: (row) => (
        <div className="space-y-0.5">
          <div className="text-text">{row.template_name}</div>
          <div className="font-mono text-[11.5px] text-[var(--color-text-muted)]">
            {row.template_slug}
          </div>
        </div>
      ),
    },
    {
      key: "status",
      header: "Status",
      cell: (row) => {
        const tone =
          row.status === "draft"
            ? "border border-hairline text-[var(--color-text-faded)]"
            : row.status === "submitted"
              ? "bg-[var(--color-signal)]/15 text-[var(--color-signal)]"
              : "border border-[var(--color-signal-deep)]/60 text-[var(--color-signal-soft)]";
        return (
          <span
            className={`rounded-full px-2.5 py-1 font-mono text-[10px] uppercase tracking-[0.12em] ${tone}`}
          >
            {row.status.replace(/_/g, " ")}
          </span>
        );
      },
    },
    {
      key: "lead",
      header: "Lead",
      cell: (row) =>
        row.lead_id ? (
          <Link
            href={`/admin/leads/${row.lead_id}`}
            className="text-[var(--color-signal)] hover:underline"
          >
            Open ↗
          </Link>
        ) : (
          <span className="text-[var(--color-text-faint)]">—</span>
        ),
    },
    {
      key: "submitted",
      header: "Submitted",
      cell: (row) => (
        <span className="text-[12.5px] text-[var(--color-text-faded)]">
          {formatRelative(row.submitted_at ?? row.started_at)}
        </span>
      ),
    },
  ];

  return (
    <div className="space-y-12">
      <header className="space-y-4">
        <Eyebrow number="04">Discovery · submissions</Eyebrow>
        <h1 className="text-display text-[clamp(2rem,5vw,3rem)] font-medium leading-[1.05] tracking-[-0.03em]">
          Every <span className="italic text-[var(--color-signal)]">discovery</span> in flight.
        </h1>
        <p className="max-w-xl text-[15px] leading-relaxed text-[var(--color-text-faded)]">
          Prospects fill out a service-specific questionnaire at{" "}
          <Link href="/start" className="nav-link text-text">
            /start
          </Link>
          . Open a submission to read every answer in context.
        </p>
      </header>

      <section className="grid gap-px overflow-hidden rounded-2xl border border-hairline bg-hairline sm:grid-cols-3">
        <Tile number="01" label="Total" value={rows.length.toString()} />
        <Tile number="02" label="Submitted" value={submittedCount.toString()} />
        <Tile number="03" label="In progress" value={draftCount.toString()} />
      </section>

      <DataTable
        rows={rows}
        columns={columns}
        rowKey={(r) => r.id}
        emptyState="No submissions yet. The first one will appear here as soon as a prospect finishes the discovery flow."
      />
    </div>
  );
}

function Tile({ number, label, value }: { number: string; label: string; value: string }) {
  return (
    <article className="space-y-2 bg-bg-elev/40 px-6 py-5">
      <p className="font-mono text-[10px] uppercase tracking-[0.14em] text-[var(--color-text-faint)]">
        {number} — {label}
      </p>
      <p className="text-stat text-[1.8rem] font-medium text-text">{value}</p>
    </article>
  );
}
