import { cn } from "@/lib/cn";

type Props = {
  className?: string;
  size?: number;
  color?: string;
  show?: ("tl" | "tr" | "bl" | "br")[];
};

/**
 * Tiny L-shaped corner brackets — drop into any positioned element to
 * give it the "bracketed crosshair" telemetry-card framing.
 */
export function CrosshairCorners({
  className,
  size = 6,
  color = "currentColor",
  show = ["tl", "tr", "bl", "br"],
}: Props) {
  const stroke = `1px solid ${color}`;
  const base: React.CSSProperties = {
    position: "absolute",
    width: size,
    height: size,
    pointerEvents: "none",
    color,
  };
  return (
    <>
      {show.includes("tl") && (
        <span
          aria-hidden
          className={cn(className)}
          style={{
            ...base,
            top: -1,
            left: -1,
            borderTop: stroke,
            borderLeft: stroke,
          }}
        />
      )}
      {show.includes("tr") && (
        <span
          aria-hidden
          className={cn(className)}
          style={{
            ...base,
            top: -1,
            right: -1,
            borderTop: stroke,
            borderRight: stroke,
          }}
        />
      )}
      {show.includes("bl") && (
        <span
          aria-hidden
          className={cn(className)}
          style={{
            ...base,
            bottom: -1,
            left: -1,
            borderBottom: stroke,
            borderLeft: stroke,
          }}
        />
      )}
      {show.includes("br") && (
        <span
          aria-hidden
          className={cn(className)}
          style={{
            ...base,
            bottom: -1,
            right: -1,
            borderBottom: stroke,
            borderRight: stroke,
          }}
        />
      )}
    </>
  );
}
