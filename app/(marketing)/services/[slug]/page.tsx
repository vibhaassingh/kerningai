import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { Eyebrow } from "@/components/primitives/Eyebrow";
import { MaskedReveal } from "@/components/primitives/MaskedReveal";
import { TelemetryPulse } from "@/components/graphics/TelemetryPulse";
import { CinematicImage } from "@/components/graphics/CinematicImage";
import { CinematicVideo } from "@/components/graphics/CinematicVideo";
import { SERVICES } from "@/content/services";
import { getServiceMedia, getServiceVideo } from "@/lib/media";
import { CTA } from "@/components/sections/home/CTA";
import { SITE_URL } from "@/lib/env";

/** Per-slug telemetry feeds — only services where a live signal makes
 *  thematic sense. Predictive Maintenance shows machine telemetry;
 *  Energy shows utility metering; everything else opts out. */
const TELEMETRY_BY_SLUG: Record<
  string,
  { label: string; value: string; unit?: string }[]
> = {
  "predictive-maintenance": [
    { label: "Combi oven #07 · Compressor", value: "T−19d", unit: "forecast" },
    { label: "Bearing rig · Line 2 · Δrms", value: "0.42", unit: "mm/s" },
    { label: "Hood motor · Site 04 · Drift", value: "+8.3%", unit: "vs base" },
  ],
  "energy-utility-emissions": [
    { label: "Plant 04 · Compressor cluster", value: "−12.4%", unit: "mtd" },
    { label: "HVAC zone 7 · Setpoint Δ", value: "−1.8°C", unit: "auto" },
    { label: "Scope-2 ledger · This week", value: "812", unit: "kgCO₂e" },
  ],
};

type Params = { slug: string };

export function generateStaticParams() {
  return SERVICES.map((s) => ({ slug: s.slug }));
}

export async function generateMetadata({
  params,
}: {
  params: Promise<Params>;
}): Promise<Metadata> {
  const { slug } = await params;
  const service = SERVICES.find((s) => s.slug === slug);
  if (!service) return {};
  const url = `/services/${slug}`;
  return {
    title: service.title,
    description: service.summary,
    alternates: { canonical: url },
    openGraph: {
      type: "article",
      title: `${service.title} · Kerning AI`,
      description: service.summary,
      url,
      siteName: "Kerning AI",
    },
    twitter: {
      card: "summary_large_image",
      title: `${service.title} · Kerning AI`,
      description: service.tagline,
    },
  };
}

export default async function ServiceDetailPage({
  params,
}: {
  params: Promise<Params>;
}) {
  const { slug } = await params;
  const service = SERVICES.find((s) => s.slug === slug);
  if (!service) notFound();

  const idx = SERVICES.findIndex((s) => s.slug === slug);
  const next = SERVICES[(idx + 1) % SERVICES.length];
  const telemetry = TELEMETRY_BY_SLUG[slug];
  const media = getServiceMedia(slug);
  const video = getServiceVideo(slug);

  const serviceUrl = `${SITE_URL}/services/${slug}`;
  const breadcrumbSchema = {
    "@context": "https://schema.org",
    "@type": "BreadcrumbList",
    itemListElement: [
      { "@type": "ListItem", position: 1, name: "Kerning AI", item: SITE_URL },
      { "@type": "ListItem", position: 2, name: "Services", item: `${SITE_URL}/services` },
      { "@type": "ListItem", position: 3, name: service.title, item: serviceUrl },
    ],
  };
  const serviceSchema = {
    "@context": "https://schema.org",
    "@type": "Service",
    "@id": serviceUrl,
    name: service.title,
    description: service.summary,
    serviceType: service.title,
    url: serviceUrl,
    provider: { "@id": `${SITE_URL}/#organization` },
    hasOfferCatalog: {
      "@type": "OfferCatalog",
      name: `${service.title} capabilities`,
      itemListElement: service.capabilities.map((c, i) => ({
        "@type": "Offer",
        position: i + 1,
        itemOffered: { "@type": "Service", name: c },
      })),
    },
  };

  return (
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(breadcrumbSchema) }}
      />
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(serviceSchema) }}
      />
      <section className="bg-[var(--color-bg)] pt-40 md:pt-56">
        <div className="mx-auto w-full max-w-[1440px] px-6 md:px-10">
          <Link
            href="/services"
            className="nav-link mb-12 inline-block text-[13px] text-[var(--color-text-muted)] hover:text-[var(--color-text)]"
          >
            ← All solutions
          </Link>

          <Eyebrow number={service.number}>Solution</Eyebrow>

          <h1 className="text-display mt-12 text-[clamp(2.6rem,8.5vw,9rem)] font-medium leading-[0.94] tracking-[-0.04em]">
            <MaskedReveal stiffness={200} damping={22}>
              <span>{service.title}</span>
            </MaskedReveal>
          </h1>

          <p className="mt-10 max-w-3xl text-display text-[clamp(1.4rem,2.4vw,2.2rem)] font-medium leading-[1.2] tracking-[-0.025em] text-[var(--color-text-muted)]">
            {service.tagline}
          </p>

          <p className="mt-12 max-w-2xl border-l border-[var(--color-text)] pl-6 text-[15px] leading-[1.6] text-[var(--color-text-muted)]">
            {service.summary}
          </p>

          {(video || media) && (
            <div className="mt-20">
              {video ? (
                <CinematicVideo
                  src={video.src}
                  poster={video.poster}
                  alt={video.alt}
                  focal={video.focal}
                  aspect={21 / 9}
                  priority
                  caption={`${service.title} · ${service.number}`}
                  index={service.number}
                />
              ) : (
                media && (
                  <CinematicImage
                    src={media.src}
                    alt={media.alt}
                    focal={media.focal}
                    aspect={21 / 9}
                    priority
                    caption={`${service.title} · ${service.number}`}
                    index={service.number}
                    sizes="(min-width: 1280px) 1280px, 100vw"
                  />
                )
              )}
            </div>
          )}
        </div>
      </section>

      <section className="border-t border-[var(--color-hairline)] bg-[var(--color-bg)] py-24 md:py-32">
        <div className="mx-auto w-full max-w-[1440px] px-6 md:px-10">
          <Eyebrow number="01">Outcomes</Eyebrow>

          <div className="mt-16 grid gap-12 md:grid-cols-12">
            <h2 className="text-display text-[clamp(2rem,4.4vw,3.8rem)] font-medium leading-[1] tracking-[-0.03em] md:col-span-5">
              What it{" "}
              <span className="italic text-[var(--color-signal)]">
                delivers.
              </span>
            </h2>
            <ul className="md:col-span-7 md:col-start-6">
              {service.outcomes.map((o, i) => (
                <li
                  key={o}
                  className="grid items-baseline gap-6 border-t border-[var(--color-hairline)] py-6 md:grid-cols-12"
                >
                  <span className="font-mono text-[12px] tracking-[0.04em] text-[var(--color-text-muted)] md:col-span-1">
                    {String(i + 1).padStart(2, "0")}
                  </span>
                  <span className="text-[15px] leading-[1.55] md:col-span-11">
                    {o}
                  </span>
                </li>
              ))}
            </ul>
          </div>
        </div>
      </section>

      {telemetry && (
        <section className="border-t border-[var(--color-hairline)] bg-[var(--color-bg)] py-24 md:py-32">
          <div className="mx-auto w-full max-w-[1440px] px-6 md:px-10">
            <div className="flex items-baseline justify-between gap-6">
              <Eyebrow number="02">Live signal</Eyebrow>
              <span className="hidden font-mono text-[12px] tracking-[0.04em] text-[var(--color-text-muted)] md:inline">
                Refresh · 5s
              </span>
            </div>

            <div className="mt-12 grid gap-12 md:grid-cols-12 md:items-end">
              <h2 className="text-display text-[clamp(2rem,4.4vw,3.8rem)] font-medium leading-[1] tracking-[-0.03em] md:col-span-5">
                What this looks like{" "}
                <span className="italic text-[var(--color-signal)]">
                  on the floor.
                </span>
              </h2>
              <p className="text-[14px] leading-[1.6] text-[var(--color-text-muted)] md:col-span-4 md:col-start-9">
                Selected operations from active deployments, fused on the
                ontology — read the same number the operator does.
              </p>
            </div>

            <div className="mt-16">
              <TelemetryPulse streams={telemetry} waveformHeight={120} />
            </div>
          </div>
        </section>
      )}

      <section className="border-t border-[var(--color-hairline)] bg-[var(--color-bg)] py-24 md:py-32">
        <div className="mx-auto w-full max-w-[1440px] px-6 md:px-10">
          <Eyebrow number={telemetry ? "03" : "02"}>Capabilities</Eyebrow>

          <div className="mt-16 grid gap-x-10 gap-y-16 md:grid-cols-2">
            {service.capabilities.map((c, i) => (
              <div key={c}>
                <span className="font-mono text-[12px] tracking-[0.04em] text-[var(--color-text-muted)]">
                  {String(i + 1).padStart(2, "0")}
                </span>
                <p className="text-display mt-6 text-[clamp(1.4rem,2vw,1.8rem)] font-medium leading-[1.15] tracking-[-0.02em]">
                  {c}
                </p>
              </div>
            ))}
          </div>
        </div>
      </section>

      <section className="border-t border-[var(--color-hairline)] bg-[var(--color-bg)] py-24 md:py-32">
        <div className="mx-auto w-full max-w-[1440px] px-6 md:px-10">
          <Link
            href={`/services/${next.slug}`}
            className="group block"
          >
            <p className="font-mono text-[12px] tracking-[0.04em] text-[var(--color-text-muted)]">
              Next module {next.number}
            </p>
            <p className="text-display mt-6 text-[clamp(2rem,7vw,7rem)] font-medium leading-[0.95] tracking-[-0.035em]">
              <span className="bg-[length:0%_1px] bg-[linear-gradient(currentColor,currentColor)] bg-[position:0_100%] bg-no-repeat pb-1 transition-[background-size] duration-500 ease-[cubic-bezier(0.22,1,0.36,1)] group-hover:bg-[length:100%_1px]">
                {next.title}
              </span>{" "}
              <span aria-hidden className="text-[var(--color-text-muted)]">
                ↗
              </span>
            </p>
          </Link>
        </div>
      </section>

      <CTA />
    </>
  );
}
