import type { Metadata } from "next";
import { readHomepage } from "@/kerning/homepage";
import { KerningBlocks, KerningPreviewBanner } from "@/kerning/blocks";
import styles from "@/kerning/website.module.css";
import { Hero } from "@/components/sections/home/Hero";
import { TelemetryStrip } from "@/components/sections/home/TelemetryStrip";
import { ProofPoints } from "@/components/sections/home/ProofPoints";
import { Manifesto } from "@/components/sections/home/Manifesto";
import { ServicesGrid } from "@/components/sections/home/ServicesGrid";
import { IndustryShowcase } from "@/components/sections/home/IndustryShowcase";
import { Testimonials } from "@/components/sections/home/Testimonials";
import { LocationsStrip } from "@/components/sections/home/LocationsStrip";
import { InsightsPreview } from "@/components/sections/home/InsightsPreview";
import { CTA } from "@/components/sections/home/CTA";

export const dynamic = "force-dynamic";

export async function generateMetadata(): Promise<Metadata> {
  const result = await readHomepage();
  if (result.kind === "fallback") return {};
  const privateMetadata: Metadata =
    result.kind === "preview-unavailable" || result.snapshot.preview
      ? {
          robots: {
            index: false,
            follow: false,
            googleBot: { index: false, follow: false },
          },
          referrer: "no-referrer",
        }
      : {};
  if (result.kind === "preview-unavailable")
    return { title: "Private preview unavailable", ...privateMetadata };
  const { seoTitle: title, seoDescription: description } = result.page.content;
  return {
    title: { absolute: title },
    description,
    openGraph: { title, description },
    twitter: { title, description },
    ...privateMetadata,
  };
}

export default async function HomePage() {
  const result = await readHomepage();
  if (result.kind === "preview-unavailable") {
    return (
      <section className={styles.previewUnavailable}>
        <h1>This private preview is unavailable</h1>
        <p>
          The link may have expired. Open a fresh preview in Kerning, or exit
          preview to return to the published website.
        </p>
        <KerningPreviewBanner />
      </section>
    );
  }
  const mapped = result.kind === "mapped" ? result : null;
  const hero = mapped
    ? {
        eyebrow: mapped.page.content.eyebrow,
        headline: mapped.page.content.headline,
        description: mapped.page.content.description,
        buttonText: mapped.page.content.buttonText,
        buttonLink: mapped.page.content.buttonLink,
      }
    : undefined;
  return (
    <div
      data-kerning-release={
        mapped && !mapped.snapshot.preview
          ? mapped.snapshot.release?.id
          : undefined
      }
    >
      {mapped?.snapshot.preview && (
        <div className={styles.previewBanner}>
          <KerningPreviewBanner />
        </div>
      )}
      <Hero content={hero} />
      {mapped?.page.content.blocks?.length ? (
        <div className={styles.content}>
          <KerningBlocks blocks={mapped.page.content.blocks} />
        </div>
      ) : null}
      <TelemetryStrip />
      <ProofPoints />
      <Manifesto />
      <ServicesGrid />
      <IndustryShowcase />
      <Testimonials />
      <LocationsStrip />
      <InsightsPreview />
      <CTA />
    </div>
  );
}
