import type { ReactNode } from "react";
import { Eyebrow } from "@/components/primitives/Eyebrow";

interface AuthCardProps {
  number: string;
  eyebrow: string;
  heading: ReactNode;
  description?: ReactNode;
  children: ReactNode;
  footer?: ReactNode;
}

/**
 * Shared shell for every auth page. Numbered Eyebrow + display headline
 * + body + footer link row. Mirrors the family editorial pattern.
 */
export function AuthCard({
  number,
  eyebrow,
  heading,
  description,
  children,
  footer,
}: AuthCardProps) {
  return (
    <div className="space-y-10">
      <header className="space-y-4">
        <Eyebrow number={number}>{eyebrow}</Eyebrow>
        <h1 className="text-display text-[clamp(1.8rem,4.5vw,2.8rem)] font-medium leading-[1.05] tracking-[-0.03em]">
          {heading}
        </h1>
        {description && (
          <p className="max-w-md text-[15px] leading-relaxed text-[var(--color-text-faded)]">
            {description}
          </p>
        )}
      </header>

      <div>{children}</div>

      {footer && (
        <footer className="border-t border-hairline pt-6 text-[12px] tracking-[0.04em] text-[var(--color-text-muted)]">
          {footer}
        </footer>
      )}
    </div>
  );
}
