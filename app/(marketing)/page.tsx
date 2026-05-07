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

export default function HomePage() {
  return (
    <>
      <Hero />
      <TelemetryStrip />
      <ProofPoints />
      <Manifesto />
      <ServicesGrid />
      <IndustryShowcase />
      <Testimonials />
      <LocationsStrip />
      <InsightsPreview />
      <CTA />
    </>
  );
}
