import type { Metadata } from "next";
import { Eyebrow } from "@/components/primitives/Eyebrow";
import { MaskedReveal } from "@/components/primitives/MaskedReveal";

export const metadata: Metadata = {
  title: "Privacy Policy",
  description:
    "How Kerning AI collects, processes and protects your data — operator-grade and sovereign by default.",
};

const SECTIONS = [
  {
    n: "01",
    title: "What we collect",
    body: "When you contact us through this site, we receive the information you submit — name, work email, company, role, and message. We do not place advertising or third-party tracking cookies. Vercel Analytics records aggregate page-view counts without identifying individual visitors.",
  },
  {
    n: "02",
    title: "How we use it",
    body: "We use submitted contact information solely to respond to your enquiry. We do not sell, rent, or trade personal information. We do not enrich it against external databases or feed it into model training pipelines.",
  },
  {
    n: "03",
    title: "Where it lives",
    body: "Form submissions are sent via Resend to kerningai.eu and retained in our customer-relationship system for the duration of an active engagement. Customer operational data, where Kerning AI is deployed inside a customer environment, resides in the customer's jurisdiction and is governed by the deployment contract — sovereign by default.",
  },
  {
    n: "04",
    title: "Your rights",
    body: "You may request a copy, correction, or deletion of any personal data we hold about you by emailing privacy@kerningai.eu. We respond within thirty days. If you are an EU/EEA or UK resident, the GDPR / UK GDPR rights apply in full.",
  },
  {
    n: "05",
    title: "Cookies",
    body: "We set only strictly-necessary cookies for the site to function. No analytics, advertising, or fingerprinting cookies are placed. Vercel may set technical cookies for the hosting layer.",
  },
  {
    n: "06",
    title: "Changes",
    body: "We update this policy from time to time. Material changes are highlighted on this page with a revised effective date.",
  },
];

export default function PrivacyPage() {
  return (
    <section className="bg-[var(--color-bg)] pt-40 md:pt-56">
      <div className="mx-auto w-full max-w-[920px] px-6 pb-32 md:px-10 md:pb-40">
        <Eyebrow number="01">Privacy</Eyebrow>

        <h1 className="text-display mt-12 text-[clamp(2.4rem,7vw,5.6rem)] font-medium leading-[0.95] tracking-[-0.04em]">
          <MaskedReveal stiffness={200} damping={22}>
            <span>Privacy</span>
          </MaskedReveal>
          <MaskedReveal delay={0.08} stiffness={200} damping={22}>
            <span className="italic text-[var(--color-signal)]">
              policy.
            </span>
          </MaskedReveal>
        </h1>
        <p className="mt-8 font-mono text-[12px] tracking-[0.04em] text-[var(--color-text-muted)]">
          Effective 1 January 2026
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
          Questions?{" "}
          <a
            href="mailto:privacy@kerningai.eu"
            className="nav-link text-[var(--color-text)]"
          >
            privacy@kerningai.eu
          </a>
        </p>
      </div>
    </section>
  );
}
