"use client";

import { motion } from "framer-motion";
import { Eyebrow } from "@/components/primitives/Eyebrow";
import { MaskedReveal } from "@/components/primitives/MaskedReveal";
import { LiquidGlassTile } from "@/components/primitives/LiquidGlassTile";
import { TESTIMONIALS } from "@/content/testimonials";

export function Testimonials() {
  return (
    <section className="border-t border-[var(--color-hairline)] bg-[var(--color-bg)] py-24 md:py-40">
      <div className="mx-auto w-full max-w-[1440px] px-6 md:px-10">
        <Eyebrow number="05">Voices</Eyebrow>

        <h2 className="text-display mt-12 max-w-4xl text-[clamp(2.4rem,5.5vw,5rem)] font-medium leading-[1] tracking-[-0.035em]">
          <MaskedReveal stiffness={200} damping={22}>
            <span>Operators who run</span>
          </MaskedReveal>
          <MaskedReveal delay={0.08} stiffness={200} damping={22}>
            <span className="italic text-[var(--color-signal)]">
              on Kerning.
            </span>
          </MaskedReveal>
        </h2>

        <ul className="mt-24 grid gap-6 md:grid-cols-3">
          {TESTIMONIALS.map((t, i) => (
            <motion.li
              key={t.author}
              initial={{ opacity: 0, y: 16 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true, amount: 0.3 }}
              transition={{
                type: "spring",
                stiffness: 200,
                damping: 22,
                delay: i * 0.08,
              }}
            >
              <LiquidGlassTile
                glow
                className="flex h-full flex-col p-8 md:p-10"
              >
                <header className="flex items-start justify-between font-mono text-[11px] tracking-[0.04em] text-[var(--color-text-muted)]">
                  <span className="flex items-center gap-2">
                    <span
                      aria-hidden
                      className="inline-block h-1.5 w-1.5 bg-[var(--color-signal)]"
                    />
                    {String(i + 1).padStart(2, "0")} — Voice
                  </span>
                </header>

                <blockquote className="mt-12 font-display text-[clamp(1.3rem,1.9vw,1.7rem)] leading-[1.3] tracking-[-0.02em] text-[var(--color-text)]">
                  {t.quote}
                </blockquote>

                <figcaption className="mt-auto pt-12">
                  <p className="font-display text-[17px] tracking-[-0.01em]">
                    {t.author}
                  </p>
                  <p className="mt-1 text-[13px] text-[var(--color-text-muted)]">
                    {t.role}
                  </p>
                </figcaption>
              </LiquidGlassTile>
            </motion.li>
          ))}
        </ul>
      </div>
    </section>
  );
}
