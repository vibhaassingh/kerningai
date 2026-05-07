import { Eyebrow } from "@/components/primitives/Eyebrow";
import { LOCATIONS } from "@/content/locations";

export function LocationsStrip() {
  return (
    <section className="border-t border-[var(--color-hairline)] bg-[var(--color-bg)] py-24 md:py-32">
      <div className="mx-auto w-full max-w-[1440px] px-6 md:px-10">
        <Eyebrow number="06">Presence</Eyebrow>

        <h2 className="text-display mt-12 max-w-4xl text-[clamp(2rem,4.4vw,4rem)] font-medium leading-[1] tracking-[-0.03em]">
          Three regions.{" "}
          <span className="italic text-[var(--color-signal)]">
            One operating cadence.
          </span>
        </h2>

        <ul className="mt-20 grid gap-12 md:grid-cols-3">
          {LOCATIONS.map((loc) => (
            <li key={loc.region}>
              <p className="font-mono text-[12px] tracking-[0.04em] text-[var(--color-text-muted)]">
                {loc.region}, {loc.country}
              </p>
              <p className="text-display mt-6 text-[clamp(1.8rem,2.8vw,2.4rem)] font-medium leading-[1] tracking-[-0.025em]">
                {loc.city}
              </p>
              <p className="mt-4 text-[14px] leading-[1.55] text-[var(--color-text-muted)]">
                {loc.address}
              </p>
              <p className="mt-3 font-mono text-[11px] tracking-[0.04em] text-[var(--color-text-muted)]">
                {loc.coordinates.lat.toFixed(2)}° N ·{" "}
                {Math.abs(loc.coordinates.lng).toFixed(2)}°{" "}
                {loc.coordinates.lng > 0 ? "E" : "W"}
              </p>
            </li>
          ))}
        </ul>
      </div>
    </section>
  );
}
