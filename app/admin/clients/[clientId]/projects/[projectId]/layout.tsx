import { notFound } from "next/navigation";
import type { ReactNode } from "react";

import { ProjectTabs } from "@/components/admin/ProjectTabs";
import { getProject } from "@/lib/projects/projects";

export const dynamic = "force-dynamic";

interface Props {
  children: ReactNode;
  params: Promise<{ clientId: string; projectId: string }>;
}

export default async function ProjectLayout({ children, params }: Props) {
  const { clientId, projectId } = await params;
  const project = await getProject(projectId);
  if (!project) notFound();

  return (
    <div className="space-y-10">
      <header className="space-y-3">
        <p className="font-mono text-[10.5px] uppercase tracking-[0.16em] text-[var(--color-signal)]">
          Project
        </p>
        <h1 className="font-display text-[1.6rem] tracking-[-0.01em] text-text">
          {project.name}
        </h1>
        {project.business_label && (
          <p className="font-mono text-[10.5px] uppercase tracking-[0.14em] text-[var(--color-text-muted)]">
            {project.business_label}
          </p>
        )}
        <ProjectTabs clientId={clientId} projectId={projectId} />
      </header>
      <div>{children}</div>
    </div>
  );
}
