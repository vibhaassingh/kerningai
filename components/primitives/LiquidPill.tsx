"use client";

import {
  forwardRef,
  useEffect,
  useRef,
  type AnchorHTMLAttributes,
  type ButtonHTMLAttributes,
  type ReactNode,
} from "react";
import {
  motion,
  useMotionValue,
  useReducedMotion,
  useSpring,
} from "framer-motion";
import {
  MAGNETIC_PULL,
  MAGNETIC_RADIUS,
  springs,
  TAP_SCALE,
} from "@/lib/motion-springs";
import { cn } from "@/lib/cn";

type Variant = "default" | "accent";

/**
 * Tracks the cursor inside the pill, exposing CSS vars `--glow-x`,
 * `--glow-y`, `--glow-opacity` so `liquid-pill::before` can render a
 * radial highlight that follows the pointer. Also magnetic-pulls
 * within MAGNETIC_RADIUS px of the element centre.
 */
function useLiquidInteractions<T extends HTMLElement>() {
  const ref = useRef<T | null>(null);
  const reduce = useReducedMotion();
  const x = useMotionValue(0);
  const y = useMotionValue(0);
  const sx = useSpring(x, springs.firm);
  const sy = useSpring(y, springs.firm);

  useEffect(() => {
    const el = ref.current;
    if (!el || reduce) return;

    const onMove = (e: MouseEvent) => {
      const rect = el.getBoundingClientRect();
      const cx = rect.left + rect.width / 2;
      const cy = rect.top + rect.height / 2;
      const dx = e.clientX - cx;
      const dy = e.clientY - cy;
      const dist = Math.hypot(dx, dy);

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

      if (dist > MAGNETIC_RADIUS) {
        if (x.get() !== 0 || y.get() !== 0) {
          x.set(0);
          y.set(0);
        }
        return;
      }
      const fall = 1 - dist / MAGNETIC_RADIUS;
      x.set((dx / MAGNETIC_RADIUS) * MAGNETIC_PULL * fall);
      y.set((dy / MAGNETIC_RADIUS) * MAGNETIC_PULL * fall);
    };
    const onLeave = () => {
      x.set(0);
      y.set(0);
      el.style.setProperty("--glow-opacity", "0");
    };

    window.addEventListener("mousemove", onMove, { passive: true });
    el.addEventListener("mouseleave", onLeave);
    return () => {
      window.removeEventListener("mousemove", onMove);
      el.removeEventListener("mouseleave", onLeave);
    };
  }, [reduce, x, y]);

  return { ref, sx, sy } as const;
}

function PillArrow() {
  return (
    <svg
      viewBox="0 0 14 14"
      fill="none"
      className="h-[0.85em] w-[0.85em] transition-transform duration-300 ease-[cubic-bezier(0.22,1,0.36,1)] group-hover:translate-x-[2px] group-hover:-translate-y-[2px]"
      aria-hidden
    >
      <path
        d="M3.5 10.5L10.5 3.5M10.5 3.5H4.5M10.5 3.5V9.5"
        stroke="currentColor"
        strokeWidth="1.4"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}

type MotionSafeAnchor = Omit<
  AnchorHTMLAttributes<HTMLAnchorElement>,
  | "onAnimationStart"
  | "onAnimationEnd"
  | "onAnimationIteration"
  | "onDrag"
  | "onDragStart"
  | "onDragEnd"
  | "onDragEnter"
  | "onDragLeave"
  | "onDragOver"
  | "onDrop"
>;

type AnchorProps = MotionSafeAnchor & {
  href: string;
  variant?: Variant;
  children: ReactNode;
  className?: string;
  showArrow?: boolean;
};

export const LiquidPill = forwardRef<HTMLAnchorElement, AnchorProps>(
  function LiquidPill(
    {
      href,
      variant = "default",
      children,
      className,
      showArrow = true,
      ...rest
    },
    ref,
  ) {
    const {
      ref: localRef,
      sx,
      sy,
    } = useLiquidInteractions<HTMLAnchorElement>();
    return (
      <motion.a
        ref={(node) => {
          localRef.current = node;
          if (typeof ref === "function") ref(node);
          else if (ref) ref.current = node;
        }}
        href={href}
        style={{ x: sx, y: sy }}
        whileTap={{ scale: TAP_SCALE }}
        transition={springs.snappy}
        className={cn(
          "group liquid-pill text-[0.9rem]",
          variant === "accent" && "liquid-pill--accent",
          className,
        )}
        {...rest}
      >
        <span>{children}</span>
        {showArrow && <PillArrow />}
      </motion.a>
    );
  },
);

type MotionSafeButton = Omit<
  ButtonHTMLAttributes<HTMLButtonElement>,
  | "onAnimationStart"
  | "onAnimationEnd"
  | "onAnimationIteration"
  | "onDrag"
  | "onDragStart"
  | "onDragEnd"
  | "onDragEnter"
  | "onDragLeave"
  | "onDragOver"
  | "onDrop"
>;

type ButtonProps = MotionSafeButton & {
  variant?: Variant;
  children: ReactNode;
  className?: string;
  showArrow?: boolean;
};

export const LiquidPillButton = forwardRef<HTMLButtonElement, ButtonProps>(
  function LiquidPillButton(
    {
      variant = "default",
      children,
      className,
      showArrow = false,
      type = "button",
      ...rest
    },
    ref,
  ) {
    const {
      ref: localRef,
      sx,
      sy,
    } = useLiquidInteractions<HTMLButtonElement>();
    return (
      <motion.button
        ref={(node) => {
          localRef.current = node;
          if (typeof ref === "function") ref(node);
          else if (ref) ref.current = node;
        }}
        type={type}
        style={{ x: sx, y: sy }}
        whileTap={{ scale: TAP_SCALE }}
        transition={springs.snappy}
        className={cn(
          "group liquid-pill text-[0.9rem]",
          variant === "accent" && "liquid-pill--accent",
          className,
        )}
        {...rest}
      >
        <span>{children}</span>
        {showArrow && <PillArrow />}
      </motion.button>
    );
  },
);
