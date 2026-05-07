"use client";

import Image from "next/image";
import { useEffect, useRef, useState } from "react";
import { cn } from "@/lib/cn";

type Props = {
  /** mp4 URL (Pexels CDN or self-hosted). */
  src: string;
  /** Still image rendered immediately and behind the video while it
   *  buffers. Also the reduced-motion fallback. */
  poster: string;
  alt?: string;
  /** Overlay opacity (0–1). Default 0.6 — heavy enough that hero type
   *  reads on a wide range of source brightness. */
  overlay?: number;
  /** Skip the brand grayscale and keep the source's natural colour.
   *  Still applies a subtle contrast bump for cinematic depth. */
  colourful?: boolean;
  className?: string;
};

/**
 * HeroVideoBackground — full-bleed silent loop intended to sit behind
 * the landing hero. autoPlay + muted + playsInline + loop satisfies
 * mobile autoplay rules. Honours `prefers-reduced-motion` by falling
 * back to the still poster image. The whole element is `aria-hidden`
 * — it's atmosphere, not content.
 *
 * Layout contract: caller positions this as `absolute inset-0`
 * inside a `relative` parent. Foreground content goes in a sibling
 * with `relative z-10`.
 */
export function HeroVideoBackground({
  src,
  poster,
  alt = "",
  overlay = 0.6,
  colourful = false,
  className,
}: Props) {
  // Default keeps natural source colour with a subtle contrast lift.
  // Pass `colourful={false}` only if a particular hero needs the
  // legacy monochrome wash.
  const filter = colourful
    ? "contrast(1.06) brightness(0.95) saturate(1.05)"
    : "contrast(1.06) brightness(0.95) saturate(1.05)";
  const videoRef = useRef<HTMLVideoElement>(null);
  const [reduced, setReduced] = useState(false);
  const [canPlay, setCanPlay] = useState(false);

  useEffect(() => {
    const m = window.matchMedia("(prefers-reduced-motion: reduce)");
    const apply = () => setReduced(m.matches);
    apply();
    m.addEventListener("change", apply);
    return () => m.removeEventListener("change", apply);
  }, []);

  useEffect(() => {
    const v = videoRef.current;
    if (!v || reduced) return;
    const onCanPlay = () => setCanPlay(true);
    v.addEventListener("canplay", onCanPlay);
    // Some browsers stall autoplay until a user gesture; nudge it on
    // mount when the policy allows.
    v.play().catch(() => {
      /* Autoplay blocked — poster will keep showing. */
    });
    return () => v.removeEventListener("canplay", onCanPlay);
  }, [reduced]);

  return (
    <div
      aria-hidden
      className={cn(
        "hero-video pointer-events-none absolute inset-0 overflow-hidden bg-[var(--color-bg)]",
        className,
      )}
    >
      {/* Always-rendered poster — instant first paint, also the
          reduced-motion fallback. */}
      <Image
        src={poster}
        alt={alt}
        fill
        priority
        sizes="100vw"
        quality={80}
        className="object-cover"
        style={{ filter }}
      />

      {!reduced && (
        <video
          ref={videoRef}
          src={src}
          poster={poster}
          autoPlay
          loop
          muted
          playsInline
          preload="metadata"
          className="absolute inset-0 h-full w-full object-cover transition-opacity duration-1000 ease-[cubic-bezier(0.22,1,0.36,1)]"
          style={{
            filter,
            opacity: canPlay ? 1 : 0,
            willChange: "opacity",
          }}
        />
      )}

      {/* Flat scrim — base legibility floor. */}
      <div
        aria-hidden
        className="absolute inset-0"
        style={{ backgroundColor: `rgba(0, 0, 0, ${overlay})` }}
      />

      {/* Directional shadow anchored to the headline (left ⇒ right
          gradient). Pulls extra darkness behind the white type so it
          reads on bright frames without nuking the colour on the
          right side of the canvas. */}
      <div
        aria-hidden
        className="absolute inset-0"
        style={{
          background:
            "linear-gradient(to right, rgba(0,0,0,0.55) 0%, rgba(0,0,0,0.25) 45%, rgba(0,0,0,0.05) 75%, transparent 100%)",
        }}
      />

      {/* Top + bottom feathered fades — top heavier so the nav glass
          pill always sits on a uniformly dark band. */}
      <div
        aria-hidden
        className="absolute inset-0"
        style={{
          background:
            "linear-gradient(to bottom, var(--color-bg) 0%, rgba(12,12,14,0.8) 8%, transparent 22%, transparent 70%, var(--color-bg) 100%)",
        }}
      />
    </div>
  );
}
