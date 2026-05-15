"use client";

import { useState, useRef, useEffect } from "react";
import Link from "next/link";

import { cn } from "@/lib/cn";

interface AccountMenuProps {
  fullName: string;
  email: string;
  roleLabel: string;
  organizationLabel: string;
  settingsHref: string;
}

export function AccountMenu({
  fullName,
  email,
  roleLabel,
  organizationLabel,
  settingsHref,
}: AccountMenuProps) {
  const [open, setOpen] = useState(false);
  const containerRef = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    function onClick(e: MouseEvent) {
      if (!containerRef.current?.contains(e.target as Node)) {
        setOpen(false);
      }
    }
    function onKey(e: KeyboardEvent) {
      if (e.key === "Escape") setOpen(false);
    }
    document.addEventListener("mousedown", onClick);
    document.addEventListener("keydown", onKey);
    return () => {
      document.removeEventListener("mousedown", onClick);
      document.removeEventListener("keydown", onKey);
    };
  }, []);

  return (
    <div ref={containerRef} className="relative">
      <button
        type="button"
        onClick={() => setOpen((v) => !v)}
        className={cn(
          "flex items-center gap-3 rounded-full border border-hairline-strong px-3.5 py-1.5",
          "bg-bg-elev/60 text-[13px] text-text",
          "transition-colors duration-200 hover:border-[var(--color-signal)]",
        )}
        aria-haspopup="menu"
        aria-expanded={open}
      >
        <Avatar name={fullName} />
        <span className="hidden text-[12.5px] leading-tight md:flex md:flex-col md:items-start">
          <span>{fullName}</span>
          <span className="text-[10.5px] uppercase tracking-[0.12em] text-[var(--color-text-muted)]">
            {roleLabel}
          </span>
        </span>
      </button>

      {open && (
        <div
          role="menu"
          className="absolute right-0 top-[110%] z-50 w-64 origin-top-right liquid-glass-strong rounded-xl p-2 shadow-xl"
        >
          <div className="px-3 py-2 text-[12px] text-[var(--color-text-faded)]">
            <p className="text-text">{fullName}</p>
            <p>{email}</p>
            <p className="mt-1 text-[10px] uppercase tracking-[0.12em] text-[var(--color-text-faint)]">
              {organizationLabel} · {roleLabel}
            </p>
          </div>
          <hr className="my-1 border-hairline" />
          <Link
            role="menuitem"
            href={settingsHref}
            onClick={() => setOpen(false)}
            className="block rounded-md px-3 py-2 text-[13px] text-[var(--color-text-faded)] hover:bg-bg-elev hover:text-text"
          >
            Security settings
          </Link>
          <Link
            role="menuitem"
            href="/logout"
            className="block rounded-md px-3 py-2 text-[13px] text-[var(--color-text-faded)] hover:bg-bg-elev hover:text-[var(--color-signal)]"
          >
            Sign out ↗
          </Link>
        </div>
      )}
    </div>
  );
}

function Avatar({ name }: { name: string }) {
  const initials = name
    .split(/\s+/)
    .map((part) => part[0])
    .filter(Boolean)
    .slice(0, 2)
    .join("")
    .toUpperCase();
  return (
    <span className="grid h-7 w-7 place-items-center rounded-full bg-[var(--color-signal)]/15 text-[11px] font-medium text-[var(--color-signal)]">
      {initials || "·"}
    </span>
  );
}
