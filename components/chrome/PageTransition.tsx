"use client";

import { usePathname } from "next/navigation";
import { useEffect, type ReactNode } from "react";

/**
 * Lightweight page transition: scrolls to top on route change. We
 * intentionally do NOT wrap children in AnimatePresence with
 * mode="wait" + key={pathname}, because under React 19 + the App
 * Router that pattern causes "Failed to execute removeChild" errors
 * when components inside the children tree manage their own DOM
 * (canvases, MDX-rendered nodes, framer-motion children of children).
 *
 * The route-level fade is handled at the marketing layout level
 * via CSS — keeping the transition visual but avoiding the unmount
 * race entirely.
 */
export function PageTransition({ children }: { children: ReactNode }) {
  const pathname = usePathname();

  useEffect(() => {
    window.scrollTo({ top: 0, behavior: "auto" });
  }, [pathname]);

  return <>{children}</>;
}
