import Link from "next/link";
import { Eyebrow } from "@/components/primitives/Eyebrow";
import { MaskedReveal } from "@/components/primitives/MaskedReveal";

export function CTA() {
  return (
    <section className="border-t border-[var(--color-hairline)] bg-[var(--color-bg)] py-24 md:py-40">
      <div className="mx-auto w-full max-w-[1440px] px-6 md:px-10">
        <Eyebrow number="08">Contact</Eyebrow>

        <h2 className="text-display mt-12 text-[clamp(3rem,11vw,11rem)] font-medium leading-[0.92] tracking-[-0.04em]">
          <MaskedReveal stiffness={200} damping={22}>
            <span>Let's create</span>
          </MaskedReveal>
          <MaskedReveal delay={0.08} stiffness={200} damping={22}>
            <span className="italic text-[var(--color-signal)]">
              something epic.
            </span>
          </MaskedReveal>
        </h2>

        <div className="mt-16 grid gap-10 md:grid-cols-12 md:items-end">
          <p className="text-[15px] leading-[1.6] text-[var(--color-text-muted)] md:col-span-6">
            A 30-minute call to map where AI fits in your operation — and where
            it doesn't yet. We reply within 24 hours.
          </p>
          <div className="flex items-center gap-10 md:col-span-6 md:justify-end">
            <Link
              href="/contact"
              className="nav-link text-[15px] tracking-[0.01em] text-[var(--color-text)]"
            >
              Start a conversation →
            </Link>
            <a
              href="mailto:hello@kerningai.eu"
              className="nav-link text-[15px] tracking-[0.01em] text-[var(--color-text-muted)] hover:text-[var(--color-text)]"
            >
              hello@kerningai.eu
            </a>
          </div>
        </div>
      </div>
    </section>
  );
}
