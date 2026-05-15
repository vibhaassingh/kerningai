import Link from "next/link";

import { KerningMonogram } from "@/components/chrome/Logo";

interface PortalBrandProps {
  /** "AI · Admin" or "AI · Portal", etc. */
  subline: string;
  href: string;
}

/**
 * Sidebar masthead — Kerning monogram + sub-brand tag. Mirrors the
 * marketing nav lockup but stripped down for a dense sidebar.
 *
 * We render the lockup directly (no nested Logo component) so we don't
 * end up with `<a>` inside `<a>` (Logo is already a Link).
 */
export function PortalBrand({ subline, href }: PortalBrandProps) {
  return (
    <Link
      href={href}
      className="block border-b border-hairline px-5 py-6 text-text transition-colors hover:bg-[var(--color-glass-fill)]"
      aria-label={`Kerning ${subline}`}
    >
      <div className="flex items-center gap-2">
        <KerningMonogram className="h-[14px]" />
        <span className="text-display text-[16px] tracking-[-0.01em] leading-none">
          AI
        </span>
      </div>
      <p className="mt-1.5 font-mono text-[10.5px] uppercase tracking-[0.16em] text-[var(--color-text-muted)]">
        {subline}
      </p>
    </Link>
  );
}
