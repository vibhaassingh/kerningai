"use client";

import Image from "next/image";
import { useEffect, useRef, useState } from "react";
import { cn } from "@/lib/cn";
import type { CinematicAsset } from "@/lib/media";

type Props = {
  /** Direct CDN URL — usually pulled from `lib/media.ts`. */
  src: string;
  alt: string;
  /** Aspect ratio (width/height). Default 16/10 — wide editorial. */
  aspect?: number;
  /** Force a focal anchor for `object-position`. */
  focal?: CinematicAsset["focal"];
  /** Render the page-LCP variant (no fade gate, eager load). */
  priority?: boolean;
  /** Small mono caption painted bottom-left over the overlay. */
  caption?: string;
  /** Right-aligned mono index, e.g. "01 / 06". */
  index?: string;
  /** Skip the grayscale + contrast filter (rare — prefer brand consistency). */
  noFilter?: boolean;
  /** Override the responsive `sizes` attribute. */
  sizes?: string;
  className?: string;
};

const FOCAL_TO_POSITION: Record<NonNullable<Props["focal"]>, string> = {
  centre: "50% 50%",
  top: "50% 20%",
  bottom: "50% 80%",
  left: "20% 50%",
  right: "80% 50%",
};

/**
 * CinematicImage — uniform brand treatment for any stock photograph.
 * Forces grayscale + a small contrast bump + a dark gradient overlay
 * so brutalist white type stays legible on top. Lazy fades in via an
 * IntersectionObserver on first reveal (or appears immediately when
 * `priority` is set).
 *
 * Usage:
 *   <CinematicImage {...media} aspect={16/10} caption="01 — Hospitality" />
 */
export function CinematicImage({
  src,
  alt,
  aspect = 16 / 10,
  focal = "centre",
  priority = false,
  caption,
  index,
  noFilter = false,
  sizes = "(min-width: 1024px) 60vw, 100vw",
  className,
}: Props) {
  const wrapRef = useRef<HTMLDivElement>(null);
  const [revealed, setRevealed] = useState(priority);

  useEffect(() => {
    if (priority) return;
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
      { threshold: 0.15 },
    );
    obs.observe(el);
    return () => obs.disconnect();
  }, [priority]);

  return (
    <div
      ref={wrapRef}
      className={cn(
        "cinematic-image relative overflow-hidden border border-[var(--color-hairline)] bg-[var(--color-bg-elev)]",
        className,
      )}
      style={{ aspectRatio: String(aspect) }}
    >
      <Image
        src={src}
        alt={alt}
        fill
        sizes={sizes}
        priority={priority}
        quality={85}
        className={cn(
          "cinematic-image__img object-cover transition-[opacity,transform,filter] duration-1200 ease-[cubic-bezier(0.22,1,0.36,1)]",
          revealed ? "opacity-100" : "opacity-0",
        )}
        style={{
          objectPosition: FOCAL_TO_POSITION[focal],
          // Default: keep natural colour; bump contrast + slight brightness
          // dip for cinematic depth and legibility under the scrim.
          filter: noFilter
            ? "none"
            : "contrast(1.06) saturate(1.05) brightness(0.94)",
          transform: revealed ? "scale(1)" : "scale(1.04)",
        }}
      />

      {/* Brand-legibility overlay — keeps white type on top crisp. */}
      <div
        aria-hidden
        className="pointer-events-none absolute inset-0"
        style={{
          background:
            "linear-gradient(to bottom, rgba(0,0,0,0.40) 0%, rgba(0,0,0,0.20) 35%, rgba(0,0,0,0.55) 80%, rgba(0,0,0,0.80) 100%)",
        }}
      />

      {/* Engineering corner ticks — visual continuity with GeometricReveal. */}
      <CornerTick position="tl" />
      <CornerTick position="tr" />
      <CornerTick position="bl" />
      <CornerTick position="br" />

      {(caption || index) && (
        <div className="absolute inset-x-4 bottom-3 z-10 flex items-baseline justify-between font-mono text-[11px] tracking-[0.04em] text-[var(--color-text)]">
          <span>{caption}</span>
          <span className="tabular-nums">{index}</span>
        </div>
      )}
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
      className={`pointer-events-none absolute z-10 h-2 w-2 border-[var(--color-text)] ${map[position]}`}
    />
  );
}
