import { cn } from "@/lib/cn";
import type { ReactNode } from "react";
import { CrosshairCorners } from "./CrosshairCorners";

type Props = {
  children: ReactNode;
  className?: string;
  /** Top label of the bracketed module (mono, sentence case). */
  label?: string;
  /** Optional system status (live · warn · ok). */
  status?: "live" | "warn" | "ok";
};

/**
 * HUD bracket — thin rectangular module with corner crosshairs and a
 * quiet monospace header. Labels are sentence case, no brackets.
 */
export function HudBracket({ children, className, label, status }: Props) {
  return (
    <div
      className={cn(
        "relative border border-[var(--color-hairline-strong)] bg-[rgba(0,0,0,0.65)] backdrop-blur-md",
        className,
      )}
    >
      <CrosshairCorners size={6} color="var(--color-text)" />
      {label && (
        <header className="flex items-center justify-between border-b border-[var(--color-hairline)] px-3 py-2 font-mono text-[10px] tracking-[0.18em]">
          <span className="flex items-center gap-2 text-[var(--color-text-muted)]">
            {status && <StatusDot status={status} />}
            {label}
          </span>
        </header>
      )}
      <div className="px-3 py-3">{children}</div>
    </div>
  );
}

function StatusDot({ status }: { status: "live" | "warn" | "ok" }) {
  return (
    <span aria-hidden className="relative inline-flex h-1.5 w-1.5">
      {status === "live" && (
        <span
          className="absolute inset-0 animate-ping bg-[var(--color-text)]"
          style={{ opacity: 0.6 }}
        />
      )}
      <span
        className="relative inline-flex h-1.5 w-1.5 bg-[var(--color-text)]"
        style={{ opacity: status === "ok" ? 0.5 : 1 }}
      />
    </span>
  );
}
