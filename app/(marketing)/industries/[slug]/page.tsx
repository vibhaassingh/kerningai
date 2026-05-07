import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { Eyebrow } from "@/components/primitives/Eyebrow";
import { MaskedReveal } from "@/components/primitives/MaskedReveal";
import { GeometricReveal } from "@/components/graphics/GeometricReveal";
import { CinematicImage } from "@/components/graphics/CinematicImage";
import { CinematicVideo } from "@/components/graphics/CinematicVideo";
import { INDUSTRIES } from "@/content/industries";
import { getIndustryMedia, getIndustryVideo } from "@/lib/media";
import { CTA } from "@/components/sections/home/CTA";
import { SITE_URL } from "@/lib/env";

type Params = { slug: string };

export function generateStaticParams() {
  return INDUSTRIES.map((i) => ({ slug: i.slug }));
}

export async function generateMetadata({
  params,
}: {
  params: Promise<Params>;
}): Promise<Metadata> {
  const { slug } = await params;
  const ind = INDUSTRIES.find((i) => i.slug === slug);
  if (!ind) return {};
  const url = `/industries/${slug}`;
  return {
    title: ind.name,
    description: ind.summary,
    alternates: { canonical: url },
    openGraph: {
      type: "article",
      title: `${ind.name} · Kerning AI`,
      description: ind.headline,
      url,
      siteName: "Kerning AI",
    },
    twitter: {
      card: "summary_large_image",
      title: `${ind.name} · Kerning AI`,
      description: ind.headline,
    },
  };
}

export default async function IndustryDetailPage({
  params,
}: {
  params: Promise<Params>;
}) {
  const { slug } = await params;
  const ind = INDUSTRIES.find((i) => i.slug === slug);
  if (!ind) notFound();
  const video = getIndustryVideo(slug);
  const media = getIndustryMedia(slug);

  const industryUrl = `${SITE_URL}/industries/${slug}`;
  const breadcrumbSchema = {
    "@context": "https://schema.org",
    "@type": "BreadcrumbList",
    itemListElement: [
      { "@type": "ListItem", position: 1, name: "Kerning AI", item: SITE_URL },
      { "@type": "ListItem", position: 2, name: "Industries", item: `${SITE_URL}/industries` },
      { "@type": "ListItem", position: 3, name: ind.name, item: industryUrl },
    ],
  };
  const industrySchema = {
    "@context": "https://schema.org",
    "@type": "WebPage",
    "@id": industryUrl,
    name: `${ind.name} — Kerning AI`,
    description: ind.summary,
    url: industryUrl,
    isPartOf: { "@id": `${SITE_URL}/#website` },
    about: { "@id": `${SITE_URL}/#organization` },
    mainEntity: {
      "@type": "Service",
      name: `Operational intelligence for ${ind.name}`,
      provider: { "@id": `${SITE_URL}/#organization` },
      description: ind.headline,
      areaServed: ind.name,
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
        dangerouslySetInnerHTML={{ __html: JSON.stringify(industrySchema) }}
      />
      <section className="bg-[var(--color-bg)] pt-40 md:pt-56">
        <div className="mx-auto w-full max-w-[1440px] px-6 md:px-10">
          <Link
            href="/industries"
            className="nav-link mb-12 inline-block text-[13px] text-[var(--color-text-muted)] hover:text-[var(--color-text)]"
          >
            ← All industries
          </Link>

          <Eyebrow number={ind.number}>Industry</Eyebrow>

          <h1 className="text-display mt-12 text-[clamp(3rem,10vw,11rem)] font-medium leading-[0.92] tracking-[-0.04em]">
            <MaskedReveal stiffness={200} damping={22}>
              <span>{ind.name}</span>
            </MaskedReveal>
          </h1>

          <p className="mt-10 max-w-3xl text-display text-[clamp(1.4rem,2.4vw,2.2rem)] font-medium leading-[1.2] tracking-[-0.025em] text-[var(--color-text-muted)]">
            {ind.headline}
          </p>

          <p className="mt-12 max-w-2xl border-l border-[var(--color-text)] pl-6 text-[15px] leading-[1.6] text-[var(--color-text-muted)]">
            {ind.summary}
          </p>

          <div className="mt-20">
            {video ? (
              <CinematicVideo
                src={video.src}
                poster={video.poster}
                alt={video.alt}
                focal={video.focal}
                aspect={21 / 9}
                priority
                caption={`${ind.name} · ${ind.number}`}
                index={ind.number}
              />
            ) : media ? (
              <CinematicImage
                src={media.src}
                alt={media.alt}
                focal={media.focal}
                aspect={21 / 9}
                priority
                caption={`${ind.name} · ${ind.number}`}
                index={ind.number}
                sizes="(min-width: 1280px) 1280px, 100vw"
              />
            ) : (
              <GeometricReveal
                aspect={21 / 9}
                cellSize={48}
                caption={`${ind.name} · ${ind.number}`}
                index={ind.number}
              />
            )}
          </div>
        </div>
      </section>

      <section className="border-t border-[var(--color-hairline)] bg-[var(--color-bg)] py-24 md:py-32">
        <div className="mx-auto w-full max-w-[1440px] px-6 md:px-10">
          <Eyebrow number="01">Pillars</Eyebrow>

          <div className="mt-16 grid gap-x-10 gap-y-16 md:grid-cols-3">
            {ind.pillars.map((p, i) => (
              <div key={p.title}>
                <span className="font-mono text-[12px] tracking-[0.04em] text-[var(--color-text-muted)]">
                  {String(i + 1).padStart(2, "0")}{" "}
                  <span className="mx-1 text-[var(--color-text-faint)]">
                    —
                  </span>{" "}
                  Pillar
                </span>
                <h3 className="text-display mt-8 text-[clamp(1.6rem,2.4vw,2.2rem)] font-medium leading-[1.05] tracking-[-0.025em]">
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

      <CTA />
    </>
  );
}
