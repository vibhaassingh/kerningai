import type { Metadata } from "next";
import Link from "next/link";

import { Eyebrow } from "@/components/primitives/Eyebrow";
import { LiquidPill } from "@/components/primitives/LiquidPill";
import { listPublishedTemplates } from "@/lib/discovery/templates";

export const metadata: Metadata = {
  title: "Start a discovery",
  description:
    "Tell us about your operation. We respond with a structured blueprint.",
};

export const dynamic = "force-dynamic";

export default async function StartPage() {
  const templates = await listPublishedTemplates();
  const count = templates.length;

  return (
    <article className="space-y-12">
      <header className="space-y-5">
        <Eyebrow number="00">Discovery</Eyebrow>
        <h1 className="text-display text-[clamp(2.2rem,6vw,3.6rem)] font-medium leading-[1.02] tracking-[-0.03em]">
          Tell us where the floor{" "}
          <span className="italic text-[var(--color-signal)]">hurts</span>.
        </h1>
        <p className="max-w-xl text-[15.5px] leading-relaxed text-[var(--color-text-faded)]">
          Pick the service that fits closest. Nine short sections.
          Most teams finish in under ten minutes. We come back with a
          structured blueprint inside two business days.
        </p>
      </header>

      <section className="space-y-3 rounded-2xl border border-hairline bg-bg-elev/30 p-8">
        <Eyebrow number="01">How it works</Eyebrow>
        <ol className="space-y-3 text-[14.5px] text-[var(--color-text-faded)]">
          <li>
            <strong className="text-text">01 — Submit</strong> · pick a
            service, answer nine sections.
          </li>
          <li>
            <strong className="text-text">02 — Blueprint</strong> · we
            return a structured plan: modules, integrations, phases,
            complexity score.
          </li>
          <li>
            <strong className="text-text">03 — Decide</strong> · keep
            the blueprint, schedule a call, or stop here. No pressure.
          </li>
        </ol>
      </section>

      <section className="flex items-center justify-between gap-4 border-t border-hairline pt-8">
        <p className="text-[12.5px] uppercase tracking-[0.14em] text-[var(--color-text-muted)]">
          {count} service{count === 1 ? "" : "s"} available
        </p>
        <LiquidPill href="/discovery" variant="accent">
          Choose a service
        </LiquidPill>
      </section>

      <p className="text-[12.5px] text-[var(--color-text-muted)]">
        Already a customer? <Link href="/login" className="nav-link text-text">Sign in</Link> to
        start a discovery from your portal — it attaches to your workspace.
      </p>
    </article>
  );
}
