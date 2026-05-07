"use client";

import { useEffect, useRef, useState } from "react";
import { prefersReducedMotion } from "@/lib/animations/reducedMotion";

type Props = {
  /** The final settled string. */
  value: string;
  /** Total time (seconds) the scramble runs before settling. */
  duration?: number;
  /** Delay before scrambling starts (seconds). */
  delay?: number;
  /** Character pool to draw scrambled glyphs from. */
  pool?: string;
  className?: string;
};

const DEFAULT_POOL = "0123456789ABCDEFGHJKLMNPQRSTUVWXYZ#$%@&*";

/**
 * Scramble-text — telemetry boot effect. Renders random glyphs from a
 * pool and gradually settles each character to the final value, like
 * a serial line locking on. Per-frame writes happen via refs / direct
 * `textContent` of an internal span to avoid React reconciliation churn.
 */
export function ScrambleText({
  value,
  duration = 0.9,
  delay = 0,
  pool = DEFAULT_POOL,
  className,
}: Props) {
  const ref = useRef<HTMLSpanElement>(null);
  const [mounted, setMounted] = useState(false);

  useEffect(() => setMounted(true), []);

  useEffect(() => {
    if (!mounted) return;
    const el = ref.current;
    if (!el) return;
    if (prefersReducedMotion()) {
      el.textContent = value;
      return;
    }

    let raf = 0;
    let start: number | null = null;
    const totalMs = duration * 1000;
    const delayMs = delay * 1000;

    const step = (now: number) => {
      if (start === null) start = now;
      const elapsed = now - start - delayMs;
      if (elapsed < 0) {
        raf = requestAnimationFrame(step);
        return;
      }
      const progress = Math.min(1, elapsed / totalMs);
      let out = "";
      for (let i = 0; i < value.length; i++) {
        const ch = value[i];
        if (ch === " " || ch === "·" || ch === ".") {
          out += ch;
          continue;
        }
        // Each character "locks" at a slightly different progress
        // threshold so the scramble cascades left-to-right.
        const threshold = (i / value.length) * 0.6 + 0.3;
        if (progress >= threshold) {
          out += ch;
        } else {
          out += pool[Math.floor(Math.random() * pool.length)];
        }
      }
      el.textContent = out;
      if (progress < 1) {
        raf = requestAnimationFrame(step);
      }
    };

    raf = requestAnimationFrame(step);
    return () => cancelAnimationFrame(raf);
  }, [mounted, value, duration, delay, pool]);

  return (
    <span
      ref={ref}
      className={className}
      aria-label={value}
      style={{ display: "inline-block", fontVariantNumeric: "tabular-nums" }}
    >
      {value}
    </span>
  );
}
