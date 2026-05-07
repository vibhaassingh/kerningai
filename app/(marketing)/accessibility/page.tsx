import type { Metadata } from "next";
import { Eyebrow } from "@/components/primitives/Eyebrow";
import { MaskedReveal } from "@/components/primitives/MaskedReveal";

export const metadata: Metadata = {
  title: "Accessibility",
  description:
    "Our commitment to an accessible Kerning AI experience — keyboard, screen reader, and reduced-motion support.",
};

const SECTIONS = [
  {
    n: "01",
    title: "Our commitment",
    body: "Kerning AI builds for the operator on the floor. That means our marketing site, our product, and our documentation must be usable by everyone — including people who navigate by keyboard, rely on assistive technology, or prefer reduced motion. We aim for WCAG 2.2 AA conformance throughout.",
  },
  {
    n: "02",
    title: "Reduced motion",
    body: "If you have 'Reduce motion' enabled at the OS level, we honour it. Smooth scrolling is disabled and decorative animations are removed. Functional motion that conveys meaning is preserved.",
  },
  {
    n: "03",
    title: "Keyboard navigation",
    body: "Every interactive control on the site is reachable by Tab, activatable by Enter / Space, and shows a visible focus ring.",
  },
  {
    n: "04",
    title: "Screen readers",
    body: "Headings follow a logical hierarchy. Decorative SVGs and icons are hidden from the accessibility tree. Where typography is split into per-character spans for animation, the original sentence is preserved on the parent for assistive technology.",
  },
  {
    n: "05",
    title: "Colour and contrast",
    body: "Body copy on the canvas is tested at ≥ 4.5:1 contrast ratio. State changes use shape, position, or text — not just colour.",
  },
  {
    n: "06",
    title: "Feedback",
    body: "If something on the site doesn't work for you, we want to know. Email accessibility@kerningai.eu and we will respond within five working days.",
  },
];

export default function AccessibilityPage() {
  return (
    <section className="bg-[var(--color-bg)] pt-40 md:pt-56">
      <div className="mx-auto w-full max-w-[920px] px-6 pb-32 md:px-10 md:pb-40">
        <Eyebrow number="01">Accessibility</Eyebrow>

        <h1 className="text-display mt-12 text-[clamp(2rem,6vw,4.6rem)] font-medium leading-[0.95] tracking-[-0.04em]">
          <MaskedReveal stiffness={200} damping={22}>
            <span>Accessibility</span>
          </MaskedReveal>
          <MaskedReveal delay={0.08} stiffness={200} damping={22}>
            <span className="italic text-[var(--color-signal)]">
              statement.
            </span>
          </MaskedReveal>
        </h1>
        <p className="mt-8 font-mono text-[12px] tracking-[0.04em] text-[var(--color-text-muted)]">
          WCAG 2.2 AA · Updated 1 January 2026
        </p>

        <div className="mt-20 space-y-12">
          {SECTIONS.map((s) => (
            <section
              key={s.n}
              className="border-t border-[var(--color-hairline)] pt-8"
            >
              <div className="flex items-baseline gap-6">
                <span className="font-mono text-[12px] tracking-[0.04em] text-[var(--color-text-muted)]">
                  {s.n}
                </span>
                <h2 className="text-display text-[clamp(1.4rem,2.4vw,2rem)] font-medium leading-[1.15] tracking-[-0.025em]">
                  {s.title}
                </h2>
              </div>
              <p className="mt-6 text-[15px] leading-[1.65] text-[var(--color-text-muted)]">
                {s.body}
              </p>
            </section>
          ))}
        </div>

        <p className="mt-20 border-t border-[var(--color-hairline)] pt-8 text-[14px] leading-[1.55] text-[var(--color-text-muted)]">
          Report an issue:{" "}
          <a
            href="mailto:accessibility@kerningai.eu"
            className="nav-link text-[var(--color-text)]"
          >
            accessibility@kerningai.eu
          </a>
        </p>
      </div>
    </section>
  );
}
