import type { Metadata } from "next";
import { Eyebrow } from "@/components/primitives/Eyebrow";
import { MaskedReveal } from "@/components/primitives/MaskedReveal";
import { GeometricReveal } from "@/components/graphics/GeometricReveal";
import { TEAM } from "@/content/team";
import { LOCATIONS } from "@/content/locations";
import { COMMITMENTS } from "@/content/commitments";
import { CTA } from "@/components/sections/home/CTA";

export const metadata: Metadata = {
  title: "About",
  description:
    "Kerning AI is an operational intelligence platform for industries that build with their hands — an ontology-led approach to Industry 5.0.",
};

const PILLARS = [
  {
    num: "01",
    title: "Ontology",
    body: "Equipment, recipes, people, suppliers, regulations — fused into a single object graph the whole company can reason on.",
  },
  {
    num: "02",
    title: "Agents",
    body: "Reasoning, not reporting. Agents act on the ontology — humans approve consequential calls, agents do the boring work.",
  },
  {
    num: "03",
    title: "Human-centric",
    body: "Built to work alongside the operator, not over them. Multilingual, sovereign-deployable, audit-trailed by default.",
  },
];

export default function AboutPage() {
  return (
    <>
      <section className="bg-[var(--color-bg)] pt-40 md:pt-56">
        <div className="mx-auto w-full max-w-[1440px] px-6 md:px-10">
          <Eyebrow number="01">About</Eyebrow>

          <h1 className="text-display mt-12 text-[clamp(3rem,10vw,11rem)] font-medium leading-[0.92] tracking-[-0.04em]">
            <MaskedReveal stiffness={200} damping={22}>
              <span>Industry 5.0,</span>
            </MaskedReveal>
            <MaskedReveal delay={0.08} stiffness={200} damping={22}>
              <span className="italic text-[var(--color-signal)]">
                on the floor.
              </span>
            </MaskedReveal>
          </h1>

          <div className="mt-16 grid gap-10 md:grid-cols-12">
            <p className="md:col-span-6 md:col-start-7 max-w-md text-[clamp(1.05rem,1.3vw,1.3rem)] leading-[1.55] text-[var(--color-text-muted)]">
              Founded in 2021, Kerning AI is an operational intelligence
              platform for industries that make things in the physical world —
              kitchens, factories, hotel floors, automotive cells. We run on a
              single thesis: the leverage point in a real-world operation
              isn't a chatbot or a dashboard — it's an ontology.
            </p>
          </div>
        </div>
      </section>

      {/* Thesis */}
      <section className="border-t border-[var(--color-hairline)] bg-[var(--color-bg)] py-24 md:py-32">
        <div className="mx-auto w-full max-w-[1440px] px-6 md:px-10">
          <Eyebrow number="02">Thesis</Eyebrow>

          <div className="mt-16 grid gap-12 md:grid-cols-12">
            <h2 className="text-display text-[clamp(2rem,4.4vw,3.6rem)] font-medium leading-[1] tracking-[-0.03em] md:col-span-5">
              <MaskedReveal stiffness={200} damping={22}>
                <span>4.0 was automation.</span>
              </MaskedReveal>
              <MaskedReveal delay={0.08} stiffness={200} damping={22}>
                <span className="italic text-[var(--color-signal)]">
                  5.0 puts the human back.
                </span>
              </MaskedReveal>
            </h2>
            <div className="space-y-6 text-[15px] leading-[1.65] text-[var(--color-text-muted)] md:col-span-6 md:col-start-7">
              <p>
                Industry 4.0 was about wiring sensors, robots, and machines
                together to remove the human. Industry 5.0 puts the human back:
                the chef, the line lead, the maintenance engineer, the brigade
                trainer, the CFO.
              </p>
              <p>
                Our agents work alongside them, with full audit trails of every
                decision. The platform is multilingual by default, runs
                sovereign-deployed where the customer needs it, and treats the
                front-line operator's tacit knowledge as a first-class data
                source.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* Pillars */}
      <section className="border-t border-[var(--color-hairline)] bg-[var(--color-bg)] py-24 md:py-32">
        <div className="mx-auto w-full max-w-[1440px] px-6 md:px-10">
          <Eyebrow number="03">Platform</Eyebrow>

          <div className="mt-16 grid gap-x-10 gap-y-16 md:grid-cols-3">
            {PILLARS.map((p) => (
              <div key={p.num}>
                <span className="font-mono text-[12px] tracking-[0.04em] text-[var(--color-text-muted)]">
                  {p.num}{" "}
                  <span className="mx-1 text-[var(--color-text-faint)]">
                    —
                  </span>{" "}
                  Pillar
                </span>
                <h3 className="text-display mt-8 text-[clamp(1.6rem,2.4vw,2.2rem)] font-medium leading-[1.1] tracking-[-0.025em]">
                  {p.title}
                </h3>
                <p className="mt-4 text-[14px] leading-[1.6] text-[var(--color-text-muted)]">
                  {p.body}
                </p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Commitments */}
      <section className="border-t border-[var(--color-hairline)] bg-[var(--color-bg)] py-24 md:py-32">
        <div className="mx-auto w-full max-w-[1440px] px-6 md:px-10">
          <Eyebrow number="04">Commitments</Eyebrow>

          <div className="mt-16 grid gap-12 md:grid-cols-12 md:items-end">
            <h2 className="text-display text-[clamp(2.2rem,5vw,4.4rem)] font-medium leading-[1] tracking-[-0.035em] md:col-span-7">
              <MaskedReveal stiffness={200} damping={22}>
                <span>Six things we promise</span>
              </MaskedReveal>
              <MaskedReveal delay={0.08} stiffness={200} damping={22}>
                <span className="italic text-[var(--color-signal)]">
                  every floor.
                </span>
              </MaskedReveal>
            </h2>
            <p className="text-[15px] leading-[1.6] text-[var(--color-text-muted)] md:col-span-4 md:col-start-9">
              Industry 5.0 is not a marketing slogan. It's a working contract.
            </p>
          </div>

          <div className="mt-20 grid gap-x-10 gap-y-16 md:grid-cols-2 lg:grid-cols-3">
            {COMMITMENTS.map((c) => (
              <div key={c.number}>
                <span className="font-mono text-[12px] tracking-[0.04em] text-[var(--color-text-muted)]">
                  {c.number}
                </span>
                <h3 className="text-display mt-6 text-[clamp(1.4rem,2vw,1.8rem)] font-medium leading-[1.15] tracking-[-0.02em]">
                  {c.label}
                </h3>
                <p className="mt-4 text-[14px] leading-[1.6] text-[var(--color-text-muted)]">
                  {c.body}
                </p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Leadership */}
      <section className="border-t border-[var(--color-hairline)] bg-[var(--color-bg)] py-24 md:py-32">
        <div className="mx-auto w-full max-w-[1440px] px-6 md:px-10">
          <Eyebrow number="05">Leadership</Eyebrow>

          <h2 className="text-display mt-12 text-[clamp(2.2rem,5vw,4.4rem)] font-medium leading-[1] tracking-[-0.035em]">
            <MaskedReveal stiffness={200} damping={22}>
              <span>The people behind</span>
            </MaskedReveal>
            <MaskedReveal delay={0.08} stiffness={200} damping={22}>
              <span className="italic text-[var(--color-signal)]">
                the platform.
              </span>
            </MaskedReveal>
          </h2>

          <div className="mt-20 grid gap-x-10 gap-y-16 sm:grid-cols-2 lg:grid-cols-4">
            {TEAM.map((m, i) => (
              <div key={m.name}>
                <GeometricReveal
                  aspect={1}
                  cellSize={20}
                  index={String(i + 1).padStart(2, "0")}
                  caption={m.initials}
                >
                  <span
                    aria-hidden
                    className="font-display text-[clamp(2.4rem,4vw,3.4rem)] font-medium tracking-[-0.025em] text-[var(--color-text)]"
                  >
                    {m.initials}
                  </span>
                </GeometricReveal>
                <p className="text-display mt-8 text-[clamp(1.4rem,1.8vw,1.6rem)] font-medium tracking-[-0.02em]">
                  {m.name}
                </p>
                <p className="mt-1 text-[14px] text-[var(--color-text-muted)]">
                  {m.role}
                </p>
                <p className="mt-5 text-[13px] leading-[1.6] text-[var(--color-text-muted)]">
                  {m.bio}
                </p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Locations */}
      <section className="border-t border-[var(--color-hairline)] bg-[var(--color-bg)] py-24 md:py-32">
        <div className="mx-auto w-full max-w-[1440px] px-6 md:px-10">
          <Eyebrow number="06">Locations</Eyebrow>

          <h2 className="text-display mt-12 text-[clamp(2.2rem,5vw,4.4rem)] font-medium leading-[1] tracking-[-0.035em]">
            A team across{" "}
            <span className="italic text-[var(--color-signal)]">
              three continents.
            </span>
          </h2>

          <ul className="mt-20 grid gap-12 md:grid-cols-3">
            {LOCATIONS.map((loc) => (
              <li key={loc.region}>
                <p className="font-mono text-[12px] tracking-[0.04em] text-[var(--color-text-muted)]">
                  {loc.region}, {loc.country}
                </p>
                <p className="text-display mt-6 text-[clamp(1.6rem,2.4vw,2.2rem)] font-medium tracking-[-0.025em]">
                  {loc.city}
                </p>
                <p className="mt-4 text-[14px] leading-[1.6] text-[var(--color-text-muted)]">
                  {loc.address}
                </p>
              </li>
            ))}
          </ul>
        </div>
      </section>

      <CTA />
    </>
  );
}
