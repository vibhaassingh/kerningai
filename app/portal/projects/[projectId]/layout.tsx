import Link from "next/link";
import { notFound } from "next/navigation";
import type { ReactNode } from "react";

import { ClientShell } from "@/components/portal/ClientShell";
import { getProject } from "@/lib/projects/projects";

export const dynamic = "force-dynamic";

interface Props {
  children: ReactNode;
  params: Promise<{ projectId: string }>;
}

export default async function PortalProjectLayout({ children, params }: Props) {
  const { projectId } = await params;
  const project = await getProject(projectId);
  if (!project) notFound();

  return (
    <ClientShell>
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
          <nav className="-mb-px flex flex-wrap gap-1 border-b border-hairline">
            <Link
              href={`/portal/projects/${projectId}/overview`}
              className="border-b-2 border-transparent px-3 py-3 text-[13px] text-[var(--color-text-muted)] hover:border-[var(--color-signal-deep)] hover:text-text"
            >
              Overview
            </Link>
          </nav>
        </header>
        <div>{children}</div>
      </div>
    </ClientShell>
  );
}
