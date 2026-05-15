import { redirect } from "next/navigation";

import { InviteUserForm } from "@/components/admin/InviteUserForm";
import { RevokeInviteButton } from "@/components/admin/RevokeInviteButton";
import { DataTable, type DataTableColumn } from "@/components/data/DataTable";
import { Eyebrow } from "@/components/primitives/Eyebrow";
import {
  getPortalContext,
  listPortalMembers,
  listPortalPendingInvites,
  type PortalMember,
  type PortalPendingInvite,
} from "@/lib/portal/team";
import { formatRelative } from "@/lib/admin/format";
import { hasPermissionAny } from "@/lib/auth/require";
import { CLIENT_ROLES } from "@/lib/rbac/roles";
import { ROLE_LABELS } from "@/lib/rbac/labels";

export const metadata = { title: "Team" };
export const dynamic = "force-dynamic";

export default async function PortalTeamPage() {
  const ctx = await getPortalContext();
  if (!ctx) redirect("/portal/dashboard");

  const canManage = await hasPermissionAny("manage_users");

  const [members, invites] = await Promise.all([
    listPortalMembers(ctx.organizationId),
    listPortalPendingInvites(ctx.organizationId),
  ]);

  const pending = invites.filter((i) => i.status === "pending");

  const memberColumns: DataTableColumn<PortalMember>[] = [
    {
      key: "person",
      header: "Person",
      cell: (row) => (
        <div className="space-y-0.5">
          <div className="text-text">{row.full_name ?? row.email}</div>
          <div className="text-[11.5px] text-[var(--color-text-muted)]">
            {row.email}
          </div>
        </div>
      ),
      className: "w-[40%]",
    },
    {
      key: "role",
      header: "Role",
      cell: (row) => row.role_name,
    },
    {
      key: "status",
      header: "Status",
      cell: (row) => (
        <span
          className={
            row.status === "active"
              ? "rounded-full bg-[var(--color-signal)]/15 px-2.5 py-1 font-mono text-[10px] uppercase tracking-[0.14em] text-[var(--color-signal)]"
              : "rounded-full border border-hairline px-2.5 py-1 font-mono text-[10px] uppercase tracking-[0.14em] text-[var(--color-text-faded)]"
          }
        >
          {row.status}
        </span>
      ),
    },
    {
      key: "last_login",
      header: "Last sign-in",
      cell: (row) =>
        row.last_login_at ? (
          formatRelative(row.last_login_at)
        ) : (
          <span className="text-[var(--color-text-faint)]">—</span>
        ),
    },
  ];

  const inviteColumns: DataTableColumn<PortalPendingInvite>[] = [
    {
      key: "email",
      header: "Email",
      cell: (row) => row.email,
      className: "w-[40%]",
    },
    {
      key: "role",
      header: "Role",
      cell: (row) =>
        ROLE_LABELS[row.role_slug as keyof typeof ROLE_LABELS] ?? row.role_slug,
    },
    {
      key: "expires",
      header: "Expires",
      cell: (row) => formatRelative(row.expires_at),
    },
    ...(canManage
      ? [
          {
            key: "actions",
            header: "",
            headerClassName: "text-right",
            className: "text-right",
            cell: (row: PortalPendingInvite) => <RevokeInviteButton inviteId={row.id} />,
          },
        ]
      : []),
  ];

  // Only show roles "below" the inviter's role rank could be a refinement.
  // For Phase 2d any client_owner / it_admin can pick any client role.
  const roleOptions = CLIENT_ROLES.map((slug) => ({
    slug,
    name: ROLE_LABELS[slug],
  }));

  return (
    <div className="space-y-12">
      <header className="space-y-4">
        <Eyebrow number="13">Workspace · team</Eyebrow>
        <h1 className="text-display text-[clamp(2rem,5vw,3rem)] font-medium leading-[1.05] tracking-[-0.03em]">
          Your{" "}
          <span className="italic text-[var(--color-signal)]">
            {ctx.organizationName}
          </span>{" "}
          team.
        </h1>
        <p className="max-w-xl text-[15px] leading-relaxed text-[var(--color-text-faded)]">
          Invite teammates, assign roles, and see who's active. Every
          change is recorded in the audit trail Kerning support has
          visibility into.
        </p>
      </header>

      {canManage ? (
        <section className="rounded-2xl border border-hairline bg-bg-elev/30 p-8">
          <Eyebrow number="01">Invite</Eyebrow>
          <h2 className="mt-3 text-display text-[clamp(1.4rem,3vw,1.8rem)] font-medium tracking-[-0.02em]">
            Add a teammate.
          </h2>
          <p className="mt-2 text-[14px] text-[var(--color-text-faded)]">
            The recipient gets an email with a single-use link. They'll
            choose their own password.
          </p>
          <div className="mt-8">
            <InviteUserForm
              organizationId={ctx.organizationId}
              organizationLabel={ctx.organizationName}
              roles={roleOptions}
            />
          </div>
        </section>
      ) : (
        <section className="rounded-2xl border border-dashed border-hairline bg-bg-elev/20 p-6 text-[13.5px] text-[var(--color-text-muted)]">
          You have read-only access to the team list. Ask the{" "}
          <strong className="text-text">Client owner</strong> or{" "}
          <strong className="text-text">IT admin</strong> to invite new
          teammates.
        </section>
      )}

      <section className="space-y-4">
        <header className="flex items-end justify-between gap-4">
          <Eyebrow number="02">Members</Eyebrow>
          <span className="font-mono text-[11px] uppercase tracking-[0.14em] text-[var(--color-text-muted)]">
            {members.length} total
          </span>
        </header>
        <DataTable
          rows={members}
          columns={memberColumns}
          rowKey={(r) => r.membership_id}
          emptyState="No members yet."
        />
      </section>

      <section className="space-y-4">
        <header className="flex items-end justify-between gap-4">
          <Eyebrow number="03">Pending invites</Eyebrow>
          <span className="font-mono text-[11px] uppercase tracking-[0.14em] text-[var(--color-text-muted)]">
            {pending.length} pending
          </span>
        </header>
        <DataTable
          rows={pending}
          columns={inviteColumns}
          rowKey={(r) => r.id}
          emptyState="No pending invites."
        />
      </section>
    </div>
  );
}
