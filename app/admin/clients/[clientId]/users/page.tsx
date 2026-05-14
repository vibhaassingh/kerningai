import { notFound } from "next/navigation";

import { InviteUserForm } from "@/components/admin/InviteUserForm";
import { RevokeInviteButton } from "@/components/admin/RevokeInviteButton";
import { DataTable, type DataTableColumn } from "@/components/data/DataTable";
import { Eyebrow } from "@/components/primitives/Eyebrow";
import {
  getClientDetail,
  listClientMembers,
  listClientPendingInvites,
  type ClientMember,
  type ClientPendingInvite,
} from "@/lib/admin/clients";
import { formatRelative } from "@/lib/admin/format";
import { CLIENT_ROLES } from "@/lib/rbac/roles";
import { ROLE_LABELS } from "@/lib/rbac/labels";

export const metadata = { title: "People" };
export const dynamic = "force-dynamic";

interface UsersPageProps {
  params: Promise<{ clientId: string }>;
}

export default async function ClientUsersPage({ params }: UsersPageProps) {
  const { clientId } = await params;
  const [client, members, invites] = await Promise.all([
    getClientDetail(clientId),
    listClientMembers(clientId),
    listClientPendingInvites(clientId),
  ]);
  if (!client) notFound();

  const pending = invites.filter((i) => i.status === "pending");

  const memberColumns: DataTableColumn<ClientMember>[] = [
    {
      key: "person",
      header: "Person",
      cell: (row) => (
        <div className="space-y-0.5">
          <div className="text-text">{row.full_name ?? row.email}</div>
          <div className="text-[11.5px] text-[var(--color-text-muted)]">{row.email}</div>
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

  const inviteColumns: DataTableColumn<ClientPendingInvite>[] = [
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
    {
      key: "actions",
      header: "",
      headerClassName: "text-right",
      className: "text-right",
      cell: (row) => <RevokeInviteButton inviteId={row.id} />,
    },
  ];

  const roleOptions = CLIENT_ROLES.map((slug) => ({
    slug,
    name: ROLE_LABELS[slug],
  }));

  return (
    <div className="space-y-14">
      <section className="rounded-2xl border border-hairline bg-bg-elev/30 p-8">
        <Eyebrow number="01">Invite</Eyebrow>
        <h2 className="mt-3 text-display text-[clamp(1.4rem,3vw,1.8rem)] font-medium tracking-[-0.02em]">
          Add a teammate to{" "}
          <span className="italic text-[var(--color-signal)]">{client.name}</span>.
        </h2>
        <p className="mt-2 text-[14px] text-[var(--color-text-faded)]">
          Pick the role first — it determines what they can see when they
          log in.
        </p>
        <div className="mt-8">
          <InviteUserForm
            organizationId={clientId}
            organizationLabel={client.name}
            roles={roleOptions}
          />
        </div>
      </section>

      <section className="space-y-4">
        <header className="flex items-end justify-between gap-4">
          <Eyebrow number="02">Active members</Eyebrow>
          <span className="font-mono text-[11px] uppercase tracking-[0.14em] text-[var(--color-text-muted)]">
            {members.length} total
          </span>
        </header>
        <DataTable
          rows={members}
          columns={memberColumns}
          rowKey={(r) => r.membership_id}
          emptyState="No members yet for this client. Invite the first teammate above."
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
          emptyState="No pending invites for this client."
        />
      </section>
    </div>
  );
}
