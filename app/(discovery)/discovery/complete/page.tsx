import type { Metadata } from "next";
import Link from "next/link";

import { Eyebrow } from "@/components/primitives/Eyebrow";
import { LiquidPill } from "@/components/primitives/LiquidPill";

export const metadata: Metadata = {
  title: "Discovery received",
};

export const dynamic = "force-dynamic";

interface CompleteProps {
  searchParams: Promise<{ ref?: string }>;
}

export default async function DiscoveryCompletePage({
  searchParams,
}: CompleteProps) {
  const { ref } = await searchParams;
  return (
    <article className="space-y-12">
      <header className="space-y-5">
        <Eyebrow number="00">Received</Eyebrow>
        <h1 className="text-display text-[clamp(2rem,5vw,3rem)] font-medium leading-[1.05] tracking-[-0.03em]">
          Thanks — we've got{" "}
          <span className="italic text-[var(--color-signal)]">it</span>.
        </h1>
        <p className="max-w-xl text-[15px] leading-relaxed text-[var(--color-text-faded)]">
          A Kerning teammate reviews this within two business days and
          comes back with a blueprint: recommended modules, integrations,
          a phase plan, and a complexity score. No commitment.
        </p>
        {ref && (
          <p className="font-mono text-[11.5px] uppercase tracking-[0.12em] text-[var(--color-text-muted)]">
            Reference · {ref.slice(0, 8)}
          </p>
        )}
      </header>

      <section className="rounded-2xl border border-hairline bg-bg-elev/30 p-8">
        <Eyebrow number="01">What happens next</Eyebrow>
        <ol className="mt-4 space-y-3 text-[14.5px] text-[var(--color-text-faded)]">
          <li>
            <strong className="text-text">01 — Review</strong> · we read
            your submission end-to-end and pull together a structured
            plan.
          </li>
          <li>
            <strong className="text-text">02 — Blueprint</strong> · you
            get the plan as a doc + a portal account if you want to
            collaborate live.
          </li>
          <li>
            <strong className="text-text">03 — Decide</strong> · we
            schedule a call, refine the scope, or part as friends.
          </li>
        </ol>
      </section>

      <section className="flex items-center justify-between gap-4 border-t border-hairline pt-8">
        <Link
          href="/"
          className="nav-link text-[12px] uppercase tracking-[0.12em] text-[var(--color-text-muted)]"
        >
          Back to the site
        </Link>
        <LiquidPill href="/insights" variant="accent">
          Read recent insights
        </LiquidPill>
      </section>
    </article>
  );
}
