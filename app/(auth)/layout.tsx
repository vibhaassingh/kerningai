import type { ReactNode } from "react";
import Link from "next/link";

import { Logo } from "@/components/chrome/Logo";

export default function AuthLayout({ children }: { children: ReactNode }) {
  return (
    <main className="relative min-h-dvh overflow-hidden bg-bg text-text">
      {/* Quiet ambient gradient — not the marketing hero. Just enough
          warmth to read as a Kerning surface. */}
      <div
        aria-hidden
        className="pointer-events-none absolute inset-0 -z-10 opacity-60"
        style={{
          background:
            "radial-gradient(60% 50% at 15% 10%, rgba(241,173,61,0.06), transparent 70%), radial-gradient(40% 40% at 85% 90%, rgba(241,173,61,0.04), transparent 65%)",
        }}
      />

      <header className="px-6 pt-8 sm:px-10">
        <Logo className="h-7 w-auto" />
      </header>

      <div className="relative mx-auto flex min-h-[calc(100dvh-9rem)] w-full max-w-xl flex-col justify-center px-6 py-12 sm:px-10">
        {children}
      </div>

      <footer className="border-t border-hairline px-6 py-6 text-[11px] uppercase tracking-[0.12em] text-text-muted sm:px-10">
        <div className="mx-auto flex max-w-xl items-center justify-between">
          <span>Kerning AI · operational intelligence</span>
          <Link href="/" className="nav-link">
            Back to site ↗
          </Link>
        </div>
      </footer>
    </main>
  );
}
