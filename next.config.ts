import path from "node:path";
import { fileURLToPath } from "node:url";

import type { NextConfig } from "next";
import { withSentryConfig } from "@sentry/nextjs";

const projectRoot = path.dirname(fileURLToPath(import.meta.url));

const nextConfig: NextConfig = {
  reactStrictMode: true,
  // Pin the workspace root: a parent lockfile exists above this worktree,
  // so Next/Turbopack would otherwise warn and infer the wrong root.
  turbopack: { root: projectRoot },
  outputFileTracingRoot: projectRoot,
  images: {
    formats: ["image/avif", "image/webp"],
    // Quality values actually used across the media registry. Without
    // this Next 16 warns for every non-75 quality.
    qualities: [75, 80, 85],
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
  // Build-time bundle options moved under `webpack` in @sentry/nextjs v10
  // (the top-level keys are deprecated and Turbopack-incompatible). We
  // don't auto-instrument — `withSentry` from lib/observability/sentry.ts
  // is applied at the call site instead.
  webpack: {
    autoInstrumentServerFunctions: false,
    autoInstrumentMiddleware: false,
    autoInstrumentAppDirectory: false,
    treeshake: { removeDebugLogging: true },
  },
});
