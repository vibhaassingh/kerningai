"use client";

import { motion } from "framer-motion";
import { useEffect, useState } from "react";
import { HudBracket } from "@/components/primitives/HudBracket";
import { ScrambleText } from "@/components/primitives/ScrambleText";

type Card = {
  label: string;
  metric: string;
  title: string;
  body: string;
  status: "ok" | "warn" | "live";
};

const CARDS: Card[] = [
  {
    label: "Energy",
    metric: "−12.4%",
    title: "Compressor cluster",
    body: "Plant 04 · 12.4% under baseline mtd",
    status: "ok",
  },
  {
    label: "Asset",
    metric: "T−19d",
    title: "Combi oven #07",
    body: "Compressor drift detected · forecast 19 days",
    status: "warn",
  },
  {
    label: "Agent",
    metric: "Live",
    title: "FSMS variance",
    body: "Drafting QA report for line 2",
    status: "live",
  },
  {
    label: "Region",
    metric: "26.84°N",
    title: "Lucknow · UP",
    body: "Live across 14 properties",
    status: "live",
  },
];

export function HeroDataCards() {
  return (
    <>
      <div className="pointer-events-none absolute right-6 top-32 z-20 flex w-[20rem] flex-col gap-4 md:right-10 md:top-36 md:w-[22rem]">
        <CardWrap delay={1.0}>
          <HudCard {...CARDS[0]!} />
        </CardWrap>
        <CardWrap delay={1.15}>
          <HudCard {...CARDS[1]!} />
        </CardWrap>
      </div>

      <div className="pointer-events-none absolute bottom-28 right-6 z-20 flex w-[20rem] flex-col gap-4 md:bottom-32 md:right-10 md:w-[22rem]">
        <CardWrap delay={1.3}>
          <HudCard {...CARDS[2]!} />
        </CardWrap>
        <CardWrap delay={1.45}>
          <HudCard {...CARDS[3]!} />
        </CardWrap>
      </div>
    </>
  );
}

function CardWrap({
  delay,
  children,
}: {
  delay: number;
  children: React.ReactNode;
}) {
  return (
    <motion.div
      className="pointer-events-auto"
      initial={{ opacity: 0, y: 20, clipPath: "inset(0 100% 0 0)" }}
      animate={{ opacity: 1, y: 0, clipPath: "inset(0 0 0 0)" }}
      transition={{ delay, duration: 0.6, ease: [0.22, 1, 0.36, 1] }}
      style={{ willChange: "transform, opacity, clip-path" }}
    >
      {children}
    </motion.div>
  );
}

function HudCard({ label, metric, title, body, status }: Card) {
  const [mounted, setMounted] = useState(false);
  useEffect(() => setMounted(true), []);

  return (
    <HudBracket label={label} status={status}>
      <div className="flex items-baseline justify-between gap-3">
        <p className="font-display text-[15px] font-medium tracking-tight text-[var(--color-text)]">
          {title}
        </p>
        <p className="font-mono text-[12px] tabular-nums text-[var(--color-text)]">
          {mounted ? <ScrambleText value={metric} duration={0.8} /> : metric}
        </p>
      </div>
      <p className="mt-2 font-mono text-[11px] leading-snug text-[var(--color-text-muted)]">
        {body}
      </p>
    </HudBracket>
  );
}
