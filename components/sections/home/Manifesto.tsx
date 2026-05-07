"use client";

import { Eyebrow } from "@/components/primitives/Eyebrow";
import { MaskedReveal } from "@/components/primitives/MaskedReveal";

const LINES = [
  { text: "The leverage point", italic: false },
  { text: "isn't a chatbot.", italic: true },
  { text: "It isn't a dashboard.", italic: false },
  { text: "It's an", italic: false, accent: "ontology" },
  { text: "— a single, living model", italic: false },
  { text: "of the operation,", italic: true },
  { text: "on which agents and humans", italic: false },
  { text: "reason about the same reality.", italic: true },
];

export function Manifesto() {
  return (
    <section className="border-t border-[var(--color-hairline)] bg-[var(--color-bg)] py-24 md:py-40">
      <div className="mx-auto w-full max-w-[1280px] px-6 md:px-10">
        <Eyebrow number="02">Thesis</Eyebrow>

        <div className="mt-16 space-y-1 text-display text-[clamp(2rem,5.4vw,5rem)] font-medium leading-[1.04] tracking-[-0.03em]">
          {LINES.map((line, i) => (
            <MaskedReveal
              key={i}
              delay={i * 0.06}
              stiffness={200}
              damping={22}
              className="block"
            >
              <span
                className={
                  line.italic
                    ? "italic text-[var(--color-signal)]"
                    : "text-[var(--color-text)]"
                }
              >
                {line.accent ? (
                  <>
                    {line.text}{" "}
                    <span className="italic">{line.accent}</span>
                  </>
                ) : (
                  line.text
                )}
              </span>
            </MaskedReveal>
          ))}
        </div>
      </div>
    </section>
  );
}
