import type { ReactNode } from "react";

import { AccountMenu } from "@/components/chrome/portal/AccountMenu";
import { APP_ENV } from "@/lib/env";

interface TopBarProps {
  fullName: string;
  email: string;
  roleLabel: string;
  organizationLabel: string;
  settingsHref: string;
  switcher?: ReactNode;
}

export function TopBar({
  fullName,
  email,
  roleLabel,
  organizationLabel,
  settingsHref,
  switcher,
}: TopBarProps) {
  const envBadge =
    APP_ENV === "production" ? null : APP_ENV.toUpperCase();
  return (
    <header className="sticky top-0 z-40 border-b border-hairline bg-bg/80 backdrop-blur supports-[backdrop-filter]:bg-bg/60">
      <div className="flex h-14 items-center justify-between gap-4 px-6">
        <div className="flex items-center gap-4">
          {switcher}
          {envBadge && (
            <span className="rounded-full bg-[var(--color-signal)]/15 px-2 py-0.5 font-mono text-[10px] uppercase tracking-[0.14em] text-[var(--color-signal)]">
              {envBadge}
            </span>
          )}
        </div>
        <AccountMenu
          fullName={fullName}
          email={email}
          roleLabel={roleLabel}
          organizationLabel={organizationLabel}
          settingsHref={settingsHref}
        />
      </div>
    </header>
  );
}
