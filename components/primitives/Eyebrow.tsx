import { cn } from "@/lib/cn";
import type { ReactNode } from "react";

type Props = {
  children: ReactNode;
  className?: string;
  /** Numeric prefix, e.g. "01". Renders as `01 — Label`. */
  number?: string;
};

/**
 * Family-style section label: `01 — Label`.
 * Em-dash separator, mono small, mixed case. Mirrors the format used
 * across studio.kerning.ooo + hospitality.kerning.ooo.
 */
export function Eyebrow({ children, className, number }: Props) {
  return (
    <p
      className={cn(
        "font-mono text-[12px] tracking-[0.04em] text-[var(--color-text-muted)]",
        className,
      )}
    >
      {number && (
        <>
          <span className="text-[var(--color-text)]">{number}</span>
          <span className="mx-2 text-[var(--color-text-faint)]">—</span>
        </>
      )}
      <span>{children}</span>
    </p>
  );
}
