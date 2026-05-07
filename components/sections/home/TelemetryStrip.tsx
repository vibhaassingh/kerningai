import { TelemetryPulse } from "@/components/graphics/TelemetryPulse";

/**
 * Slim ambient strip between the Hero and the rest of the home —
 * gives the page a "live ops" pulse without committing to a full
 * screenshot. Reuses the shared TelemetryPulse component so the
 * same widget can appear on Predictive Maintenance / Energy
 * detail pages later.
 */
export function TelemetryStrip() {
  return (
    <section className="border-t border-[var(--color-hairline)] bg-[var(--color-bg)] py-12 md:py-16">
      <div className="mx-auto w-full max-w-[1440px] px-6 md:px-10">
        <div className="flex items-baseline justify-between gap-6">
          <p className="font-mono text-[12px] tracking-[0.04em] text-[var(--color-text-muted)]">
            <span className="text-[var(--color-text)]">Live</span>
            <span className="mx-2 text-[var(--color-text-faint)]">—</span>
            Selected operations from active deployments
          </p>
          <span className="hidden font-mono text-[12px] tracking-[0.04em] text-[var(--color-text-muted)] md:inline">
            Refresh · 5s
          </span>
        </div>

        <div className="mt-8 grid gap-12 md:grid-cols-12">
          <div className="md:col-span-7">
            <TelemetryPulse waveformHeight={96} />
          </div>
          <p className="text-[14px] leading-[1.6] text-[var(--color-text-muted)] md:col-span-4 md:col-start-9">
            Forecasts, deviations and agent activity, fused on the operational
            ontology — read the same number the operator does, in the same
            second they do.
          </p>
        </div>
      </div>
    </section>
  );
}
