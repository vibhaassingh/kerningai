"use client";

import {
  forwardRef,
  useEffect,
  useRef,
  type HTMLAttributes,
  type ReactNode,
} from "react";
import { cn } from "@/lib/cn";

type Props = HTMLAttributes<HTMLDivElement> & {
  /** Strong glass surface (heavier blur + brighter rim) instead of standard. */
  strong?: boolean;
  /** Track cursor and paint a radial highlight that follows it. */
  glow?: boolean;
  className?: string;
  children: ReactNode;
};

/**
 * LiquidGlassTile — drop-in liquid-glass `<div>` used wherever a
 * section wants the family glass treatment. Wrap it in an `<a>` /
 * `<Link>` if you need it to be a link target. When `glow` is true,
 * the tile tracks the cursor and paints a radial highlight that
 * follows the pointer (driven by `--glow-x / --glow-y / --glow-opacity`).
 */
export const LiquidGlassTile = forwardRef<HTMLDivElement, Props>(
  function LiquidGlassTile(
    { strong = false, glow = false, className, children, ...rest },
    ref,
  ) {
    const localRef = useRef<HTMLDivElement | null>(null);

    useEffect(() => {
      if (!glow) return;
      const el = localRef.current;
      if (!el) return;
      const reduced = window.matchMedia(
        "(prefers-reduced-motion: reduce)",
      ).matches;
      if (reduced) return;

      const onMove = (e: MouseEvent) => {
        const rect = el.getBoundingClientRect();
        const localX = e.clientX - rect.left;
        const localY = e.clientY - rect.top;
        const inside =
          localX >= -8 &&
          localX <= rect.width + 8 &&
          localY >= -8 &&
          localY <= rect.height + 8;
        el.style.setProperty("--glow-x", `${localX}px`);
        el.style.setProperty("--glow-y", `${localY}px`);
        el.style.setProperty("--glow-opacity", inside ? "1" : "0");
      };
      const onLeave = () => {
        el.style.setProperty("--glow-opacity", "0");
      };

      window.addEventListener("mousemove", onMove, { passive: true });
      el.addEventListener("mouseleave", onLeave);
      return () => {
        window.removeEventListener("mousemove", onMove);
        el.removeEventListener("mouseleave", onLeave);
      };
    }, [glow]);

    return (
      <div
        ref={(node) => {
          localRef.current = node;
          if (typeof ref === "function") ref(node);
          else if (ref) ref.current = node;
        }}
        className={cn(
          "liquid-glass-tile relative overflow-hidden",
          strong ? "liquid-glass-strong" : "liquid-glass",
          className,
        )}
        {...rest}
      >
        {children}
        {glow && (
          <span
            aria-hidden
            className="liquid-glass-tile__glow pointer-events-none absolute inset-0"
          />
        )}
      </div>
    );
  },
);
