"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

import { cn } from "@/lib/cn";

export interface SidebarItem {
  href: string;
  label: string;
  number?: string;
  badge?: string;
  disabled?: boolean;
}

export interface SidebarSection {
  title: string;
  items: SidebarItem[];
}

interface SidebarNavProps {
  sections: SidebarSection[];
  /** Where the sidebar nav lives. Drives the active highlight prefix-match. */
  rootPath: "/admin" | "/portal";
}

export function SidebarNav({ sections, rootPath }: SidebarNavProps) {
  const pathname = usePathname();

  return (
    <nav className="space-y-10 py-8 text-[13.5px]" aria-label={`${rootPath} navigation`}>
      {sections.map((section) => (
        <div key={section.title} className="space-y-3">
          <h3 className="px-6 text-[10.5px] uppercase tracking-[0.16em] text-[var(--color-text-faint)]">
            {section.title}
          </h3>
          <ul className="space-y-px">
            {section.items.map((item) => {
              const isActive =
                pathname === item.href ||
                (item.href !== rootPath && pathname.startsWith(item.href));
              return (
                <li key={item.href}>
                  {item.disabled ? (
                    <span
                      className="flex items-center gap-3 px-6 py-2 text-[var(--color-text-faint)]"
                      title="Coming in a later phase"
                    >
                      {item.number && (
                        <span className="font-mono text-[11px] text-[var(--color-text-faint)]">
                          {item.number}
                        </span>
                      )}
                      <span>{item.label}</span>
                      {item.badge && (
                        <span className="ml-auto text-[10px] uppercase tracking-[0.12em] text-[var(--color-text-faint)]">
                          {item.badge}
                        </span>
                      )}
                    </span>
                  ) : (
                    <Link
                      href={item.href}
                      className={cn(
                        "group relative flex items-center gap-3 px-6 py-2",
                        "transition-colors duration-200",
                        isActive
                          ? "text-text"
                          : "text-[var(--color-text-faded)] hover:text-text",
                      )}
                    >
                      {isActive && (
                        <span
                          aria-hidden
                          className="absolute left-0 top-1/2 h-5 w-px -translate-y-1/2 bg-[var(--color-signal)]"
                        />
                      )}
                      {item.number && (
                        <span className="font-mono text-[11px] text-[var(--color-text-muted)] group-hover:text-text">
                          {item.number}
                        </span>
                      )}
                      <span>{item.label}</span>
                      {item.badge && (
                        <span className="ml-auto rounded-full bg-[var(--color-signal)]/15 px-2 py-0.5 text-[10px] uppercase tracking-[0.12em] text-[var(--color-signal)]">
                          {item.badge}
                        </span>
                      )}
                    </Link>
                  )}
                </li>
              );
            })}
          </ul>
        </div>
      ))}
    </nav>
  );
}
