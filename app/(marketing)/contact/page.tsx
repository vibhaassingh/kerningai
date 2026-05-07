import type { Metadata } from "next";
import { Eyebrow } from "@/components/primitives/Eyebrow";
import { MaskedReveal } from "@/components/primitives/MaskedReveal";
import { LOCATIONS } from "@/content/locations";
import { ContactForm } from "@/components/sections/shared/ContactForm";

export const metadata: Metadata = {
  title: "Contact",
  description: "Talk to the Kerning AI team — book a 30-minute consultation.",
};

export default function ContactPage() {
  return (
    <>
      <section className="bg-[var(--color-bg)] pt-40 md:pt-56">
        <div className="mx-auto w-full max-w-[1440px] px-6 md:px-10">
          <Eyebrow number="01">Contact</Eyebrow>

          <h1 className="text-display mt-12 text-[clamp(3rem,11vw,11rem)] font-medium leading-[0.92] tracking-[-0.04em]">
            <MaskedReveal stiffness={200} damping={22}>
              <span>Let's create</span>
            </MaskedReveal>
            <MaskedReveal delay={0.08} stiffness={200} damping={22}>
              <span className="italic text-[var(--color-signal)]">
                something epic.
              </span>
            </MaskedReveal>
          </h1>

          <p className="mt-12 max-w-2xl text-[clamp(1.05rem,1.4vw,1.3rem)] leading-[1.55] text-[var(--color-text-muted)]">
            A 30-minute call to map where AI fits in your operation — and
            where it doesn't yet.
          </p>
        </div>
      </section>

      <section className="bg-[var(--color-bg)] py-24 md:py-32">
        <div className="mx-auto grid w-full max-w-[1440px] gap-16 px-6 md:grid-cols-12 md:px-10">
          <div className="md:col-span-7">
            <ContactForm />
          </div>

          <div className="md:col-span-4 md:col-start-9">
            <p className="font-mono text-[12px] tracking-[0.04em] text-[var(--color-text-muted)]">
              Direct lines
            </p>
            <ul className="mt-8 space-y-6">
              <li>
                <p className="font-mono text-[12px] tracking-[0.04em] text-[var(--color-text-muted)]">
                  General
                </p>
                <a
                  href="mailto:hello@kerningai.eu"
                  className="nav-link mt-1 inline-block text-[15px] tracking-[0.01em] text-[var(--color-text)]"
                >
                  hello@kerningai.eu
                </a>
              </li>
              <li>
                <p className="font-mono text-[12px] tracking-[0.04em] text-[var(--color-text-muted)]">
                  Partnerships
                </p>
                <a
                  href="mailto:partners@kerningai.eu"
                  className="nav-link mt-1 inline-block text-[15px] tracking-[0.01em] text-[var(--color-text)]"
                >
                  partners@kerningai.eu
                </a>
              </li>
            </ul>

            <p className="mt-16 font-mono text-[12px] tracking-[0.04em] text-[var(--color-text-muted)]">
              Offices
            </p>
            <ul className="mt-8 space-y-8">
              {LOCATIONS.map((loc) => (
                <li
                  key={loc.region}
                  className="border-t border-[var(--color-hairline)] pt-6"
                >
                  <p className="font-mono text-[12px] tracking-[0.04em] text-[var(--color-text-muted)]">
                    {loc.region}, {loc.country}
                  </p>
                  <p className="text-display mt-3 text-[clamp(1.4rem,2vw,1.6rem)] font-medium tracking-[-0.02em]">
                    {loc.city}
                  </p>
                  <p className="mt-2 text-[14px] leading-[1.6] text-[var(--color-text-muted)]">
                    {loc.address}
                  </p>
                </li>
              ))}
            </ul>
          </div>
        </div>
      </section>
    </>
  );
}
