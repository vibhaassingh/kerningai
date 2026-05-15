"use client";

import { useState, useTransition } from "react";

import { switchOrg } from "@/lib/tenancy/org-actions";
import type { Membership } from "@/lib/tenancy/current-org";

interface OrgSwitcherProps {
  memberships: Membership[];
  currentOrgId: string;
}

const TYPE_LABEL: Record<Membership["organizationType"], string> = {
  internal: "Internal",
  client: "Client",
  partner: "Partner",
};

export function OrgSwitcher({ memberships, currentOrgId }: OrgSwitcherProps) {
  const [open, setOpen] = useState(false);
  const [pending, startTransition] = useTransition();
  const current = memberships.find((m) => m.organizationId === currentOrgId);

  if (memberships.length <= 1) {
    // Single membership — no switch UI; just label the current org.
    if (!current) return null;
    return (
      <span className="font-mono text-[11px] uppercase tracking-[0.14em] text-[var(--color-text-muted)]">
        {current.organizationName}
      </span>
    );
  }

  function selectOrg(id: string) {
    setOpen(false);
    startTransition(async () => {
      const fd = new FormData();
      fd.set("organizationId", id);
      await switchOrg(undefined, fd);
    });
  }

  return (
    <div className="relative">
      <button
        type="button"
        onClick={() => setOpen((v) => !v)}
        disabled={pending}
        className="flex items-center gap-2 rounded-full border border-hairline px-3 py-1 font-mono text-[10.5px] uppercase tracking-[0.14em] text-[var(--color-text-faded)] hover:border-[var(--color-signal-deep)] hover:text-text disabled:opacity-50"
        aria-haspopup="listbox"
        aria-expanded={open}
      >
        <span className="text-text">{current?.organizationName ?? "Switch org"}</span>
        <span aria-hidden className="text-[10px]">{open ? "▴" : "▾"}</span>
      </button>

      {open && (
        <ul
          role="listbox"
          className="absolute left-0 top-full z-50 mt-2 max-h-[60vh] w-[280px] overflow-y-auto rounded-xl border border-hairline bg-bg-elev/95 py-1 shadow-2xl backdrop-blur"
        >
          {memberships.map((m) => {
            const isActive = m.organizationId === currentOrgId;
            return (
              <li key={m.organizationId} role="option" aria-selected={isActive}>
                <button
                  type="button"
                  onClick={() => selectOrg(m.organizationId)}
                  disabled={isActive || pending}
                  className="flex w-full items-start justify-between gap-3 px-4 py-3 text-left text-[12.5px] hover:bg-[var(--color-glass-fill)] disabled:cursor-default"
                >
                  <span className="space-y-0.5">
                    <span className="block text-text">{m.organizationName}</span>
                    <span className="block font-mono text-[9.5px] uppercase tracking-[0.14em] text-[var(--color-text-muted)]">
                      {TYPE_LABEL[m.organizationType]} · {m.roleSlug}
                    </span>
                  </span>
                  {isActive && (
                    <span
                      aria-hidden
                      className="font-mono text-[9.5px] uppercase tracking-[0.14em] text-[var(--color-signal)]"
                    >
                      Current
                    </span>
                  )}
                </button>
              </li>
            );
          })}
        </ul>
      )}
    </div>
  );
}
