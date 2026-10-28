# Kerning AI homepage mapping

This branch connects the existing Next.js marketing homepage to the Kerning portal, preserving the hero's ambient video, typography, animations, secondary link and all existing lower sections. The current clean Git HEAD was the base; unrelated uncommitted design changes in the primary checkout were not copied or edited.

## Configured by the operator after deployment

- `KERNING_PORTAL_ORIGIN=https://kerning-portal.vercel.app`
- `KERNING_SITE_ID`: UUID of the corresponding site in the production portal. Required; no local fixture ID is hardcoded.
- `KERNING_WEBHOOK_SECRET`: 64-character secret returned by Configure delivery. Server-only, never committed.

No environment variables, remote project settings, client databases or deployments were changed by this branch.

The `/` content entry maps eyebrow, headline, description, primary button label/link, SEO title/description and the six supported content block types. Additional CMS blocks render immediately after the hero, styled using the existing Kerning palette and responsive layout. Existing non-homepage routes, static home sections and business application data remain managed by their original code; the connector does not claim those fields are mapped.

When no public release exists, configuration is missing or the portal is temporarily unavailable, the existing homepage and inherited SEO remain visible without any release marker. Once a valid release supplies `/`, the actual page's content and `data-kerning-release` marker use the same request-scoped snapshot. Private preview failures instead show an explanatory screen with an Exit preview action. They never display the public fallback as if it were a valid preview.

The five `/api/kerning/*` handlers are installed. Their own HMAC and preview checks are independent of the marketing website's Supabase login, so proxy bypass applies only to these handlers. Preview responses use no-store/noindex/no-referrer; preview requests also suppress Vercel Analytics, Speed Insights and Google Analytics at the root layout. This cookie-dependent root layout opts pages into request-time rendering; account for that when reviewing hosting performance.

Before merging, reconcile any concurrent homepage, hero, root-layout or proxy changes. Test through a client preview deployment with a production portal site, review real content before publishing, then use the portal's delivery verification. An unavailable public portal intentionally leaves the old homepage in place, and verification must remain unsuccessful until it renders the expected release.

## Verification

- `pnpm typecheck`: passed.
- `pnpm exec vitest run tests/unit/kerning/connector.test.ts`: nine tests passed, covering real content/SEO/marker mapping, public fallback, absent configuration, private preview, expiry recovery, cross-site rejection, missing home entries and malformed cookies.
- ESLint on all changed TypeScript/TSX files: passed with no warnings.
- `pnpm exec next build --webpack`: passed with Next.js 16.2.4; all five connector routes and the homepage appear in the production route manifest.
- The portal template separately passes 14 tests for generated type correctness, HMAC, preview, bounded image proxy and safe block rendering.

Tests use mocked portal responses and synthetic identifiers. Production delivery has not been exercised. The existing Sentry global-error-handler warning and edge-runtime prerender warning appeared during the successful build; neither originates from this connector. Local validation reused the primary checkout's ignored node_modules through a symlink; install the lockfile normally in CI or a fresh checkout.
