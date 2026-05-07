import { Marquee } from "@/components/primitives/Marquee";

const ITEMS = [
  "Operational ontology",
  "Agentic workflows",
  "Predictive maintenance",
  "Energy intelligence",
  "Hygiene compliance",
  "Decision intelligence",
  "Human-in-the-loop",
  "Sovereign by default",
  "Multilingual on the floor",
];

export function LogoMarquee() {
  return (
    <section className="relative border-y border-[var(--color-hairline-strong)] bg-[var(--color-bg)] py-6">
      <Marquee duration={42}>
        {ITEMS.map((item) => (
          <span
            key={item}
            className="inline-flex items-center gap-10 whitespace-nowrap font-mono text-[11px] uppercase tracking-[0.22em] text-[var(--color-text-muted)]"
          >
            {item}
            <span aria-hidden className="inline-block h-1 w-1 bg-[var(--color-text)]" />
          </span>
        ))}
      </Marquee>
    </section>
  );
}
