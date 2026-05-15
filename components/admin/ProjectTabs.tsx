"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

import { cn } from "@/lib/cn";

interface ProjectTabsProps {
  clientId: string;
  projectId: string;
}

const TABS = [
  { key: "overview", label: "Overview" },
  { key: "workflow-canvas", label: "Workflow Canvas" },
  { key: "proposal/workflow", label: "Proposal" },
] as const;

export function ProjectTabs({ clientId, projectId }: ProjectTabsProps) {
  const pathname = usePathname();
  const base = `/admin/clients/${clientId}/projects/${projectId}`;

  return (
    <nav
      aria-label="Project sections"
      className="-mb-px flex flex-wrap gap-1 border-b border-hairline"
    >
      {TABS.map((tab) => {
        const href = `${base}/${tab.key}`;
        const isActive =
          pathname === href ||
          pathname.startsWith(`${href}/`) ||
          (tab.key === "overview" && pathname === base);
        return (
          <Link
            key={tab.key}
            href={href}
            aria-current={isActive ? "page" : undefined}
            className={cn(
              "border-b-2 px-4 py-3 text-[14px] transition-colors",
              isActive
                ? "border-[var(--color-signal)] font-semibold text-[var(--color-signal)]"
                : "border-transparent text-[var(--color-text-faded)] hover:border-hairline-strong hover:text-text",
            )}
          >
            {tab.label}
          </Link>
        );
      })}
    </nav>
  );
}
