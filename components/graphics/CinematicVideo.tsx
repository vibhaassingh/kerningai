"use client";

import Image from "next/image";
import { useEffect, useRef, useState } from "react";
import { cn } from "@/lib/cn";
import type { CinematicAsset } from "@/lib/media";

type Props = {
  /** mp4 URL — Pexels CDN or self-hosted. */
  src: string;
  /** Still rendered immediately + as the reduced-motion fallback. */
  poster: string;
  alt: string;
  /** Aspect ratio (w/h). Default 16/10. */
  aspect?: number;
  /** Object-position bias when the natural crop drops the focus. */
  focal?: CinematicAsset["focal"];
  /** Mono caption painted at the bottom-left. */
  caption?: string;
  /** Right-aligned mono index, e.g. "01 / 03". */
  index?: string;
  /** Skip the brand grayscale + contrast filter. Rare. */
  noFilter?: boolean;
  /** Eager: mount the <video> immediately (e.g. above-the-fold). */
  priority?: boolean;
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
 * CinematicVideo — `<CinematicImage />`-shaped wrapper for autoplaying
 * silent loops. The poster paints first; the video element is only
 * mounted when the wrapper scrolls into view (or immediately when
 * `priority`). Reduced-motion users see the poster only — the
 * <video> never mounts. If the mp4 fails to fetch, the poster stays.
 *
 * Uniform brand treatment matches CinematicImage:
 *   filter: grayscale(1) contrast(1.08) brightness(0.92)
 *   + dark gradient overlay
 *   + corner ticks
 */
export function CinematicVideo({
  src,
  poster,
  alt,
  aspect = 16 / 10,
  focal = "centre",
  caption,
  index,
  noFilter = false,
  priority = false,
  className,
}: Props) {
  const wrapRef = useRef<HTMLDivElement>(null);
  const videoRef = useRef<HTMLVideoElement>(null);
  const [shouldMountVideo, setShouldMountVideo] = useState(priority);
  const [reduced, setReduced] = useState(false);
  const [canPlay, setCanPlay] = useState(false);

  useEffect(() => {
    const m = window.matchMedia("(prefers-reduced-motion: reduce)");
    const apply = () => setReduced(m.matches);
    apply();
    m.addEventListener("change", apply);
    return () => m.removeEventListener("change", apply);
  }, []);

  // Lazy-mount the <video> only when the wrapper enters the viewport.
  useEffect(() => {
    if (priority) return;
    if (reduced) return;
    const el = wrapRef.current;
    if (!el) return;
    const obs = new IntersectionObserver(
      (entries) => {
        const e = entries[0];
        if (e?.isIntersecting) {
          setShouldMountVideo(true);
          obs.disconnect();
        }
      },
      { threshold: 0.15, rootMargin: "200px" },
    );
    obs.observe(el);
    return () => obs.disconnect();
  }, [priority, reduced]);

  useEffect(() => {
    const v = videoRef.current;
    if (!v) return;
    const onCanPlay = () => setCanPlay(true);
    v.addEventListener("canplay", onCanPlay);
    v.play().catch(() => {
      /* Autoplay blocked — poster stays. */
    });
    return () => v.removeEventListener("canplay", onCanPlay);
  }, [shouldMountVideo]);

  // Default: keep natural colour; light contrast + saturation lift so
  // the source pops a touch without being lurid.
  const filter = noFilter
    ? "none"
    : "contrast(1.06) saturate(1.05) brightness(0.94)";
  const objectPosition = FOCAL_TO_POSITION[focal];

  return (
    <div
      ref={wrapRef}
      className={cn(
        "cinematic-video relative overflow-hidden border border-[var(--color-hairline)] bg-[var(--color-bg-elev)]",
        className,
      )}
      style={{ aspectRatio: String(aspect) }}
    >
      {/* Always-rendered poster — instant first paint + permanent
          fallback when the mp4 cannot play. */}
      <Image
        src={poster}
        alt={alt}
        fill
        priority={priority}
        sizes="(min-width: 1280px) 1280px, 100vw"
        quality={82}
        className="object-cover"
        style={{ filter, objectPosition }}
      />

      {shouldMountVideo && !reduced && (
        <video
          ref={videoRef}
          src={src}
          poster={poster}
          autoPlay
          loop
          muted
          playsInline
          preload="metadata"
          aria-hidden
          className={cn(
            "absolute inset-0 h-full w-full object-cover transition-opacity duration-1000 ease-[cubic-bezier(0.22,1,0.36,1)]",
            canPlay ? "opacity-100" : "opacity-0",
          )}
          style={{ filter, objectPosition, willChange: "opacity" }}
        />
      )}

      {/* Brand legibility scrim — same shape as CinematicImage. */}
      <div
        aria-hidden
        className="pointer-events-none absolute inset-0"
        style={{
          background:
            "linear-gradient(to bottom, rgba(0,0,0,0.40) 0%, rgba(0,0,0,0.20) 35%, rgba(0,0,0,0.55) 80%, rgba(0,0,0,0.80) 100%)",
        }}
      />

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
