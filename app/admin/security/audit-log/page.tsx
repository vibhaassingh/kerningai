import { redirect } from "next/navigation";

import { DataTable, type DataTableColumn } from "@/components/data/DataTable";
import { Eyebrow } from "@/components/primitives/Eyebrow";
import { hasPermissionAny } from "@/lib/auth/require";
import { createClient } from "@/lib/supabase/server";

export const metadata = { title: "Audit log" };

interface AuditRow {
  id: string;
  actor_id: string | null;
  organization_id: string | null;
  action: string;
  resource_type: string;
  resource_id: string | null;
  ip: string | null;
  created_at: string;
  actor: { full_name: string | null; email: string } | null;
  organization: { name: string } | null;
}

interface AuditLogPageProps {
  searchParams: Promise<{ action?: string; resource?: string; org?: string; q?: string }>;
}

export default async function AuditLogPage({ searchParams }: AuditLogPageProps) {
  const canRead = await hasPermissionAny("view_audit_logs");
  if (!canRead) redirect("/admin");

  const { action, resource, org, q } = await searchParams;

  const supabase = await createClient();
  let query = supabase
    .from("audit_logs")
    .select(
      "id, actor_id, organization_id, action, resource_type, resource_id, ip, created_at, actor:app_users(full_name, email), organization:organizations(name)",
    )
    .order("created_at", { ascending: false })
    .limit(200);

  if (action) query = query.eq("action", action);
  if (resource) query = query.eq("resource_type", resource);
  if (org) query = query.eq("organization_id", org);
  if (q) query = query.or(`action.ilike.%${q}%,resource_type.ilike.%${q}%`);

  const { data, error } = await query;
  const rows = ((data ?? []) as unknown as AuditRow[]) ?? [];

  // Distinct values for filter chips.
  const distinctActions = Array.from(new Set(rows.map((r) => r.action))).slice(0, 8);

  const columns: DataTableColumn<AuditRow>[] = [
    {
      key: "when",
      header: "When",
      cell: (row) => (
        <time
          dateTime={row.created_at}
          className="font-mono text-[12.5px] text-[var(--color-text-faded)]"
        >
          {new Date(row.created_at).toLocaleString("en-GB", {
            day: "2-digit",
            month: "short",
            year: "numeric",
            hour: "2-digit",
            minute: "2-digit",
          })}
        </time>
      ),
      className: "w-[180px]",
    },
    {
      key: "actor",
      header: "Actor",
      cell: (row) =>
        row.actor ? (
          <div className="space-y-0.5">
            <div className="text-text">{row.actor.full_name ?? row.actor.email}</div>
            <div className="text-[11.5px] text-[var(--color-text-muted)]">
              {row.actor.email}
            </div>
          </div>
        ) : (
          <span className="text-[var(--color-text-faint)]">system</span>
        ),
      className: "w-[220px]",
    },
    {
      key: "action",
      header: "Action",
      cell: (row) => (
        <span className="font-mono text-[12.5px] text-text">{row.action}</span>
      ),
    },
    {
      key: "resource",
      header: "Resource",
      cell: (row) => (
        <span className="font-mono text-[12.5px] text-[var(--color-text-faded)]">
          {row.resource_type}
          {row.resource_id && (
            <span className="text-[var(--color-text-muted)]">:{row.resource_id.slice(0, 8)}</span>
          )}
        </span>
      ),
    },
    {
      key: "org",
      header: "Org",
      cell: (row) =>
        row.organization?.name ?? (
          <span className="text-[var(--color-text-faint)]">—</span>
        ),
    },
  ];

  return (
    <div className="space-y-12">
      <header className="space-y-4">
        <Eyebrow number="09">Security · audit log</Eyebrow>
        <h1 className="text-display text-[clamp(2rem,5vw,3rem)] font-medium leading-[1.05] tracking-[-0.03em]">
          Every <span className="italic text-[var(--color-signal)]">consequential</span> action.
        </h1>
        <p className="max-w-xl text-[15px] leading-relaxed text-[var(--color-text-faded)]">
          Server-side mutations record who did what, on which resource,
          and when. Showing the most recent 200 events. Filters use URL
          params so a view can be shared.
        </p>
      </header>

      {error && (
        <p className="text-[13px] text-[var(--color-signal)]" role="alert">
          {error.message}
        </p>
      )}

      <DataTable
        rows={rows}
        columns={columns}
        rowKey={(r) => r.id}
        toolbar={
          <div className="flex flex-wrap items-center gap-2">
            <span className="text-[var(--color-text-faint)]">Quick filter:</span>
            <a
              href="/admin/security/audit-log"
              className={
                !action
                  ? "rounded-full bg-[var(--color-signal)]/15 px-2.5 py-1 text-[var(--color-signal)]"
                  : "rounded-full border border-hairline px-2.5 py-1 text-[var(--color-text-faded)] hover:text-text"
              }
            >
              All
            </a>
            {distinctActions.map((a) => (
              <a
                key={a}
                href={`?action=${encodeURIComponent(a)}`}
                className={
                  action === a
                    ? "rounded-full bg-[var(--color-signal)]/15 px-2.5 py-1 text-[var(--color-signal)]"
                    : "rounded-full border border-hairline px-2.5 py-1 text-[var(--color-text-faded)] hover:text-text"
                }
              >
                {a}
              </a>
            ))}
          </div>
        }
        caption={
          <span className="font-mono">
            {rows.length} event{rows.length === 1 ? "" : "s"}
          </span>
        }
        emptyState="No audit events match the current filter."
      />
    </div>
  );
}
