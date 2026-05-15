import { Eyebrow } from "@/components/primitives/Eyebrow";

interface ModuleStubProps {
  number: string;
  eyebrow: string;
  heading: React.ReactNode;
  description: string;
  comingNext: string[];
  /** Optional set of "what's already here" data cards. */
  existing?: { label: string; value: string }[];
}

/**
 * Reusable shell for portal modules whose full UI ships in a later
 * phase. Surfaces what's there today + a candid "what's next" list so
 * the customer never sees a dead end.
 */
export function ModuleStub({
  number,
  eyebrow,
  heading,
  description,
  comingNext,
  existing,
}: ModuleStubProps) {
  return (
    <div className="space-y-12">
      <header className="space-y-4">
        <Eyebrow number={number}>{eyebrow}</Eyebrow>
        <h1 className="text-display text-[clamp(2rem,5vw,3rem)] font-medium leading-[1.05] tracking-[-0.03em]">
          {heading}
        </h1>
        <p className="max-w-xl text-[15px] leading-relaxed text-[var(--color-text-faded)]">
          {description}
        </p>
      </header>

      {existing && existing.length > 0 && (
        <section className="grid gap-px overflow-hidden rounded-2xl border border-hairline bg-hairline sm:grid-cols-2 lg:grid-cols-3">
          {existing.map((e) => (
            <article key={e.label} className="space-y-2 bg-bg-elev/40 px-6 py-5">
              <p className="font-mono text-[10px] uppercase tracking-[0.14em] text-[var(--color-text-faint)]">
                {e.label}
              </p>
              <p className="text-stat text-[1.6rem] font-medium text-text">
                {e.value}
              </p>
            </article>
          ))}
        </section>
      )}

      <section className="rounded-2xl border border-dashed border-hairline bg-bg-elev/20 p-8">
        <Eyebrow number="01">What's next</Eyebrow>
        <ul className="mt-4 space-y-2 text-[14px] text-[var(--color-text-faded)]">
          {comingNext.map((line) => (
            <li key={line}>— {line}</li>
          ))}
        </ul>
      </section>
    </div>
  );
}
