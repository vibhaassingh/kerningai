import type { NextConfig } from "next";
import { withSentryConfig } from "@sentry/nextjs";

const nextConfig: NextConfig = {
  reactStrictMode: true,
  images: {
    formats: ["image/avif", "image/webp"],
    remotePatterns: [
      // Stills served from the cinematic registry (`lib/media.ts`).
      { protocol: "https", hostname: "images.unsplash.com" },
      // Pexels still poster fallbacks, when used.
      { protocol: "https", hostname: "images.pexels.com" },
    ],
  },
  experimental: {
    optimizePackageImports: ["lucide-react", "framer-motion", "gsap"],
  },
};

// `withSentryConfig` is a no-op when SENTRY_DSN is unset — it only
// uploads source maps and instruments the bundle when configured. Wrapping
// is safe even if you never set up Sentry.
export default withSentryConfig(nextConfig, {
  silent: true,
  // Sentry's CLI does source-map upload during build. Skipped without
  // SENTRY_AUTH_TOKEN; must be a CI secret to enable in the prod build.
  org: process.env.SENTRY_ORG,
  project: process.env.SENTRY_PROJECT,
  authToken: process.env.SENTRY_AUTH_TOKEN,
  // Source-map handling: keep them from being publicly served.
  sourcemaps: { disable: false, deleteSourcemapsAfterUpload: true },
  // Don't auto-instrument server functions — we use `withSentry` from
  // lib/observability/sentry.ts at the call site instead.
  autoInstrumentServerFunctions: false,
  autoInstrumentMiddleware: false,
  autoInstrumentAppDirectory: false,
  disableLogger: true,
});
