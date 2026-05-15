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
  rootPath: "/admin" | "/portal" | "/partner";
}

export function SidebarNav({ sections, rootPath }: SidebarNavProps) {
  const pathname = usePathname();

  return (
    <nav
      className="space-y-8 py-8 text-[14.5px]"
      aria-label={`${rootPath} navigation`}
    >
      {sections.map((section) => (
        <div key={section.title} className="space-y-2">
          <h3 className="px-5 text-[11px] font-semibold uppercase tracking-[0.16em] text-[var(--color-text-muted)]">
            {section.title}
          </h3>
          <ul className="space-y-1 px-2.5">
            {section.items.map((item) => {
              const isActive =
                pathname === item.href ||
                (item.href !== rootPath && pathname.startsWith(item.href));
              return (
                <li key={item.href}>
                  {item.disabled ? (
                    <span
                      className="flex items-center gap-3 rounded-lg px-3.5 py-2.5 text-[var(--color-text-faint)]"
                      title="Coming in a later phase"
                    >
                      {item.number && (
                        <span className="font-mono text-[11px] text-[var(--color-text-faint)]">
                          {item.number}
                        </span>
                      )}
                      <span>{item.label}</span>
                      {item.badge && (
                        <span className="ml-auto rounded-full border border-hairline px-2 py-0.5 text-[10px] uppercase tracking-[0.12em] text-[var(--color-text-faint)]">
                          {item.badge}
                        </span>
                      )}
                    </span>
                  ) : (
                    <Link
                      href={item.href}
                      aria-current={isActive ? "page" : undefined}
                      className={cn(
                        "group relative flex items-center gap-3 rounded-lg px-3.5 py-2.5",
                        "transition-colors duration-200",
                        isActive
                          ? "bg-[var(--color-signal)]/12 font-semibold text-[var(--color-signal)]"
                          : "text-[var(--color-text-faded)] hover:bg-[var(--color-glass-fill)] hover:text-text",
                      )}
                    >
                      {isActive && (
                        <span
                          aria-hidden
                          className="absolute left-0 top-1/2 h-6 w-[3px] -translate-y-1/2 rounded-r bg-[var(--color-signal)]"
                        />
                      )}
                      {item.number && (
                        <span
                          className={cn(
                            "font-mono text-[11px]",
                            isActive
                              ? "text-[var(--color-signal)]"
                              : "text-[var(--color-text-muted)] group-hover:text-text",
                          )}
                        >
                          {item.number}
                        </span>
                      )}
                      <span>{item.label}</span>
                      {item.badge && (
                        <span className="ml-auto rounded-full bg-[var(--color-signal)]/20 px-2 py-0.5 text-[10px] font-medium uppercase tracking-[0.12em] text-[var(--color-signal)]">
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
