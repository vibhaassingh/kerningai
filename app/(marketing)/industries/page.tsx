import type { Metadata } from "next";
import Link from "next/link";
import { Eyebrow } from "@/components/primitives/Eyebrow";
import { MaskedReveal } from "@/components/primitives/MaskedReveal";
import { INDUSTRIES } from "@/content/industries";
import { CTA } from "@/components/sections/home/CTA";

export const metadata: Metadata = {
  title: "Industries",
  description:
    "Operational intelligence for hospitality, manufacturing, and institutional operators.",
};

export default function IndustriesIndexPage() {
  return (
    <>
      <section className="bg-[var(--color-bg)] pt-40 md:pt-56">
        <div className="mx-auto w-full max-w-[1440px] px-6 md:px-10">
          <Eyebrow number="01">Industries</Eyebrow>

          <h1 className="text-display mt-12 text-[clamp(3rem,10vw,11rem)] font-medium leading-[0.92] tracking-[-0.04em]">
            <MaskedReveal stiffness={200} damping={22}>
              <span>Where AI meets</span>
            </MaskedReveal>
            <MaskedReveal delay={0.08} stiffness={200} damping={22}>
              <span className="italic text-[var(--color-signal)]">
                the operation.
              </span>
            </MaskedReveal>
          </h1>
        </div>
      </section>

      <section className="bg-[var(--color-bg)] py-24 md:py-32">
        <div className="mx-auto w-full max-w-[1440px] px-6 md:px-10">
          <ul className="divide-y divide-[var(--color-hairline)] border-y border-[var(--color-hairline)]">
            {INDUSTRIES.map((ind) => (
              <li key={ind.slug}>
                <Link
                  href={`/industries/${ind.slug}`}
                  className="group grid items-baseline gap-6 py-12 md:grid-cols-12 md:py-16"
                >
                  <span className="font-mono text-[12px] tracking-[0.04em] text-[var(--color-text-muted)] md:col-span-1">
                    {ind.number}
                  </span>
                  <h2 className="text-display text-[clamp(2rem,4.2vw,3.6rem)] font-medium leading-[1] tracking-[-0.03em] md:col-span-5">
                    <span className="bg-[length:0%_1px] bg-[linear-gradient(currentColor,currentColor)] bg-[position:0_100%] bg-no-repeat pb-1 transition-[background-size] duration-500 ease-[cubic-bezier(0.22,1,0.36,1)] group-hover:bg-[length:100%_1px]">
                      {ind.name}
                    </span>
                  </h2>
                  <p className="text-[14px] leading-[1.55] text-[var(--color-text-muted)] md:col-span-5">
                    {ind.summary}
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
