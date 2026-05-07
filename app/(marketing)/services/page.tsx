import type { Metadata } from "next";
import Link from "next/link";
import { Eyebrow } from "@/components/primitives/Eyebrow";
import { MaskedReveal } from "@/components/primitives/MaskedReveal";
import { SERVICES } from "@/content/services";
import { CTA } from "@/components/sections/home/CTA";

export const metadata: Metadata = {
  title: "Solutions",
  description:
    "Six AI capabilities for industries that build with their hands — from operational ontology to decision intelligence.",
};

export default function ServicesIndexPage() {
  return (
    <>
      <section className="bg-[var(--color-bg)] pt-40 md:pt-56">
        <div className="mx-auto w-full max-w-[1440px] px-6 md:px-10">
          <Eyebrow number="01">Solutions</Eyebrow>

          <h1 className="text-display mt-12 text-[clamp(3rem,10vw,11rem)] font-medium leading-[0.92] tracking-[-0.04em]">
            <MaskedReveal stiffness={200} damping={22}>
              <span>Six capabilities</span>
            </MaskedReveal>
            <MaskedReveal delay={0.08} stiffness={200} damping={22}>
              <span className="italic text-[var(--color-signal)]">
                that compound.
              </span>
            </MaskedReveal>
          </h1>

          <p className="mt-12 max-w-2xl text-[clamp(1.05rem,1.3vw,1.3rem)] leading-[1.5] text-[var(--color-text-muted)]">
            Each runs alone or with the others. Each is measured against
            operational metrics — not vanity dashboards.
          </p>
        </div>
      </section>

      <section className="bg-[var(--color-bg)] py-24 md:py-32">
        <div className="mx-auto w-full max-w-[1440px] px-6 md:px-10">
          <ul className="divide-y divide-[var(--color-hairline)] border-y border-[var(--color-hairline)]">
            {SERVICES.map((s) => (
              <li key={s.slug}>
                <Link
                  href={`/services/${s.slug}`}
                  className="group grid items-baseline gap-6 py-12 md:grid-cols-12 md:py-16"
                >
                  <span className="font-mono text-[12px] tracking-[0.04em] text-[var(--color-text-muted)] md:col-span-1">
                    {s.number}
                  </span>
                  <h2 className="text-display text-[clamp(2rem,4vw,3.6rem)] font-medium leading-[1] tracking-[-0.03em] md:col-span-5">
                    <span className="bg-[length:0%_1px] bg-[linear-gradient(currentColor,currentColor)] bg-[position:0_100%] bg-no-repeat pb-1 transition-[background-size] duration-500 ease-[cubic-bezier(0.22,1,0.36,1)] group-hover:bg-[length:100%_1px]">
                      {s.title}
                    </span>
                  </h2>
                  <p className="text-[14px] leading-[1.55] text-[var(--color-text-muted)] md:col-span-5">
                    {s.summary}
                  </p>
                  <span
                    aria-hidden
                    className="text-[18px] text-[var(--color-text-muted)] transition-all duration-500 group-hover:-translate-y-0.5 group-hover:translate-x-0.5 group-hover:text-[var(--color-text)] md:col-span-1 md:justify-self-end"
                  >
                    ↗
                  </span>
                </Link>
              </li>
            ))}
          </ul>
        </div>
      </section>

      <CTA />
    </>
  );
}
