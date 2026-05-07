"use client";

import { motion, useInView } from "framer-motion";
import { useRef } from "react";
import { cn } from "@/lib/cn";

type Props = {
  /** Total stroke length & direction. */
  orientation?: "horizontal" | "vertical";
  /** Length in CSS pixels for `vertical`; px width for `horizontal`. */
  length?: number | string;
  className?: string;
  delay?: number;
  /** Spring physics. */
  stiffness?: number;
  damping?: number;
};

/**
 * SVG line that draws itself in (pathLength 0 → 1) when scrolled into
 * view. Use as a divider between sections / between rows of solutions.
 */
export function DrawLine({
  orientation = "horizontal",
  length = "100%",
  className,
  delay = 0,
  stiffness = 200,
  damping = 30,
}: Props) {
  const ref = useRef<SVGSVGElement>(null);
  const inView = useInView(ref, { once: true, amount: 0.6 });

  const isHoriz = orientation === "horizontal";

  const styleProps: React.CSSProperties = isHoriz
    ? { width: typeof length === "number" ? `${length}px` : length, height: 1 }
    : { width: 1, height: typeof length === "number" ? `${length}px` : length };

  return (
    <svg
      ref={ref}
      className={cn(className)}
      style={styleProps}
      preserveAspectRatio="none"
      viewBox={isHoriz ? "0 0 100 1" : "0 0 1 100"}
    >
      <motion.line
        x1={0}
        y1={isHoriz ? 0.5 : 0}
        x2={isHoriz ? 100 : 0}
        y2={isHoriz ? 0.5 : 100}
        stroke="currentColor"
        strokeWidth={1}
        vectorEffect="non-scaling-stroke"
        initial={{ pathLength: 0, opacity: 0 }}
        animate={
          inView ? { pathLength: 1, opacity: 1 } : { pathLength: 0, opacity: 0 }
        }
        transition={{
          pathLength: { type: "spring", stiffness, damping, delay },
          opacity: { duration: 0.2, delay },
        }}
        style={{ willChange: "stroke-dashoffset, opacity" }}
      />
    </svg>
  );
}
