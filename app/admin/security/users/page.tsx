import { redirect } from "next/navigation";

import { InviteClientUserForm } from "@/components/admin/InviteClientUserForm";
import { InviteUserForm } from "@/components/admin/InviteUserForm";
import { RevokeInviteButton } from "@/components/admin/RevokeInviteButton";
import { DataTable, type DataTableColumn } from "@/components/data/DataTable";
import { Eyebrow } from "@/components/primitives/Eyebrow";
import { listClients } from "@/lib/admin/clients";
import { hasPermissionAny } from "@/lib/auth/require";
import { CLIENT_ROLES, INTERNAL_ROLES } from "@/lib/rbac/roles";
import { ROLE_LABELS } from "@/lib/rbac/labels";
import { createClient } from "@/lib/supabase/server";

export const metadata = { title: "Users & roles" };

const KERNING_ORG_ID = "00000000-0000-0000-0000-000000000001";

interface MemberRow {
  membership_id: string;
  user_id: string;
  email: string;
  full_name: string | null;
  role_slug: string;
  role_name: string;
  status: "active" | "suspended" | "pending";
  accepted_at: string | null;
  last_login_at: string | null;
}

interface InviteRow {
  id: string;
  email: string;
  role_slug: string;
  status: "pending" | "accepted" | "revoked" | "expired";
  expires_at: string;
  created_at: string;
  invited_by_id: string | null;
}

export default async function AdminUsersPage() {
  const canManage = await hasPermissionAny("manage_users");
  if (!canManage) redirect("/admin");

  const supabase = await createClient();

  const [{ data: members }, { data: invites }] = await Promise.all([
    supabase
      .from("org_members_view")
      .select(
        "membership_id, user_id, email, full_name, role_slug, role_name, status, accepted_at, last_login_at",
      )
      .eq("organization_id", KERNING_ORG_ID)
      .order("status", { ascending: true })
      .order("accepted_at", { ascending: false }),
    supabase
      .from("invites")
      .select("id, email, role_slug, status, expires_at, created_at, invited_by_id")
      .eq("organization_id", KERNING_ORG_ID)
      .in("status", ["pending", "expired", "revoked"])
      .order("created_at", { ascending: false })
      .limit(50),
  ]);

  const memberRows = (members ?? []) as MemberRow[];
  const inviteRows = (invites ?? []) as InviteRow[];
  const pendingInvites = inviteRows.filter((i) => i.status === "pending");

  const memberColumns: DataTableColumn<MemberRow>[] = [
    {
      key: "person",
      header: "Person",
      cell: (row) => (
        <div className="space-y-0.5">
          <div className="text-text">{row.full_name ?? row.email}</div>
          <div className="text-[12px] text-[var(--color-text-muted)]">{row.email}</div>
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
        row.last_login_at
          ? formatRelative(new Date(row.last_login_at))
          : <span className="text-[var(--color-text-faint)]">—</span>,
    },
  ];

  const inviteColumns: DataTableColumn<InviteRow>[] = [
    {
      key: "email",
      header: "Email",
      cell: (row) => row.email,
      className: "w-[40%]",
    },
    {
      key: "role",
      header: "Role",
      cell: (row) => ROLE_LABELS[row.role_slug as keyof typeof ROLE_LABELS] ?? row.role_slug,
    },
    {
      key: "expires",
      header: "Expires",
      cell: (row) => formatRelative(new Date(row.expires_at)),
    },
    {
      key: "actions",
      header: "",
      headerClassName: "text-right",
      className: "text-right",
      cell: (row) => <RevokeInviteButton inviteId={row.id} />,
    },
  ];

  const roleOptions = INTERNAL_ROLES.map((slug) => ({
    slug,
    name: ROLE_LABELS[slug],
  }));

  const clientRoleOptions = CLIENT_ROLES.map((slug) => ({
    slug,
    name: ROLE_LABELS[slug],
  }));

  const clients = await listClients();
  const clientOptions = clients.map((c) => ({ id: c.id, name: c.name }));

  return (
    <div className="space-y-14">
      <header className="space-y-4">
        <Eyebrow number="08">Security · users & roles</Eyebrow>
        <h1 className="text-display text-[clamp(2rem,5vw,3rem)] font-medium leading-[1.05] tracking-[-0.03em]">
          Manage the <span className="italic text-[var(--color-signal)]">Kerning</span> internal team.
        </h1>
        <p className="max-w-xl text-[15px] leading-relaxed text-[var(--color-text-faded)]">
          Invite internal staff or a client user from here — every
          membership change is recorded in the audit log. Per-client
          management also lives under each client&apos;s People tab.
        </p>
      </header>

      <section className="rounded-2xl border border-hairline bg-bg-elev/30 p-8">
        <Eyebrow number="01">Invite</Eyebrow>
        <h2 className="mt-3 text-display text-[clamp(1.4rem,3vw,1.8rem)] font-medium tracking-[-0.02em]">
          Add a new internal user.
        </h2>
        <p className="mt-2 text-[14px] text-[var(--color-text-faded)]">
          The recipient gets an email with a single-use link. They'll set
          their own password.
        </p>

        <div className="mt-8">
          <InviteUserForm
            organizationId={KERNING_ORG_ID}
            organizationLabel="Kerning AI"
            roles={roleOptions}
          />
        </div>
      </section>

      <section className="rounded-2xl border border-hairline bg-bg-elev/30 p-8">
        <Eyebrow number="01b">Invite a client user</Eyebrow>
        <h2 className="mt-3 text-display text-[clamp(1.4rem,3vw,1.8rem)] font-medium tracking-[-0.02em]">
          Add someone to a{" "}
          <span className="italic text-[var(--color-signal)]">client</span> org.
        </h2>
        <p className="mt-2 text-[14px] text-[var(--color-text-faded)]">
          Pick the client, the role, type their email — done. No need to
          open the client and dig into its People tab (that still works too).
        </p>
        <div className="mt-8">
          <InviteClientUserForm
            clients={clientOptions}
            roles={clientRoleOptions}
          />
        </div>
      </section>

      <section className="space-y-6">
        <header className="flex items-end justify-between gap-4">
          <div>
            <Eyebrow number="02">Active members</Eyebrow>
            <h2 className="mt-3 text-display text-[clamp(1.4rem,3vw,1.8rem)] font-medium tracking-[-0.02em]">
              Members.
            </h2>
          </div>
          <span className="font-mono text-[11px] uppercase tracking-[0.14em] text-[var(--color-text-muted)]">
            {memberRows.length} total
          </span>
        </header>
        <DataTable
          rows={memberRows}
          columns={memberColumns}
          rowKey={(row) => row.membership_id}
          emptyState="No members yet. Invite the first teammate above."
        />
      </section>

      <section className="space-y-6">
        <header className="flex items-end justify-between gap-4">
          <div>
            <Eyebrow number="03">Pending invites</Eyebrow>
            <h2 className="mt-3 text-display text-[clamp(1.4rem,3vw,1.8rem)] font-medium tracking-[-0.02em]">
              Awaiting acceptance.
            </h2>
          </div>
          <span className="font-mono text-[11px] uppercase tracking-[0.14em] text-[var(--color-text-muted)]">
            {pendingInvites.length} pending
          </span>
        </header>
        <DataTable
          rows={pendingInvites}
          columns={inviteColumns}
          rowKey={(row) => row.id}
          emptyState="No pending invites. Anyone you've invited has either accepted or the invite expired."
        />
      </section>
    </div>
  );
}

function formatRelative(date: Date): string {
  const now = Date.now();
  const diff = date.getTime() - now;
  const seconds = Math.round(diff / 1000);
  const absSec = Math.abs(seconds);
  const fmt = new Intl.RelativeTimeFormat("en", { numeric: "auto" });

  if (absSec < 60) return fmt.format(seconds, "seconds");
  if (absSec < 3600) return fmt.format(Math.round(seconds / 60), "minutes");
  if (absSec < 86400) return fmt.format(Math.round(seconds / 3600), "hours");
  if (absSec < 86400 * 30) return fmt.format(Math.round(seconds / 86400), "days");
  return date.toLocaleDateString("en-GB", {
    day: "numeric",
    month: "short",
    year: "numeric",
  });
}
