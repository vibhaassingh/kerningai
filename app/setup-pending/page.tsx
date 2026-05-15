import type { Metadata } from "next";
import Link from "next/link";

import { Eyebrow } from "@/components/primitives/Eyebrow";
import { Logo } from "@/components/chrome/Logo";

export const metadata: Metadata = {
  title: "Setup pending",
  robots: { index: false, follow: false },
};

/**
 * Shown when middleware sees that Supabase env isn't configured. Avoids
 * a half-broken UI on Preview deploys where the team hasn't pasted env
 * vars yet.
 */
export default function SetupPendingPage() {
  return (
    <main className="relative min-h-dvh overflow-hidden bg-bg text-text">
      <header className="px-6 pt-8 sm:px-10">
        <Logo className="h-7 w-auto" />
      </header>
      <div className="relative mx-auto flex min-h-[calc(100dvh-9rem)] w-full max-w-xl flex-col justify-center px-6 py-12 sm:px-10">
        <Eyebrow number="00">Operator setup</Eyebrow>
        <h1 className="mt-4 text-display text-[clamp(1.8rem,4.5vw,2.8rem)] font-medium leading-[1.05] tracking-[-0.03em]">
          The workspace is{" "}
          <span className="italic text-[var(--color-signal)]">
            being provisioned
          </span>
          .
        </h1>
        <p className="mt-4 max-w-md text-[15px] leading-relaxed text-[var(--color-text-faded)]">
          This environment is missing its Supabase configuration. Once
          the operator finishes setup, sign-in will be available here.
        </p>
        <p className="mt-8 text-[12px] uppercase tracking-[0.12em] text-[var(--color-text-muted)]">
          Operators: see <code className="font-mono text-text">docs/setup.md</code>.
        </p>
        <div className="mt-12">
          <Link
            href="/"
            className="nav-link text-[12px] uppercase tracking-[0.12em] text-[var(--color-text-muted)]"
          >
            Back to the marketing site ↗
          </Link>
        </div>
      </div>
    </main>
  );
}
