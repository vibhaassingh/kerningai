import { notFound } from "next/navigation";

import { ProjectOverview } from "@/components/projects/ProjectOverview";
import { getProject } from "@/lib/projects/projects";

export const metadata = { title: "Project — Overview" };
export const dynamic = "force-dynamic";

interface Props {
  params: Promise<{ clientId: string; projectId: string }>;
}

export default async function ProjectOverviewPage({ params }: Props) {
  const { projectId } = await params;
  const project = await getProject(projectId);
  if (!project) notFound();

  const blueprintHref = project.blueprint_id
    ? `/admin/solution-blueprints/${project.blueprint_id}`
    : null;

  return (
    <ProjectOverview
      project={project}
      audience="admin"
      blueprintHref={blueprintHref}
    />
  );
}
