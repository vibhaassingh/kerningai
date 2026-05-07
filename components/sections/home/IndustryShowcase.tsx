"use client";

import Link from "next/link";
import { motion } from "framer-motion";
import { Eyebrow } from "@/components/primitives/Eyebrow";
import { MaskedReveal } from "@/components/primitives/MaskedReveal";
import { CinematicImage } from "@/components/graphics/CinematicImage";
import { INDUSTRIES } from "@/content/industries";
import { getIndustryMedia } from "@/lib/media";

export function IndustryShowcase() {
  return (
    <section
      id="industries"
      className="border-t border-[var(--color-hairline)] bg-[var(--color-bg)] py-24 md:py-40"
    >
      <div className="mx-auto w-full max-w-[1440px] px-6 md:px-10">
        <Eyebrow number="04">Industries</Eyebrow>

        <div className="mt-12 grid gap-12 md:grid-cols-12 md:items-end">
          <h2 className="text-display text-[clamp(2.4rem,6vw,5.4rem)] font-medium leading-[0.98] tracking-[-0.035em] md:col-span-8">
            <MaskedReveal stiffness={200} damping={22}>
              <span>Where intelligence</span>
            </MaskedReveal>
            <MaskedReveal delay={0.08} stiffness={200} damping={22}>
              <span className="italic text-[var(--color-signal)]">
                meets industry.
              </span>
            </MaskedReveal>
          </h2>
          <p className="text-[15px] leading-[1.6] text-[var(--color-text-muted)] md:col-span-4">
            Three deployments. One operating model. The platform retunes to
            each, the thesis stays.
          </p>
        </div>

        <ul className="mt-24 grid gap-10 md:grid-cols-3">
          {INDUSTRIES.map((industry, i) => {
            const media = getIndustryMedia(industry.slug);
            return (
              <motion.li
                key={industry.slug}
                initial={{ opacity: 0, y: 16 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true, amount: 0.3 }}
                transition={{
                  type: "spring",
                  stiffness: 200,
                  damping: 22,
                  delay: i * 0.06,
                }}
              >
                <Link
                  href={`/industries/${industry.slug}`}
                  className="group flex h-full flex-col gap-8"
                >
                  {media && (
                    <CinematicImage
                      src={media.src}
                      alt={media.alt}
                      focal={media.focal}
                      aspect={4 / 3}
                      caption={`${industry.number} — ${industry.name}`}
                      sizes="(min-width: 1024px) 30vw, 100vw"
                    />
                  )}
                  <div>
                    <h3 className="text-display text-[clamp(1.6rem,2.6vw,2.4rem)] font-medium leading-[1.05] tracking-[-0.025em]">
                      <span className="bg-[length:0%_1px] bg-[linear-gradient(currentColor,currentColor)] bg-[position:0_100%] bg-no-repeat pb-1 transition-[background-size] duration-500 ease-[cubic-bezier(0.22,1,0.36,1)] group-hover:bg-[length:100%_1px]">
                        {industry.headline}
                      </span>
                    </h3>
                    <p className="mt-4 text-[14px] leading-[1.55] text-[var(--color-text-muted)]">
                      {industry.summary}
                    </p>
                  </div>
                </Link>
              </motion.li>
            );
          })}
        </ul>
      </div>
    </section>
  );
}
