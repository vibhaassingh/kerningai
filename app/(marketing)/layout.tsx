import type { ReactNode } from "react";
import { Nav } from "@/components/chrome/Nav";
import { Footer } from "@/components/chrome/Footer";
import { PageTransition } from "@/components/chrome/PageTransition";
import { LenisProvider } from "@/components/providers/LenisProvider";
import { MotionConfigProvider } from "@/components/providers/MotionConfigProvider";

export default function MarketingLayout({ children }: { children: ReactNode }) {
  return (
    <MotionConfigProvider>
      <LenisProvider>
        <Nav />
        <main className="relative">
          <PageTransition>{children}</PageTransition>
        </main>
        <Footer />
      </LenisProvider>
    </MotionConfigProvider>
  );
}
