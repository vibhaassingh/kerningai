"use client";

import { useEffect } from "react";
import Lenis from "lenis";
import "lenis/dist/lenis.css";
import { isTouchDevice, prefersReducedMotion } from "@/lib/animations/reducedMotion";

let lenisInstance: Lenis | null = null;

export function getLenis(): Lenis | null {
  return lenisInstance;
}

export function LenisProvider({ children }: { children: React.ReactNode }) {
  useEffect(() => {
    // Skip Lenis entirely on touch devices and reduced-motion. Native
    // scroll on mobile is already smooth and Lenis adds overhead.
    if (prefersReducedMotion()) return;
    if (isTouchDevice()) return;

    const lenis = new Lenis({
      lerp: 0.12,
      smoothWheel: true,
      wheelMultiplier: 1.0,
    });
    lenisInstance = lenis;

    let rafId = 0;
    const raf = (time: number) => {
      lenis.raf(time);
      rafId = requestAnimationFrame(raf);
    };
    rafId = requestAnimationFrame(raf);

    let cleanupSync: (() => void) | null = null;
    (async () => {
      const gsapModule = await import("gsap");
      const stModule = await import("gsap/ScrollTrigger");
      const gsap = gsapModule.default;
      const ScrollTrigger = stModule.ScrollTrigger;
      gsap.registerPlugin(ScrollTrigger);
      const { syncLenisWithScrollTrigger } = await import("@/lib/animations/lenis-gsap");
      cleanupSync = syncLenisWithScrollTrigger(lenis, gsap, ScrollTrigger);
    })();

    return () => {
      cancelAnimationFrame(rafId);
      cleanupSync?.();
      lenis.destroy();
      lenisInstance = null;
    };
  }, []);

  return <>{children}</>;
}
