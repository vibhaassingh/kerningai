import Link from "next/link";
import { notFound, redirect } from "next/navigation";

import { InviteUserForm } from "@/components/admin/InviteUserForm";
import { RevokeInviteButton } from "@/components/admin/RevokeInviteButton";
import { DataTable, type DataTableColumn } from "@/components/data/DataTable";
import { Eyebrow } from "@/components/primitives/Eyebrow";
import { hasPermissionAny } from "@/lib/auth/require";
import {
  getPartnerOrgDetail,
  type PartnerInviteRow,
  type PartnerMemberRow,
  type PartnerReferredLead,
  type PartnerReferredProject,
} from "@/lib/admin/partners";
import { formatRelative } from "@/lib/admin/format";
import { PARTNER_ROLES } from "@/lib/rbac/roles";
import { ROLE_LABELS } from "@/lib/rbac/labels";

export const metadata = { title: "Partner" };
export const dynamic = "force-dynamic";

interface Props {
  params: Promise<{ partnerId: string }>;
}

export default async function PartnerDetailPage({ params }: Props) {
  const canView = await hasPermissionAny("view_clients");
  if (!canView) redirect("/admin");
  const canManageUsers = await hasPermissionAny("manage_users");

  const { partnerId } = await params;
  const detail = await getPartnerOrgDetail(partnerId);
  if (!detail) notFound();

  const { org, members, invites, projects, leads } = detail;
  const pendingInvites = invites.filter((i) => i.status === "pending");

  const roleOptions = PARTNER_ROLES.map((slug) => ({
    slug,
    name: ROLE_LABELS[slug],
  }));

  const memberColumns: DataTableColumn<PartnerMemberRow>[] = [
    {
      key: "person",
      header: "Person",
      cell: (row) => (
        <div className="space-y-0.5">
          <div className="text-text">{row.full_name ?? row.email}</div>
          <div className="text-[12px] text-[var(--color-text-muted)]">
            {row.email}
          </div>
        </div>
      ),
      className: "w-[40%]",
    },
    { key: "role", header: "Role", cell: (row) => row.role_name },
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
  ];

  const inviteColumns: DataTableColumn<PartnerInviteRow>[] = [
    { key: "email", header: "Email", cell: (row) => row.email, className: "w-[40%]" },
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

  const projectColumns: DataTableColumn<PartnerReferredProject>[] = [
    {
      key: "project",
      header: "Project",
      cell: (row) => (
        <Link
          href={`/admin/clients/${row.organization_id}/projects/${row.id}/overview`}
          className="text-text hover:text-[var(--color-signal)]"
        >
          {row.name}
        </Link>
      ),
      className: "w-[44%]",
    },
    { key: "client", header: "Client", cell: (row) => row.client_org_name },
    {
      key: "status",
      header: "Status",
      cell: (row) => (
        <span className="font-mono text-[10px] uppercase tracking-[0.14em] text-[var(--color-text-faded)]">
          {row.status.replace(/_/g, " ")}
        </span>
      ),
    },
  ];

  const leadColumns: DataTableColumn<PartnerReferredLead>[] = [
    {
      key: "lead",
      header: "Lead",
      cell: (row) => (
        <Link
          href={`/admin/leads/${row.id}`}
          className="text-text hover:text-[var(--color-signal)]"
        >
          {row.company_name ?? row.contact_name}
        </Link>
      ),
      className: "w-[44%]",
    },
    { key: "contact", header: "Contact", cell: (row) => row.contact_name },
    {
      key: "status",
      header: "Status",
      cell: (row) => (
        <span className="font-mono text-[10px] uppercase tracking-[0.14em] text-[var(--color-text-faded)]">
          {row.status.replace(/_/g, " ")}
        </span>
      ),
    },
  ];

  return (
    <div className="space-y-14">
      <header className="space-y-4">
        <div className="flex items-center gap-3 text-[12px] uppercase tracking-[0.14em] text-[var(--color-text-muted)]">
          <Link href="/admin/partners" className="nav-link hover:text-text">
            ← Partners
          </Link>
          <span>·</span>
          <span>{org.slug}</span>
        </div>
        <h1 className="text-display text-[clamp(1.8rem,4vw,2.6rem)] font-medium leading-[1.05] tracking-[-0.02em]">
          {org.name}
        </h1>
        <p className="text-[14px] text-[var(--color-text-faded)]">
          Partner organisation · {org.region} ·{" "}
          {org.billing_email ?? "no billing email"}
        </p>
      </header>

      {canManageUsers && (
        <section className="rounded-2xl border border-hairline bg-bg-elev/30 p-8">
          <Eyebrow number="01">Invite</Eyebrow>
          <h2 className="mt-3 text-display text-[clamp(1.4rem,3vw,1.8rem)] font-medium tracking-[-0.02em]">
            Add someone from {org.name}.
          </h2>
          <p className="mt-2 text-[14px] text-[var(--color-text-faded)]">
            They get a single-use email link and set their own password.
            Partner Owners can submit leads and see referred projects;
            Partner Users can comment; Partner Viewers are read-only.
          </p>
          <div className="mt-8">
            <InviteUserForm
              organizationId={org.id}
              organizationLabel={org.name}
              roles={roleOptions}
            />
          </div>
        </section>
      )}

      <section className="space-y-6">
        <Eyebrow number="02">Team</Eyebrow>
        <DataTable
          rows={members}
          columns={memberColumns}
          rowKey={(r) => r.membership_id}
          emptyState="No team members yet. Invite the first one above."
        />
      </section>

      {pendingInvites.length > 0 && (
        <section className="space-y-6">
          <Eyebrow number="03">Pending invites</Eyebrow>
          <DataTable
            rows={pendingInvites}
            columns={inviteColumns}
            rowKey={(r) => r.id}
            emptyState="No pending invites."
          />
        </section>
      )}

      <section className="space-y-6">
        <Eyebrow number="04">Referred projects</Eyebrow>
        <DataTable
          rows={projects}
          columns={projectColumns}
          rowKey={(r) => r.id}
          emptyState="No projects reference this partner yet. Assign one from a project's Overview tab."
        />
      </section>

      <section className="space-y-6">
        <Eyebrow number="05">Referred leads</Eyebrow>
        <DataTable
          rows={leads}
          columns={leadColumns}
          rowKey={(r) => r.id}
          emptyState="No leads attributed to this partner yet."
        />
      </section>
    </div>
  );
}
