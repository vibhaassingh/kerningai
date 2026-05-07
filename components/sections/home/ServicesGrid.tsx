"use client";

import Link from "next/link";
import { motion } from "framer-motion";
import { Eyebrow } from "@/components/primitives/Eyebrow";
import { MaskedReveal } from "@/components/primitives/MaskedReveal";
import {
  KerningIcon,
  SERVICE_ICON_BY_SLUG,
} from "@/components/icons/KerningIcon";
import { SERVICES } from "@/content/services";

export function ServicesGrid() {
  return (
    <section
      id="services"
      className="border-t border-[var(--color-hairline)] bg-[var(--color-bg)] py-24 md:py-40"
    >
      <div className="mx-auto w-full max-w-[1440px] px-6 md:px-10">
        <Eyebrow number="03">Solutions</Eyebrow>

        <div className="mt-12 grid gap-12 md:grid-cols-12 md:items-end">
          <h2 className="text-display text-[clamp(2.4rem,6vw,5.6rem)] font-medium leading-[0.98] tracking-[-0.035em] md:col-span-8">
            <MaskedReveal stiffness={200} damping={22}>
              <span>Six capabilities.</span>
            </MaskedReveal>
            <MaskedReveal delay={0.08} stiffness={200} damping={22}>
              <span className="italic text-[var(--color-signal)]">
                One operating system.
              </span>
            </MaskedReveal>
          </h2>
          <p className="text-[15px] leading-[1.6] text-[var(--color-text-muted)] md:col-span-4">
            Each module runs alone or with the others. Each is measured against
            operational metrics, never vanity dashboards.
          </p>
        </div>

        <ul className="mt-24 divide-y divide-[var(--color-hairline)]">
          {SERVICES.map((service, i) => {
            const iconName = SERVICE_ICON_BY_SLUG[service.slug];
            return (
              <motion.li
                key={service.slug}
                initial={{ opacity: 0, y: 12 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true, amount: 0.4 }}
                transition={{
                  type: "spring",
                  stiffness: 200,
                  damping: 22,
                  delay: (i % 3) * 0.05,
                }}
              >
                <Link
                  href={`/services/${service.slug}`}
                  className="group grid items-center gap-6 py-10 transition-opacity duration-300 md:grid-cols-12 md:py-12"
                >
                  <span className="font-mono text-[12px] tracking-[0.04em] text-[var(--color-text-muted)] md:col-span-1">
                    {service.number}
                  </span>
                  {iconName ? (
                    <span className="text-[var(--color-text-muted)] transition-[color,transform] duration-500 group-hover:text-[var(--color-text)] md:col-span-1">
                      <KerningIcon
                        name={iconName}
                        size={32}
                        label={service.title}
                      />
                    </span>
                  ) : (
                    <span className="md:col-span-1" />
                  )}
                  <h3 className="text-display text-[clamp(1.8rem,3.2vw,2.8rem)] font-medium leading-[1] tracking-[-0.025em] md:col-span-4">
                    <span className="bg-[length:0%_1px] bg-[linear-gradient(currentColor,currentColor)] bg-[position:0_100%] bg-no-repeat pb-1 transition-[background-size] duration-500 ease-[cubic-bezier(0.22,1,0.36,1)] group-hover:bg-[length:100%_1px]">
                      {service.title}
                    </span>
                  </h3>
                  <p className="text-[14px] leading-[1.55] text-[var(--color-text-muted)] md:col-span-5">
                    {service.summary}
                  </p>
                  <span
                    aria-hidden
                    className="text-[18px] text-[var(--color-text-muted)] transition-all duration-500 group-hover:-translate-y-0.5 group-hover:translate-x-0.5 group-hover:text-[var(--color-text)] md:col-span-1 md:justify-self-end"
                  >
                    ↗
                  </span>
                </Link>
              </motion.li>
            );
          })}
        </ul>
      </div>
    </section>
  );
}
