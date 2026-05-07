import Link from "next/link";
import { cn } from "@/lib/cn";

/**
 * Family Kerning monogram — `currentColor` fills, so the parent's
 * text colour drives it. Synced with Hospitality / Arch / Studio.
 */
export function KerningMonogram({ className }: { className?: string }) {
  return (
    <svg
      viewBox="0 0 53.56 33.47"
      preserveAspectRatio="xMidYMid meet"
      aria-hidden
      className={cn("h-full w-auto fill-current", className)}
    >
      <path d="M53.56,13.76V4.81c0-.29-.23-.52-.52-.52h-3.83c-.29,0-.52.23-.52.52v11.13c0,.29-.23.52-.52.52H5.38c-.29,0-.52-.23-.52-.52V4.81c0-.29-.23-.52-.52-.52H.52c-.29,0-.52.23-.52.52v28.15c0,.29.23.52.52.52h3.83c.29,0,.52-.23.52-.52v-11.13c0-.29.23-.52.52-.52h42.8c.29,0,.52.23.52.52v11.13c0,.29.23.52.52.52h3.83c.28,0,.52-.23.52-.52v-8.95c0-.19-.11-.37-.29-.46l-4.24-2.12c-.17-.09-.29-.27-.29-.46v-4.17c0-.2.11-.37.29-.46l4.24-2.12c.18-.09.29-.27.29-.46" />
    </svg>
  );
}

/**
 * Compact lockup: family monogram + sub-brand label "AI". Mirrors
 * the lockup pattern used by Hospitality / Arch / Studio.
 */
export function Logo({ className }: { className?: string }) {
  return (
    <Link
      href="/"
      aria-label="Kerning AI"
      className={cn(
        "inline-flex items-center gap-2 text-current select-none",
        className,
      )}
    >
      <KerningMonogram className="h-[14px]" />
      <span className="text-display text-[1rem] tracking-[-0.01em] leading-none">
        AI
      </span>
    </Link>
  );
}
