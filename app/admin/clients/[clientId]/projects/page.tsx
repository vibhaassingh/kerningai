import Link from "next/link";
import { redirect } from "next/navigation";

import { CreateProjectForm } from "@/components/projects/CreateProjectForm";
import { Eyebrow } from "@/components/primitives/Eyebrow";
import { hasPermissionAny } from "@/lib/auth/require";
import { listPartnerOrgOptions } from "@/lib/admin/partners";
import { listProjectsForOrg } from "@/lib/projects/projects";

export const metadata = { title: "Projects" };
export const dynamic = "force-dynamic";

interface Props {
  params: Promise<{ clientId: string }>;
}

const STATUS_LABEL: Record<string, string> = {
  discovery: "Discovery",
  proposal: "Proposal",
  implementation: "Implementation",
  live: "Live",
  archived: "Archived",
  on_hold: "On hold",
};

export default async function ClientProjectsPage({ params }: Props) {
  const canView = await hasPermissionAny("view_projects");
  if (!canView) redirect("/admin/clients");

  const { clientId } = await params;
  const projects = await listProjectsForOrg(clientId);
  const canCreate = await hasPermissionAny("manage_projects");
  const partnerOrgs = canCreate ? await listPartnerOrgOptions() : [];

  return (
    <div className="space-y-10">
      <section className="space-y-3">
        <Eyebrow number="01">Projects</Eyebrow>
        <p className="text-[14px] text-[var(--color-text-faded)]">
          Each project is a discovery → proposal → implementation arc. Workflow
          canvases live inside a project.
        </p>
      </section>

      <section className="space-y-3">
        {projects.length === 0 ? (
          <p className="rounded-2xl border border-hairline bg-bg-elev/30 px-5 py-8 text-center text-[13px] text-[var(--color-text-muted)]">
            No projects yet.
          </p>
        ) : (
          <ul className="grid gap-px overflow-hidden rounded-2xl border border-hairline bg-hairline lg:grid-cols-2">
            {projects.map((p) => (
              <li key={p.id} className="bg-bg-elev/40 px-5 py-5">
                <Link
                  href={`/admin/clients/${clientId}/projects/${p.id}/overview`}
                  className="block space-y-2 hover:text-[var(--color-signal)]"
                >
                  <header className="flex items-baseline justify-between gap-3">
                    <h3 className="font-display text-[1.05rem] tracking-[-0.01em] text-text">
                      {p.name}
                    </h3>
                    <span className="font-mono text-[10px] uppercase tracking-[0.14em] text-[var(--color-signal)]">
                      {STATUS_LABEL[p.status]}
                    </span>
                  </header>
                  {p.business_label && (
                    <p className="font-mono text-[10.5px] uppercase tracking-[0.12em] text-[var(--color-text-muted)]">
                      {p.business_label}
                    </p>
                  )}
                  {p.description && (
                    <p className="text-[13px] text-[var(--color-text-faded)]">
                      {p.description}
                    </p>
                  )}
                </Link>
              </li>
            ))}
          </ul>
        )}
      </section>

      {canCreate && (
        <section className="space-y-3">
          <Eyebrow number="02">Create new project</Eyebrow>
          <CreateProjectForm
            organizationId={clientId}
            partnerOrgs={partnerOrgs}
          />
        </section>
      )}
    </div>
  );
}
