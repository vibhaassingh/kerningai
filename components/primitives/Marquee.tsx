import { Children, type ReactNode } from "react";
import { cn } from "@/lib/cn";

type Props = {
  children: ReactNode;
  /** Seconds for one full pass. Lower = faster. */
  duration?: number;
  reverse?: boolean;
  pauseOnHover?: boolean;
  className?: string;
};

/**
 * CSS-driven marquee. The track is a flex of two identical children
 * sets and we translate it from 0 → -50% on a linear infinite loop.
 * Runs entirely on the compositor — zero JS per frame.
 */
export function Marquee({
  children,
  duration = 38,
  reverse = false,
  pauseOnHover = false,
  className,
}: Props) {
  const items = Children.toArray(children);

  return (
    <div
      className={cn(
        "marquee group relative w-full overflow-hidden",
        pauseOnHover && "marquee--pause-on-hover",
        className,
      )}
      style={
        {
          "--marquee-duration": `${duration}s`,
          "--marquee-direction": reverse ? "reverse" : "normal",
        } as React.CSSProperties
      }
    >
      <div className="marquee__track flex w-max gap-12">
        <div className="flex shrink-0 items-center gap-12">{items}</div>
        <div className="flex shrink-0 items-center gap-12" aria-hidden>
          {items}
        </div>
      </div>
      <style>{`
        .marquee__track {
          animation: marquee var(--marquee-duration, 38s) linear infinite;
          animation-direction: var(--marquee-direction, normal);
          will-change: transform;
        }
        .marquee--pause-on-hover:hover .marquee__track {
          animation-play-state: paused;
        }
        @keyframes marquee {
          from { transform: translate3d(0, 0, 0); }
          to   { transform: translate3d(-50%, 0, 0); }
        }
        @media (prefers-reduced-motion: reduce) {
          .marquee__track { animation: none; }
        }
      `}</style>
    </div>
  );
}
