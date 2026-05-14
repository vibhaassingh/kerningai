"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

import { cn } from "@/lib/cn";

interface ClientTabsProps {
  clientId: string;
}

const TABS = [
  { key: "overview", label: "Overview" },
  { key: "sites", label: "Sites" },
  { key: "users", label: "People" },
  { key: "modules", label: "Modules" },
  { key: "deployments", label: "Deployments" },
] as const;

export function ClientTabs({ clientId }: ClientTabsProps) {
  const pathname = usePathname();
  return (
    <nav
      aria-label="Client sections"
      className="-mb-px flex flex-wrap gap-1 border-b border-hairline"
    >
      {TABS.map((tab) => {
        const href = `/admin/clients/${clientId}/${tab.key}`;
        // Treat the parent `/admin/clients/[id]` as overview.
        const isActive =
          pathname === href ||
          (tab.key === "overview" && pathname === `/admin/clients/${clientId}`);
        return (
          <Link
            key={tab.key}
            href={href}
            className={cn(
              "border-b-2 px-3 py-3 text-[13px] transition-colors",
              isActive
                ? "border-[var(--color-signal)] text-text"
                : "border-transparent text-[var(--color-text-muted)] hover:text-text",
            )}
          >
            {tab.label}
          </Link>
        );
      })}
    </nav>
  );
}
