"use client";

import { motion } from "framer-motion";
import { Eyebrow } from "@/components/primitives/Eyebrow";
import { MaskedReveal } from "@/components/primitives/MaskedReveal";
import { LiquidGlassTile } from "@/components/primitives/LiquidGlassTile";

const POINTS = [
  {
    stat: "12.4%",
    body: "Reduction in compressor-cluster energy consumption against month-to-date baseline at a 14-property hospitality group.",
  },
  {
    stat: "19d",
    body: "Average lead time on equipment-failure forecasts — pre-empted, parts ordered, downtime measured in hours not days.",
  },
  {
    stat: "99%",
    body: "First-pass FSMS variance reports auto-drafted by agents and approved by the line lead inside their normal shift.",
  },
  {
    stat: "3×",
    body: "Faster time-to-value when a deployment leans on the operator's tacit knowledge — multilingual, on the floor, by default.",
  },
];

export function ProofPoints() {
  return (
    <section className="border-t border-[var(--color-hairline)] bg-[var(--color-bg)] py-24 md:py-32">
      <div className="mx-auto w-full max-w-[1440px] px-6 md:px-10">
        <div className="flex items-baseline justify-between">
          <Eyebrow number="01">Outcomes</Eyebrow>
          <p className="hidden font-mono text-[12px] tracking-[0.04em] text-[var(--color-text-muted)] md:block">
            Measured against operational metrics, not dashboards.
          </p>
        </div>

        <h2 className="mt-12 max-w-4xl text-display text-[clamp(2.4rem,5.5vw,5rem)] font-medium leading-[1] tracking-[-0.035em]">
          <MaskedReveal stiffness={200} damping={22}>
            <span>What it actually</span>
          </MaskedReveal>
          <MaskedReveal delay={0.08} stiffness={200} damping={22}>
            <span className="italic text-[var(--color-signal)]">
              changes on the floor.
            </span>
          </MaskedReveal>
        </h2>

        <div className="mt-20 grid gap-4 md:grid-cols-2 lg:grid-cols-4">
          {POINTS.map((p, i) => (
            <motion.div
              key={p.stat}
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
              <LiquidGlassTile glow className="flex h-full flex-col p-6 md:p-8">
                <p className="font-mono text-[11px] tracking-[0.04em] text-[var(--color-text-muted)]">
                  <span
                    aria-hidden
                    className="mr-2 inline-block h-1.5 w-1.5 bg-[var(--color-signal)]"
                  />
                  {String(i + 1).padStart(2, "0")} — Outcome
                </p>
                <p className="text-stat mt-10 text-[clamp(3.8rem,6vw,6.4rem)] font-medium leading-[0.88] text-[var(--color-text)]">
                  {p.stat}
                </p>
                <p className="mt-6 text-[13px] leading-[1.55] text-[var(--color-text-muted)]">
                  {p.body}
                </p>
              </LiquidGlassTile>
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  );
}
