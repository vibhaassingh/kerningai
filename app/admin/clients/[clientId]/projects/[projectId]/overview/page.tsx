import { notFound } from "next/navigation";

import { ProjectOverview } from "@/components/projects/ProjectOverview";
import { ProjectPartnerAssignment } from "@/components/projects/ProjectPartnerAssignment";
import { hasPermissionAny } from "@/lib/auth/require";
import { listPartnerOrgOptions } from "@/lib/admin/partners";
import { getProject } from "@/lib/projects/projects";

export const metadata = { title: "Project — Overview" };
export const dynamic = "force-dynamic";

interface Props {
  params: Promise<{ clientId: string; projectId: string }>;
}

export default async function ProjectOverviewPage({ params }: Props) {
  const { clientId, projectId } = await params;
  const project = await getProject(projectId);
  if (!project) notFound();

  const blueprintHref = project.blueprint_id
    ? `/admin/solution-blueprints/${project.blueprint_id}`
    : null;

  const canManage = await hasPermissionAny("manage_projects");
  const partnerOrgs = canManage ? await listPartnerOrgOptions() : [];

  return (
    <div className="space-y-10">
      <ProjectOverview
        project={project}
        audience="admin"
        blueprintHref={blueprintHref}
      />
      {canManage && (
        <ProjectPartnerAssignment
          projectId={project.id}
          organizationId={clientId}
          currentPartnerOrgId={project.partner_org_id}
          currentPartnerVisibleToClient={project.partner_visible_to_client}
          partnerOrgs={partnerOrgs}
        />
      )}
    </div>
  );
}
