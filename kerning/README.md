# Kerning AI website connector

This repository has already installed the five route adapters and connected the homepage. See [IMPLEMENTATION.md](./IMPLEMENTATION.md) for the exact mapped fields, fallback behavior and deployment configuration still required. The reusable setup instructions below explain the contract.

Generated for site **KERNING_SITE_ID (configured on the server)**. This directory supplies Next.js App Router server helpers, safe block rendering and route adapters. Existing website routes and components are preserved. A developer must map the content, add the route exports below, test a preview deployment and merge the setup PR.

## Server configuration

- Set `KERNING_SITE_ID` to the site UUID from the deployed portal. This repository requires an explicit site UUID; it has no hardcoded local or production site ID. IDs can differ between local, staging and production databases.
- Set `KERNING_PORTAL_ORIGIN` to your deployed portal's public HTTPS origin (no path, credentials, query or nonstandard port). Portal at setup: "https://kerning-portal.vercel.app". Localhost cannot be used by a hosted client website.
- Configure delivery for this site in Kerning and copy the one-time secret into this website's `KERNING_WEBHOOK_SECRET` environment variable. Keep the 64-character value only in server secrets. Never use `NEXT_PUBLIC_`, commit it, or pass it to Client Components. Rotation requires updating the website environment and redeploying.
- These helpers require a Node.js Next.js App Router deployment with `server-only`, React and Next.js available. They use asynchronous `cookies()`. Install `server-only` if absent. Do not use static export, the Edge runtime or shared caching around private snapshots. On Next.js Cache Components projects, keep request-time content inside a Suspense boundary and outside any `use cache` scope.

## Install the route adapters

Create these files inside the application's `app` (or `src/app`) directory. Adjust the relative import to this `kerning/routes.ts` file. The example path is for `app/api/kerning/revalidate/route.ts` with `kerning/` at the application root:

```ts
export { kerningRevalidatePOST as POST } from "../../../../kerning/routes";
export const runtime = "nodejs";
export const dynamic = "force-dynamic";
```

Use the same two configuration exports in each route:

| Route file under app/             | Re-export from kerning/routes  |
| --------------------------------- | ------------------------------ |
| api/kerning/revalidate/route.ts   | kerningRevalidatePOST as POST  |
| api/kerning/status/route.ts       | kerningStatusGET as GET        |
| api/kerning/preview/route.ts      | kerningPreviewGET as GET       |
| api/kerning/preview-exit/route.ts | kerningPreviewExitPOST as POST |
| api/kerning/media/route.ts        | kerningMediaGET as GET         |

For `src/app` the relative import usually needs one extra `../`. Preserve existing handlers; combine them deliberately if these paths are occupied. Projects with Cache Components enabled must omit `dynamic = 'force-dynamic'` (unsupported there); the helpers' uncached fetches and request cookies still require request-time rendering.

## Map an existing page to one immutable snapshot

Create and review real content in Kerning, then publish. Map your existing homepage using the fetched snapshot below. Reuse the same snapshot for both visible content and the release marker; never hardcode the marker or render it over stale fallback content. `getKerningPage('/')` is a convenience helper for individual pages; `getKerningRelease()` also exposes the release and preview state.

```tsx
import { getKerningRelease, safeLink } from "../kerning/content";
import { KerningBlocks, KerningPreviewBanner } from "../kerning/blocks";

export const dynamic = "force-dynamic"; // omit when Cache Components is enabled

export async function generateMetadata() {
  const snapshot = await getKerningRelease();
  const page = snapshot.pages.find((page) => page.slug === "/");
  return {
    title: page?.content.seoTitle,
    description: page?.content.seoDescription,
    ...(snapshot.preview
      ? {
          robots: { index: false, follow: false },
          referrer: "no-referrer" as const,
        }
      : {}),
  };
}
export default async function Page() {
  const snapshot = await getKerningRelease();
  const page = snapshot.pages.find((page) => page.slug === "/");
  if (!page) return <p>This page has no Kerning content yet.</p>;
  const { content } = page;
  return (
    <main
      data-kerning-release={snapshot.preview ? undefined : snapshot.release?.id}
    >
      {snapshot.preview && <KerningPreviewBanner />}
      <p>{content.eyebrow}</p>
      <h1>{content.headline}</h1>
      <p>{content.description}</p>
      {safeLink(content.buttonLink) && (
        <a href={content.buttonLink}>{content.buttonText}</a>
      )}
      <KerningBlocks blocks={content.blocks} />
    </main>
  );
}
```

Adapt imports, classes and heading structure to the real design. Map `contentKind` (page/blog/service), `excerpt` and `publishedDate` into existing lists and templates as appropriate. Supported version-1 blocks are rich text, images, service cards, testimonials, FAQ and galleries. Rich text supports paragraphs, **bold**, _italic_, safe links, `##` subheadings and bullet lists; raw HTML renders as text. Images use the same-origin media adapter, which verifies membership in this site's selected snapshot and keeps the private preview token on the server. Never put the delivery secret in an image URL.

Fetches are uncached and redirect-blocked. The helper deduplicates one snapshot within a React server render. Do not wrap it in persistent caching: doing so could share a private preview with visitors. Add a branded error boundary with a retry and an Exit preview form; an expired preview raises an error instead of silently displaying public content. If you retain the old website as an onboarding fallback, do not emit a release marker on that fallback. Remove preview query strings from analytics/access logs and do not enable third-party analytics in preview mode.

## Preview and publishing contract

Kerning creates an immutable draft snapshot for 30 minutes and links to `/api/kerning/preview?token=...`. The handler checks the snapshot's site ID, availability and expiry before setting a site-scoped HttpOnly cookie (Secure in production, SameSite=Lax, 30 minutes), then redirects to `/` with no token in the location. Later edits require a fresh preview. Preview pages must show the banner, disable indexing, and remain uncached. Exit preview uses a same-origin POST. Preview links are bearer credentials: share only with intended reviewers.

The portal POSTs the exact JSON body `{siteId,releaseId,event:"content.published"}` to `/api/kerning/revalidate`. Signature = lowercase HMAC-SHA256 of `timestamp + "." + rawBody`, using `KERNING_WEBHOOK_SECRET`. Headers are `X-Kerning-Timestamp` (milliseconds) and `X-Kerning-Signature`; tolerance is five minutes. Wrong sites/events/signatures and releases that are no longer active are rejected. Repeated valid requests are safe. Successful requests invalidate the root layout for the next visit; they do not deploy code or rebuild static exports.

The portal then checks the public, uncached `/api/kerning/status` response and fetches the homepage HTML for `data-kerning-release="<release UUID>"`. Status always reads published content, ignoring preview cookies; it alone does not establish correct component mapping. The marker must be server-rendered from the same release as the actual content. Keep status, revalidation and the homepage reachable by the portal; configure deliberate exceptions if the client deployment has additional protection. The portal reports verification separately from the local release transaction and retries temporary failures.

## Validate before enabling a client

1. Check the five route exports, server environment, and existing page/metadata mapping on a preview deployment. No portal or client database credentials belong here.
2. Publish reviewed content, open the public website in a clean browser and confirm the real text and rendered release marker match the delivery response. Preview cookie state must never affect the status route.
3. Open a private preview, check a changed draft and private image, then exit. An expired or another site's token must fail without issuing a cookie. Preview content must not appear to a clean browser.
4. Use Kerning's delivery retry action and confirm verification. A bad signature, stale timestamp, wrong release or removed homepage marker must fail verification. The new files never automatically overwrite, merge or deploy existing website pages.
