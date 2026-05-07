import { cn } from "@/lib/cn";

type Props = {
  index?: string;
  total?: string;
  className?: string;
};

/**
 * Quiet `01 / 08` index for the top-right corner of sections.
 * Family aesthetic — minimal, no brackets, sized to disappear unless
 * sought.
 */
export function SectionIndex({ index, total, className }: Props) {
  if (!index && !total) return null;
  return (
    <p
      className={cn(
        "font-mono text-[12px] tracking-[0.04em] text-[var(--color-text-muted)]",
        className,
      )}
    >
      {index && <span className="text-[var(--color-text)]">{index}</span>}
      {total && (
        <>
          <span className="mx-1 text-[var(--color-text-faint)]">/</span>
          <span>{total}</span>
        </>
      )}
    </p>
  );
}
