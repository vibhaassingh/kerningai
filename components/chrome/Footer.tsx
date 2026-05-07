import Link from "next/link";
import { FOOTER_NAV, LEGAL_NAV } from "@/content/nav";
import { LOCATIONS } from "@/content/locations";
import { FAMILY_BRANDS } from "@/content/family";
import { LiquidGlassTile } from "@/components/primitives/LiquidGlassTile";

export function Footer() {
  return (
    <footer className="relative bg-[var(--color-bg)] text-[var(--color-text)]">
      {/* ── Cross-brand module ─────────────────────────────────────── */}
      <section className="border-t border-[var(--color-hairline)]">
        <div className="mx-auto w-full max-w-[1440px] px-6 py-24 md:px-10 md:py-32">
          <div className="flex items-baseline justify-between gap-6">
            <p className="font-mono text-[12px] tracking-[0.04em] text-[var(--color-text-muted)]">
              <span className="text-[var(--color-text)]">↳</span> Looking for
              another Kerning brand?
            </p>
            <p className="hidden font-mono text-[12px] tracking-[0.04em] text-[var(--color-text-muted)] md:block">
              Family — kerning.ooo
            </p>
          </div>

          <ul className="mt-12 grid gap-4 md:grid-cols-3">
            {FAMILY_BRANDS.map((brand, i) => (
              <li key={brand.name}>
                <a
                  href={brand.href}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="block h-full"
                >
                  <LiquidGlassTile
                    glow
                    className="group flex h-full flex-col justify-between p-8 transition-[transform] duration-500 ease-[cubic-bezier(0.22,1,0.36,1)] hover:-translate-y-0.5 md:p-10"
                  >
                  {/* Top row: index + arrow */}
                  <div className="flex items-start justify-between font-mono text-[11px] tracking-[0.04em] text-[var(--color-text-muted)]">
                    <span className="flex items-center gap-2">
                      <span
                        aria-hidden
                        className="inline-block h-1.5 w-1.5 bg-[var(--color-signal)]"
                      />
                      {String(i + 1).padStart(2, "0")} — Family
                    </span>
                    <span
                      aria-hidden
                      className="text-[var(--color-text-muted)] transition-all duration-500 group-hover:-translate-y-0.5 group-hover:translate-x-0.5 group-hover:text-[var(--color-text)]"
                    >
                      ↗
                    </span>
                  </div>

                  {/* Brand wordmark */}
                  <div className="mt-16">
                    <p className="font-display text-[clamp(1.8rem,3.2vw,3rem)] leading-[1] tracking-[-0.035em] text-[var(--color-text)]">
                      <span className="block text-[var(--color-text-muted)]">
                        Kerning
                      </span>
                      <span className="mt-1 block">{brand.name}</span>
                    </p>
                  </div>

                  {/* Tagline + URL */}
                  <div className="mt-10 border-t border-[var(--color-hairline)] pt-5">
                    <p className="italic text-[14px] leading-relaxed text-[var(--color-text-muted)] transition-colors duration-500 group-hover:text-[var(--color-text)]">
                      {brand.tagline}
                    </p>
                    <p className="mt-3 font-mono text-[10px] tracking-[0.06em] text-[var(--color-text-faint)]">
                      {brand.href.replace(/^https?:\/\//, "")}
                    </p>
                  </div>
                  </LiquidGlassTile>
                </a>
              </li>
            ))}
          </ul>
        </div>
      </section>

      {/* ── Sitemap + locations ────────────────────────────────────── */}
      <section className="border-t border-[var(--color-hairline)]">
        <div className="mx-auto grid w-full max-w-[1440px] gap-16 px-6 py-20 md:grid-cols-12 md:px-10">
          <div className="md:col-span-5">
            <p className="font-mono text-[12px] tracking-[0.04em] text-[var(--color-text-muted)]">
              Kerning AI
            </p>
            <p className="mt-6 max-w-md font-display text-[clamp(1.6rem,2.6vw,2.4rem)] leading-[1.05] tracking-[-0.03em]">
              Industry 5.0,{" "}
              <span className="italic text-[var(--color-signal)]">
                on the floor.
              </span>
            </p>
            <p className="mt-6 max-w-sm text-[14px] leading-relaxed text-[var(--color-text-muted)]">
              Operational intelligence — built in India. Deployed across India,
              the EU and the UK.
            </p>
          </div>

          <div className="grid grid-cols-2 gap-10 md:col-span-7 md:grid-cols-3">
            {Object.entries(FOOTER_NAV).map(([heading, items]) => (
              <div key={heading}>
                <p className="font-mono text-[12px] tracking-[0.04em] text-[var(--color-text-muted)]">
                  {heading}
                </p>
                <ul className="mt-6 space-y-3">
                  {items.map((item) => (
                    <li key={item.href}>
                      <Link
                        href={item.href}
                        className="nav-link text-[14px] tracking-[0.01em] text-[var(--color-text)]"
                      >
                        {item.label}
                      </Link>
                    </li>
                  ))}
                </ul>
              </div>
            ))}
          </div>
        </div>

        <div className="mx-auto grid w-full max-w-[1440px] gap-10 border-t border-[var(--color-hairline)] px-6 py-12 md:grid-cols-3 md:px-10">
          {LOCATIONS.map((loc) => (
            <div key={loc.region}>
              <p className="font-mono text-[12px] tracking-[0.04em] text-[var(--color-text-muted)]">
                {loc.region}, {loc.country}
              </p>
              <p className="mt-3 font-display text-[clamp(1.4rem,2vw,1.8rem)] tracking-[-0.02em]">
                {loc.city}
              </p>
              <p className="mt-3 text-[13px] leading-relaxed text-[var(--color-text-muted)]">
                {loc.address}
              </p>
            </div>
          ))}
        </div>
      </section>

      {/* ── Bottom bar ─────────────────────────────────────────────── */}
      <section className="border-t border-[var(--color-hairline)]">
        <div className="mx-auto flex w-full max-w-[1440px] flex-col items-start justify-between gap-4 px-6 py-8 text-[13px] text-[var(--color-text-muted)] md:flex-row md:items-center md:px-10">
          <p>
            {new Date().getFullYear()} © Kerning AI ·{" "}
            <span className="text-[var(--color-text-muted)]">A </span>
            <a
              href="https://hemcogroup.com"
              target="_blank"
              rel="noopener noreferrer me"
              className="nav-link text-[var(--color-text-muted)] hover:text-[var(--color-text)]"
            >
              Hemco Group
            </a>
            <span className="text-[var(--color-text-muted)]"> company</span>
          </p>
          <div className="flex items-center gap-8">
            {LEGAL_NAV.map((item) => (
              <Link
                key={item.href}
                href={item.href}
                className="nav-link text-[var(--color-text-muted)] hover:text-[var(--color-text)]"
              >
                {item.label}
              </Link>
            ))}
            <a
              href="https://kerning.ooo"
              target="_blank"
              rel="noopener noreferrer me"
              className="nav-link text-[var(--color-text-muted)] hover:text-[var(--color-text)]"
            >
              kerning.ooo ↗
            </a>
          </div>
        </div>
      </section>
    </footer>
  );
}
