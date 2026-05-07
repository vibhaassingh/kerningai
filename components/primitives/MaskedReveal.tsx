"use client";

import { motion, useInView } from "framer-motion";
import { useRef, type ReactNode } from "react";
import { cn } from "@/lib/cn";

type Props = {
  children: ReactNode;
  className?: string;
  delay?: number;
  amount?: number;
  /** Spring stiffness — strict spring physics, no linear easing. */
  stiffness?: number;
  damping?: number;
  /** As-prop (block element wrapping the mask). */
  as?: "div" | "span" | "p" | "h1" | "h2" | "h3";
};

/**
 * MaskedReveal — `overflow:hidden` mask containing children that slide
 * up from the baseline as they enter the viewport, driven by strict
 * spring physics (default stiffness 200, damping 20).
 */
export function MaskedReveal({
  children,
  className,
  delay = 0,
  amount = 0.4,
  stiffness = 200,
  damping = 20,
  as = "div",
}: Props) {
  const ref = useRef<HTMLDivElement>(null);
  const inView = useInView(ref, { amount, once: true, margin: "0px 0px -10% 0px" });
  const Tag = motion[as];

  return (
    <Tag
      ref={ref}
      className={cn("overflow-hidden", className)}
      style={{ display: as === "span" ? "inline-block" : undefined }}
    >
      <motion.span
        style={{
          display: "inline-block",
          willChange: "transform, opacity",
        }}
        initial={{ y: "110%", opacity: 0 }}
        animate={inView ? { y: 0, opacity: 1 } : { y: "110%", opacity: 0 }}
        transition={{
          type: "spring",
          stiffness,
          damping,
          delay,
        }}
      >
        {children}
      </motion.span>
    </Tag>
  );
}
