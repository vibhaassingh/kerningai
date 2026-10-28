import { beforeEach, afterEach, describe, expect, it, vi } from "vitest";
import { createElement } from "react";
import { renderToStaticMarkup } from "react-dom/server";

const session = vi.hoisted(() => ({ value: undefined as string | undefined }));
vi.mock("next/headers", () => ({
  cookies: async () => ({
    get: () => (session.value ? { value: session.value } : undefined),
  }),
}));
vi.mock("react", async (importOriginal) => ({
  ...(await importOriginal<typeof import("react")>()),
  cache: <T>(fn: T) => fn,
}));
vi.mock("@/components/sections/home/Hero", () => ({
  Hero: ({ content }: { content?: { headline: string } }) =>
    createElement(
      "h1",
      null,
      content?.headline ?? "Industry 5.0, on the floor.",
    ),
}));
vi.mock("@/components/sections/home/TelemetryStrip", () => ({
  TelemetryStrip: () => null,
}));
vi.mock("@/components/sections/home/ProofPoints", () => ({
  ProofPoints: () => null,
}));
vi.mock("@/components/sections/home/Manifesto", () => ({
  Manifesto: () => null,
}));
vi.mock("@/components/sections/home/ServicesGrid", () => ({
  ServicesGrid: () => null,
}));
vi.mock("@/components/sections/home/IndustryShowcase", () => ({
  IndustryShowcase: () => null,
}));
vi.mock("@/components/sections/home/Testimonials", () => ({
  Testimonials: () => null,
}));
vi.mock("@/components/sections/home/LocationsStrip", () => ({
  LocationsStrip: () => null,
}));
vi.mock("@/components/sections/home/InsightsPreview", () => ({
  InsightsPreview: () => null,
}));
vi.mock("@/components/sections/home/CTA", () => ({ CTA: () => null }));

const siteId = "12345678-1234-1234-1234-123456789abc";
const releaseId = "22345678-1234-1234-1234-123456789abc";
const body = () => ({
  site: { id: siteId, name: "Kerning AI" },
  release: { id: releaseId, number: 1 },
  pages: [
    {
      slug: "/",
      title: "Home",
      content: {
        eyebrow: "Connected intelligence",
        headline: "A published Kerning headline",
        description: "Published description",
        buttonText: "Talk to us",
        buttonLink: "/contact",
        seoTitle: "Published SEO",
        seoDescription: "SEO from the CMS",
        blocks: [
          {
            id: "32345678-1234-1234-1234-123456789abc",
            version: 1,
            type: "richText",
            heading: "CMS section",
            body: "Rich content from the release.",
          },
        ],
      },
    },
  ],
});
const fetcher = vi.fn<typeof fetch>();
beforeEach(() => {
  vi.resetModules();
  session.value = undefined;
  vi.stubEnv("KERNING_SITE_ID", siteId);
  vi.stubEnv("KERNING_PORTAL_ORIGIN", "https://kerning-portal.vercel.app");
  vi.stubGlobal("fetch", fetcher);
  fetcher.mockReset().mockImplementation(async () => Response.json(body()));
});
afterEach(() => {
  vi.unstubAllGlobals();
  vi.unstubAllEnvs();
});

describe("Kerning homepage mapping", () => {
  it("renders the actual released headline, blocks, metadata and matching proof marker", async () => {
    const { default: Page, generateMetadata } = await import(
      "@/app/(marketing)/page"
    );
    const html = renderToStaticMarkup(await Page());
    expect(html).toContain("A published Kerning headline");
    expect(html).toContain("Rich content from the release.");
    expect(html).toContain(`data-kerning-release="${releaseId}"`);
    expect(html).not.toContain("Private preview");
    const metadata = await generateMetadata();
    expect(metadata.title).toEqual({ absolute: "Published SEO" });
    expect(metadata.description).toBe("SEO from the CMS");
  });
  it("keeps the original public page and inherited SEO when there is no release", async () => {
    fetcher.mockImplementation(async () => new Response(null, { status: 404 }));
    const { default: Page, generateMetadata } = await import(
      "@/app/(marketing)/page"
    );
    const html = renderToStaticMarkup(await Page());
    expect(html).toContain("Industry 5.0, on the floor.");
    expect(html).not.toContain("data-kerning-release");
    expect(await generateMetadata()).toEqual({});
  });
  it("also uses the public fallback on a network failure without claiming verification", async () => {
    fetcher.mockRejectedValue(new Error("Connection failed"));
    const { default: Page } = await import("@/app/(marketing)/page");
    const html = renderToStaticMarkup(await Page());
    expect(html).toContain("Industry 5.0, on the floor.");
    expect(html).not.toContain("data-kerning-release");
  });
  it("requires an explicit server site ID; absent configuration makes no network call", async () => {
    vi.stubEnv("KERNING_SITE_ID", "");
    const { readHomepage } = await import("@/kerning/homepage");
    expect(await readHomepage()).toEqual({ kind: "fallback" });
    expect(fetcher).not.toHaveBeenCalled();
  });
  it("renders a private immutable snapshot without a published marker and disables indexing", async () => {
    session.value = "a".repeat(64);
    fetcher.mockImplementation(async () =>
      Response.json({ ...body(), release: null }),
    );
    const { default: Page, generateMetadata } = await import(
      "@/app/(marketing)/page"
    );
    const html = renderToStaticMarkup(await Page());
    expect(html).toContain("A published Kerning headline");
    expect(html).toContain("Private preview");
    expect(html).toContain("/api/kerning/preview-exit");
    expect(html).not.toContain("data-kerning-release");
    expect(html).not.toContain(session.value);
    const metadata = await generateMetadata();
    expect(metadata.robots).toEqual({
      index: false,
      follow: false,
      googleBot: { index: false, follow: false },
    });
  });
  it("shows preview recovery instead of public fallback when a preview expires", async () => {
    session.value = "a".repeat(64);
    fetcher.mockImplementation(async () => new Response(null, { status: 404 }));
    const { default: Page } = await import("@/app/(marketing)/page");
    const html = renderToStaticMarkup(await Page());
    expect(html).toContain("This private preview is unavailable");
    expect(html).toContain("Exit preview");
    expect(html).not.toContain("Industry 5.0, on the floor.");
    expect(html).not.toContain("data-kerning-release");
    expect(
      fetcher.mock.calls.every(([url]) =>
        String(url).includes("/api/preview?token="),
      ),
    ).toBe(true);
  });
  it("rejects a different site snapshot without exposing its content", async () => {
    session.value = "a".repeat(64);
    fetcher.mockImplementation(async () =>
      Response.json({
        ...body(),
        release: null,
        site: { id: releaseId, name: "Other client" },
      }),
    );
    const { default: Page } = await import("@/app/(marketing)/page");
    const html = renderToStaticMarkup(await Page());
    expect(html).toContain("This private preview is unavailable");
    expect(html).not.toContain("A published Kerning headline");
  });
  it("does not mark a release as mapped if the home entry is absent", async () => {
    fetcher.mockImplementation(async () =>
      Response.json({ ...body(), pages: [] }),
    );
    const { readHomepage } = await import("@/kerning/homepage");
    expect(await readHomepage()).toEqual({ kind: "fallback" });
    session.value = "a".repeat(64);
    fetcher.mockImplementation(async () =>
      Response.json({ ...body(), release: null, pages: [] }),
    );
    expect(await readHomepage()).toEqual({ kind: "preview-unavailable" });
  });
  it("treats a malformed preview cookie as an invalid private preview, never a fallback", async () => {
    session.value = "invalid";
    const { readHomepage } = await import("@/kerning/homepage");
    expect(await readHomepage()).toEqual({ kind: "preview-unavailable" });
    expect(fetcher).not.toHaveBeenCalled();
  });
});
