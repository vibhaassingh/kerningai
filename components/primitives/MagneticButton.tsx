"use client";

import {
  forwardRef,
  useEffect,
  useRef,
  type AnchorHTMLAttributes,
  type ButtonHTMLAttributes,
  type ReactNode,
} from "react";
import { attachMagnetic } from "@/lib/animations/magnetic";
import { prefersReducedMotion, isFinePointer } from "@/lib/animations/reducedMotion";
import { cn } from "@/lib/cn";

type Variant = "primary" | "ghost";

const variantClasses: Record<Variant, string> = {
  // Filled white → inverts to bordered black on hover (industrial toggle).
  primary:
    "bg-[var(--color-text)] text-[var(--color-bg)] border border-[var(--color-text)] hover:bg-[var(--color-bg)] hover:text-[var(--color-text)]",
  // Bordered → fills white on hover.
  ghost:
    "bg-transparent text-[var(--color-text)] border border-[var(--color-hairline-strong)] hover:bg-[var(--color-text)] hover:text-[var(--color-bg)] hover:border-[var(--color-text)]",
};

const baseClasses =
  "group inline-flex items-center gap-3 px-7 py-4 font-mono text-[11px] font-medium uppercase tracking-[0.22em] transition-colors duration-150 ease-[cubic-bezier(0.22,1,0.36,1)] will-change-transform disabled:opacity-60 disabled:cursor-not-allowed";

function ArrowIcon() {
  return (
    <span
      aria-hidden
      className="inline-flex h-3 w-5 items-center transition-transform duration-300 ease-[cubic-bezier(0.22,1,0.36,1)] group-hover:translate-x-1"
    >
      <svg width="20" height="8" viewBox="0 0 20 8" fill="none">
        <path
          d="M0 4h18M14 0l4 4-4 4"
          stroke="currentColor"
          strokeWidth="1"
          strokeLinecap="square"
          strokeLinejoin="miter"
        />
      </svg>
    </span>
  );
}

function useMagnetic(strength: number) {
  const ref = useRef<HTMLElement | null>(null);
  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    if (prefersReducedMotion() || !isFinePointer()) return;
    return attachMagnetic(el as HTMLElement, { strength });
  }, [strength]);
  return ref;
}

// ─── Anchor ────────────────────────────────────────────────────────────

type AnchorProps = AnchorHTMLAttributes<HTMLAnchorElement> & {
  href: string;
  variant?: Variant;
  children: ReactNode;
  className?: string;
  strength?: number;
  cursorLabel?: string;
};

export const MagneticButton = forwardRef<HTMLAnchorElement, AnchorProps>(
  function MagneticButton(
    {
      href,
      variant = "primary",
      children,
      className,
      strength = 0.32,
      cursorLabel,
      ...rest
    },
    ref,
  ) {
    const magneticRef = useMagnetic(strength);
    return (
      <a
        ref={(node) => {
          magneticRef.current = node;
          if (typeof ref === "function") ref(node);
          else if (ref) ref.current = node;
        }}
        href={href}
        data-cursor={cursorLabel ? "view" : "link"}
        data-cursor-label={cursorLabel}
        className={cn(baseClasses, variantClasses[variant], className)}
        {...rest}
      >
        <span className="relative inline-block">{children}</span>
        <ArrowIcon />
      </a>
    );
  },
);

// ─── Submit / button ───────────────────────────────────────────────────

type SubmitProps = ButtonHTMLAttributes<HTMLButtonElement> & {
  variant?: Variant;
  children: ReactNode;
  className?: string;
  strength?: number;
};

export const MagneticSubmit = forwardRef<HTMLButtonElement, SubmitProps>(
  function MagneticSubmit(
    {
      variant = "primary",
      children,
      className,
      strength = 0.32,
      type = "submit",
      ...rest
    },
    ref,
  ) {
    const magneticRef = useMagnetic(strength);
    return (
      <button
        ref={(node) => {
          magneticRef.current = node;
          if (typeof ref === "function") ref(node);
          else if (ref) ref.current = node;
        }}
        type={type}
        data-cursor="link"
        className={cn(baseClasses, variantClasses[variant], className)}
        {...rest}
      >
        <span className="relative inline-block">{children}</span>
        <ArrowIcon />
      </button>
    );
  },
);
