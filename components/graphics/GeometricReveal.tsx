"use client";

import { useEffect, useRef, useState, type ReactNode } from "react";
import { cn } from "@/lib/cn";

type Props = {
  /** Aspect ratio of the placeholder (width / height). Default 4/3. */
  aspect?: number;
  /** Pixels between grid lines. Default 32. */
  cellSize?: number;
  /** Optional caption shown at the bottom-left as a mono label. */
  caption?: string;
  /** Optional ref for an index, e.g. "01 / 06". */
  index?: string;
  className?: string;
  children?: ReactNode;
};

/**
 * GeometricReveal — fine 1-pixel grid placeholder. On scroll-into-view
 * it draws the grid lines (column then row, staggered) and runs a
 * scanning highlight across once. Stands in for the photographic
 * imagery the family uses on hospitality / studio without any image
 * imports — pure CSS / SVG, no assets.
 *
 * Use as: <GeometricReveal index="01 / 06" caption="Hospitality" />
 */
export function GeometricReveal({
  aspect = 4 / 3,
  cellSize = 32,
  caption,
  index,
  className,
  children,
}: Props) {
  const wrapRef = useRef<HTMLDivElement>(null);
  const [revealed, setRevealed] = useState(false);

  useEffect(() => {
    const el = wrapRef.current;
    if (!el) return;
    const reduced = window.matchMedia(
      "(prefers-reduced-motion: reduce)",
    ).matches;
    if (reduced) {
      setRevealed(true);
      return;
    }
    const obs = new IntersectionObserver(
      (entries) => {
        const e = entries[0];
        if (e?.isIntersecting) {
          setRevealed(true);
          obs.disconnect();
        }
      },
      { threshold: 0.25 },
    );
    obs.observe(el);
    return () => obs.disconnect();
  }, []);

  return (
    <div
      ref={wrapRef}
      className={cn(
        "geo-reveal relative overflow-hidden border border-[var(--color-hairline)]",
        revealed && "geo-reveal--in",
        className,
      )}
      style={{ aspectRatio: String(aspect) }}
      data-revealed={revealed ? "true" : undefined}
    >
      {/* Vertical grid */}
      <div
        aria-hidden
        className="geo-reveal__cols pointer-events-none absolute inset-0"
        style={{
          backgroundImage:
            "linear-gradient(to right, var(--color-hairline) 1px, transparent 1px)",
          backgroundSize: `${cellSize}px 100%`,
        }}
      />
      {/* Horizontal grid */}
      <div
        aria-hidden
        className="geo-reveal__rows pointer-events-none absolute inset-0"
        style={{
          backgroundImage:
            "linear-gradient(to bottom, var(--color-hairline) 1px, transparent 1px)",
          backgroundSize: `100% ${cellSize}px`,
        }}
      />
      {/* Scanning highlight */}
      <div
        aria-hidden
        className="geo-reveal__scan pointer-events-none absolute inset-y-0 -left-1/3 w-1/3"
        style={{
          background:
            "linear-gradient(to right, transparent, var(--color-hairline-strong), transparent)",
        }}
      />

      {/* Corner ticks for engineering feel */}
      <CornerTick position="tl" />
      <CornerTick position="tr" />
      <CornerTick position="bl" />
      <CornerTick position="br" />

      {/* Optional caption + index */}
      {(caption || index) && (
        <div className="absolute inset-x-4 bottom-3 flex items-baseline justify-between font-mono text-[11px] tracking-[0.04em] text-[var(--color-text-muted)]">
          <span>{caption}</span>
          <span className="tabular-nums">{index}</span>
        </div>
      )}

      {/* Slot for arbitrary overlay content */}
      {children && (
        <div className="absolute inset-0 grid place-items-center">
          {children}
        </div>
      )}

      <style>{`
        .geo-reveal__cols,
        .geo-reveal__rows {
          opacity: 0;
          transition: opacity 900ms cubic-bezier(0.22, 1, 0.36, 1);
        }
        .geo-reveal--in .geo-reveal__cols {
          opacity: 1;
          transition-delay: 60ms;
        }
        .geo-reveal--in .geo-reveal__rows {
          opacity: 1;
          transition-delay: 220ms;
        }
        .geo-reveal__scan {
          opacity: 0;
          transform: translateX(0);
        }
        .geo-reveal--in .geo-reveal__scan {
          animation: geo-reveal-scan 1.6s cubic-bezier(0.22, 1, 0.36, 1) 380ms 1
            forwards;
        }
        @keyframes geo-reveal-scan {
          0%   { transform: translateX(0);                opacity: 0;   }
          15%  { opacity: 1; }
          85%  { opacity: 1; }
          100% { transform: translateX(450%);             opacity: 0;   }
        }
        @media (prefers-reduced-motion: reduce) {
          .geo-reveal__cols,
          .geo-reveal__rows {
            opacity: 1;
            transition: none;
          }
          .geo-reveal__scan {
            display: none;
          }
        }
      `}</style>
    </div>
  );
}

function CornerTick({ position }: { position: "tl" | "tr" | "bl" | "br" }) {
  const map: Record<typeof position, string> = {
    tl: "top-2 left-2 border-t border-l",
    tr: "top-2 right-2 border-t border-r",
    bl: "bottom-2 left-2 border-b border-l",
    br: "bottom-2 right-2 border-b border-r",
  };
  return (
    <span
      aria-hidden
      className={`absolute h-2 w-2 border-[var(--color-text)] ${map[position]}`}
    />
  );
}
