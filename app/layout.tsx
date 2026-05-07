import type { Metadata, Viewport } from "next";
import { Inter, Inter_Tight, JetBrains_Mono } from "next/font/google";
import { Analytics } from "@vercel/analytics/next";
import { SpeedInsights } from "@vercel/speed-insights/next";
import { SITE_URL } from "@/lib/env";
import { LOCATIONS } from "@/content/locations";
import { GoogleAnalytics } from "@/components/measurement/google-analytics";
import "./globals.css";

const SITE_NAME = "Kerning AI";
const HEMCO_GROUP_URL = "https://hemcogroup.com";

const interTight = Inter_Tight({
  subsets: ["latin"],
  variable: "--font-display",
  display: "swap",
  weight: ["400", "500", "600", "700"],
});

const inter = Inter({
  subsets: ["latin"],
  variable: "--font-body",
  display: "swap",
});

const jetbrainsMono = JetBrains_Mono({
  subsets: ["latin"],
  variable: "--font-mono",
  display: "swap",
  weight: ["400", "500"],
});

export const metadata: Metadata = {
  metadataBase: new URL(SITE_URL),
  title: {
    default: "Kerning AI — Industry 5.0, on the floor.",
    template: "%s · Kerning AI",
  },
  description:
    "Kerning AI is an operational intelligence platform for industries that build with their hands — kitchens, factories, hotel floors, automotive lines. An ontology-led Industry 5.0 stack with predictive maintenance, energy intelligence, hygiene compliance and decision-grade analytics. Founded 2021 in the Netherlands; part of Hemco Group.",
  applicationName: SITE_NAME,
  keywords: [
    "Kerning AI",
    "operational intelligence",
    "Industry 5.0",
    "operational ontology",
    "agentic workflows",
    "predictive maintenance",
    "energy intelligence",
    "hygiene compliance",
    "hospitality AI",
    "manufacturing AI",
    "factory AI Netherlands",
    "Hemco Group",
  ],
  authors: [{ name: SITE_NAME, url: SITE_URL }],
  creator: SITE_NAME,
  publisher: SITE_NAME,
  category: "Operational intelligence software",
  alternates: { canonical: "/" },
  openGraph: {
    type: "website",
    siteName: SITE_NAME,
    title: "Kerning AI — Industry 5.0, on the floor.",
    description:
      "Operational intelligence for industries that build with their hands. Ontology-led Industry 5.0.",
    url: SITE_URL,
    locale: "en_GB",
  },
  twitter: {
    card: "summary_large_image",
    title: "Kerning AI — Industry 5.0, on the floor.",
    description:
      "Operational intelligence for industries that build with their hands.",
  },
  robots: {
    index: true,
    follow: true,
    googleBot: {
      index: true,
      follow: true,
      "max-image-preview": "large",
      "max-snippet": -1,
      "max-video-preview": -1,
    },
  },
  icons: {
    icon: [{ url: "/favicon.svg", type: "image/svg+xml" }],
  },
  verification: {
    google: process.env.NEXT_PUBLIC_GSC_TOKEN,
    ...(process.env.NEXT_PUBLIC_BING_TOKEN && {
      other: { "msvalidate.01": process.env.NEXT_PUBLIC_BING_TOKEN },
    }),
  },
};

export const viewport: Viewport = {
  themeColor: "#000000",
  colorScheme: "dark",
  width: "device-width",
  initialScale: 1,
};

const countryCodeFor = (country: string): string =>
  ({ Netherlands: "NL", "United States": "US", India: "IN" }[country] ?? "NL");

const organizationSchema = {
  "@context": "https://schema.org",
  "@type": ["Organization", "SoftwareApplication"],
  "@id": `${SITE_URL}/#organization`,
  name: SITE_NAME,
  alternateName: "KERNING.AI",
  legalName: "Kerning AI B.V.",
  url: SITE_URL,
  logo: `${SITE_URL}/brand/logo.svg`,
  description:
    "Kerning AI is an operational intelligence platform for industries that build with their hands — an ontology-led approach to Industry 5.0.",
  applicationCategory: "BusinessApplication",
  operatingSystem: "Web",
  foundingDate: "2021",
  foundingLocation: {
    "@type": "Place",
    address: { "@type": "PostalAddress", addressCountry: "NL", addressLocality: "Leiden" },
  },
  address: LOCATIONS.map((loc) => ({
    "@type": "PostalAddress",
    streetAddress: loc.address,
    addressLocality: loc.city,
    addressCountry: countryCodeFor(loc.country),
    addressRegion: loc.region,
  })),
  email: "hello@kerningai.eu",
  knowsAbout: [
    "Operational intelligence",
    "Industry 5.0",
    "Predictive maintenance",
    "Operational ontology",
    "Agentic AI workflows",
    "Energy intelligence",
    "Hygiene and food safety compliance",
    "Manufacturing analytics",
    "Hospitality operations",
  ],
  parentOrganization: {
    "@type": "Corporation",
    "@id": `${HEMCO_GROUP_URL}/#organization`,
    name: "Hemco Group",
    url: HEMCO_GROUP_URL,
  },
  sameAs: [
    HEMCO_GROUP_URL,
    "https://hemco.ooo",
    "https://kerning.ooo",
    "https://studio.kerning.ooo",
    "https://arch.kerning.ooo",
    "https://hospitality.kerning.ooo",
    "https://www.linkedin.com/company/kerning-ai/",
  ],
};

const websiteSchema = {
  "@context": "https://schema.org",
  "@type": "WebSite",
  "@id": `${SITE_URL}/#website`,
  url: SITE_URL,
  name: SITE_NAME,
  description:
    "The official site of Kerning AI — an operational intelligence platform for Industry 5.0.",
  publisher: { "@id": `${SITE_URL}/#organization` },
  inLanguage: "en",
  potentialAction: {
    "@type": "SearchAction",
    target: {
      "@type": "EntryPoint",
      urlTemplate: `${SITE_URL}/insights?q={search_term_string}`,
    },
    "query-input": "required name=search_term_string",
  },
};

export default function RootLayout({
  children,
}: Readonly<{ children: React.ReactNode }>) {
  return (
    <html
      lang="en"
      className={`${interTight.variable} ${inter.variable} ${jetbrainsMono.variable} hide-cursor`}
      suppressHydrationWarning
    >
      <body className="bg-bg text-text antialiased">
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{ __html: JSON.stringify(organizationSchema) }}
        />
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{ __html: JSON.stringify(websiteSchema) }}
        />
        {children}
        <Analytics />
        <SpeedInsights />
        <GoogleAnalytics />
      </body>
    </html>
  );
}
