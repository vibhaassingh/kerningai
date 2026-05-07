"use client";

import Link from "next/link";
import { motion } from "framer-motion";
import { MaskedReveal } from "@/components/primitives/MaskedReveal";
import { HeroVideoBackground } from "@/components/graphics/HeroVideoBackground";
import { HERO_VIDEO } from "@/lib/media";

export function Hero() {
  return (
    <section
      id="hero"
      className="relative isolate overflow-hidden bg-[var(--color-bg)] pt-40 md:pt-56"
    >
      {/* Cinematic ambient backdrop — autoplaying silent loop with a
          legibility scrim. Reduced-motion users see the still poster. */}
      <HeroVideoBackground
        src={HERO_VIDEO.src}
        poster={HERO_VIDEO.poster}
        alt={HERO_VIDEO.alt}
        overlay={0.55}
        colourful
      />

      <div className="relative z-10 mx-auto w-full max-w-[1440px] px-6 md:px-10">
        <motion.p
          initial={{ opacity: 0, y: 8 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, ease: [0.22, 1, 0.36, 1] }}
          className="font-mono text-[12px] tracking-[0.04em] text-[var(--color-text-muted)]"
        >
          <span className="text-[var(--color-text)]">Kerning AI</span>
          <span className="mx-2 text-[var(--color-text-faint)]">—</span>
          <span>Operational intelligence for Industry 5.0</span>
        </motion.p>

        <h1 className="text-display text-hero-shadow mt-12 font-medium text-[clamp(3.4rem,11vw,12rem)] leading-[0.92] tracking-[-0.04em]">
          <MaskedReveal stiffness={200} damping={22}>
            <span>Industry 5.0,</span>
          </MaskedReveal>
          <MaskedReveal delay={0.08} stiffness={200} damping={22}>
            <span className="italic text-[var(--color-signal)]">
              on the floor.
            </span>
          </MaskedReveal>
        </h1>

        <div className="mt-16 grid gap-12 pb-32 md:grid-cols-12 md:items-end md:pb-44">
          <motion.p
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{
              delay: 0.4,
              duration: 0.7,
              ease: [0.22, 1, 0.36, 1],
            }}
            className="max-w-xl text-[clamp(1.1rem,1.4vw,1.4rem)] leading-[1.45] text-[var(--color-text-muted)] md:col-span-7"
          >
            An operational intelligence platform for industries that build with
            their hands. An ontology-led approach to Industry 5.0, retuned for
            the floor.
          </motion.p>

          <motion.div
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{
              delay: 0.55,
              duration: 0.7,
              ease: [0.22, 1, 0.36, 1],
            }}
            className="flex items-center gap-10 md:col-span-5 md:justify-end"
          >
            <Link
              href="/contact"
              className="nav-link text-[15px] tracking-[0.01em] text-[var(--color-text)]"
            >
              Start a conversation →
            </Link>
            <Link
              href="/services"
              className="nav-link text-[15px] tracking-[0.01em] text-[var(--color-text-muted)] hover:text-[var(--color-text)]"
            >
              Explore the platform
            </Link>
          </motion.div>
        </div>
      </div>
    </section>
  );
}
