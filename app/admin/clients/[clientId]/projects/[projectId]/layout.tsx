import Link from "next/link";
import { notFound } from "next/navigation";
import type { ReactNode } from "react";

import { getProject } from "@/lib/projects/projects";

export const dynamic = "force-dynamic";

interface Props {
  children: ReactNode;
  params: Promise<{ clientId: string; projectId: string }>;
}

const TABS = [
  { key: "overview", label: "Overview" },
  { key: "workflow-canvas", label: "Workflow Canvas" },
  { key: "proposal/workflow", label: "Proposal" },
] as const;

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
        <nav
          aria-label="Project sections"
          className="-mb-px flex flex-wrap gap-1 border-b border-hairline"
        >
          {TABS.map((tab) => (
            <Link
              key={tab.key}
              href={`/admin/clients/${clientId}/projects/${projectId}/${tab.key}`}
              className="border-b-2 border-transparent px-3 py-3 text-[13px] text-[var(--color-text-muted)] transition-colors hover:border-[var(--color-signal-deep)] hover:text-text"
            >
              {tab.label}
            </Link>
          ))}
        </nav>
      </header>
      <div>{children}</div>
    </div>
  );
}
