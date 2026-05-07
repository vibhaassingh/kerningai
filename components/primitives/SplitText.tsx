"use client";

import { useEffect, useMemo, useRef } from "react";
import { prefersReducedMotion } from "@/lib/animations/reducedMotion";
import { cn } from "@/lib/cn";

type SplitTextProps = {
  children: string;
  /** Delay before the first character starts (seconds). */
  delay?: number;
  /** Stagger between characters (seconds). */
  stagger?: number;
  /** Per-character animation duration (seconds). */
  duration?: number;
  className?: string;
  trigger?: "load" | "inView";
  amount?: number;
};

/**
 * SplitText splits a string into per-character spans rendered through
 * JSX so React owns the DOM. We only mutate inline styles via refs,
 * which React doesn't reconcile — so unmount on route change is safe.
 */
export function SplitText({
  children,
  delay = 0,
  stagger = 0.03,
  duration = 1.0,
  className,
  trigger = "inView",
  amount = 0.3,
}: SplitTextProps) {
  const containerRef = useRef<HTMLSpanElement>(null);

  // Pre-compute the split structure once per text change.
  const parts = useMemo(() => {
    const tokens = children.split(/(\s+)/);
    return tokens.map((tok) => ({
      isSpace: /^\s+$/.test(tok),
      text: tok,
    }));
  }, [children]);

  useEffect(() => {
    const el = containerRef.current;
    if (!el) return;

    const chars = Array.from(
      el.querySelectorAll<HTMLElement>("[data-split-char]"),
    );

    if (prefersReducedMotion()) {
      chars.forEach((c) => {
        c.style.opacity = "1";
        c.style.transform = "none";
      });
      return;
    }

    const timeouts: number[] = [];
    const animateIn = () => {
      chars.forEach((c, i) => {
        const t = window.setTimeout(
          () => {
            c.style.opacity = "1";
            c.style.transform = "translateY(0) skewY(0deg)";
          },
          delay * 1000 + i * stagger * 1000,
        );
        timeouts.push(t);
      });
    };

    if (trigger === "load") {
      animateIn();
      return () => timeouts.forEach((t) => window.clearTimeout(t));
    }

    const io = new IntersectionObserver(
      (entries) => {
        if (entries[0]?.isIntersecting) {
          animateIn();
          io.disconnect();
        }
      },
      { threshold: amount },
    );
    io.observe(el);
    return () => {
      io.disconnect();
      timeouts.forEach((t) => window.clearTimeout(t));
    };
  }, [children, delay, stagger, duration, trigger, amount]);

  const charStyle: React.CSSProperties = {
    display: "inline-block",
    opacity: 0,
    transform: "translateY(110%) skewY(7deg)",
    transition: `transform ${duration}s cubic-bezier(0.22,1,0.36,1), opacity ${duration * 0.6}s cubic-bezier(0.22,1,0.36,1)`,
    willChange: "transform, opacity",
  };

  return (
    <span
      ref={containerRef}
      aria-label={children}
      className={cn("inline-block overflow-hidden align-middle", className)}
    >
      {parts.map((part, i) => {
        if (part.isSpace) {
          // Render whitespace as plain text — React handles it natively.
          return <span key={`s-${i}`}>{part.text}</span>;
        }
        return (
          <span
            key={`w-${i}`}
            aria-hidden
            className="inline-block whitespace-nowrap"
          >
            {Array.from(part.text).map((ch, ci) => (
              <span key={ci} data-split-char style={charStyle}>
                {ch}
              </span>
            ))}
          </span>
        );
      })}
    </span>
  );
}
