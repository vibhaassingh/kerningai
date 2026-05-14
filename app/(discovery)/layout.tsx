import type { ReactNode } from "react";
import Link from "next/link";

import { Logo } from "@/components/chrome/Logo";

export const metadata = {
  robots: { index: true, follow: true },
};

/**
 * Public discovery shell — separate from the marketing site so we can
 * skip Lenis smooth-scroll (forms need native behaviour) and the heavy
 * homepage Nav. Same warm dark canvas + ambient gradient.
 */
export default function DiscoveryLayout({ children }: { children: ReactNode }) {
  return (
    <main className="relative min-h-dvh overflow-hidden bg-bg text-text">
      <div
        aria-hidden
        className="pointer-events-none absolute inset-0 -z-10 opacity-60"
        style={{
          background:
            "radial-gradient(60% 50% at 12% 8%, rgba(241,173,61,0.07), transparent 70%), radial-gradient(40% 40% at 88% 92%, rgba(241,173,61,0.05), transparent 65%)",
        }}
      />

      <header className="flex items-center justify-between px-6 pt-8 sm:px-12">
        <Logo className="h-7 w-auto" />
        <Link
          href="/"
          className="nav-link text-[12px] uppercase tracking-[0.12em] text-[var(--color-text-muted)]"
        >
          Back to site ↗
        </Link>
      </header>

      <div className="mx-auto max-w-3xl px-6 py-16 sm:px-12">{children}</div>

      <footer className="border-t border-hairline px-6 py-6 text-[11px] uppercase tracking-[0.12em] text-[var(--color-text-muted)] sm:px-12">
        <div className="mx-auto flex max-w-3xl items-center justify-between">
          <span>Kerning AI · discovery</span>
          <span className="text-[var(--color-text-faint)]">
            Autosaves as you type · ~10 min
          </span>
        </div>
      </footer>
    </main>
  );
}
