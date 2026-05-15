import { describe, expect, it, beforeAll } from "vitest";

// `lib/env.ts` is `server-only` — set the env vars Vitest's node env needs
// BEFORE it's imported by the helpers we're testing.
beforeAll(() => {
  process.env.NEXT_PUBLIC_SITE_URL = "https://kerningai.vercel.app";
  process.env.APP_ENV = "production";
  process.env.ALLOWED_REDIRECT_HOSTS = "kerningai.eu,portal.kerning.ooo";
});

describe("safeRedirectTarget", () => {
  it("returns relative paths unchanged", async () => {
    const { safeRedirectTarget } = await import("@/lib/auth/redirects");
    expect(safeRedirectTarget("/portal/dashboard")).toBe("/portal/dashboard");
    expect(safeRedirectTarget("/admin/clients?id=1")).toBe(
      "/admin/clients?id=1",
    );
  });

  it("rejects protocol-relative URLs", async () => {
    const { safeRedirectTarget } = await import("@/lib/auth/redirects");
    expect(safeRedirectTarget("//evil.example/")).toBe("/");
    expect(safeRedirectTarget("////malicious")).toBe("/");
  });

  it("rejects absolute URLs to non-allowlisted hosts", async () => {
    const { safeRedirectTarget } = await import("@/lib/auth/redirects");
    expect(safeRedirectTarget("https://evil.example/steal")).toBe("/");
    expect(safeRedirectTarget("http://attacker.test")).toBe("/");
  });

  it("accepts absolute URLs to allowlisted hosts", async () => {
    const { safeRedirectTarget } = await import("@/lib/auth/redirects");
    expect(safeRedirectTarget("https://kerningai.eu/portal")).toBe(
      "https://kerningai.eu/portal",
    );
    expect(safeRedirectTarget("https://portal.kerning.ooo/dashboard")).toBe(
      "https://portal.kerning.ooo/dashboard",
    );
    expect(safeRedirectTarget("https://kerningai.vercel.app/")).toBe(
      "https://kerningai.vercel.app/",
    );
  });

  it("returns / for null, undefined, and empty input", async () => {
    const { safeRedirectTarget } = await import("@/lib/auth/redirects");
    expect(safeRedirectTarget(null)).toBe("/");
    expect(safeRedirectTarget(undefined)).toBe("/");
    expect(safeRedirectTarget("")).toBe("/");
  });

  it("returns / for malformed URLs", async () => {
    const { safeRedirectTarget } = await import("@/lib/auth/redirects");
    expect(safeRedirectTarget("not a url")).toBe("/");
    expect(safeRedirectTarget("javascript:alert(1)")).toBe("/");
  });
});

describe("safeRedirectUrl", () => {
  it("absolutizes relative paths against SITE_URL", async () => {
    const { safeRedirectUrl } = await import("@/lib/auth/redirects");
    expect(safeRedirectUrl("/portal/dashboard")).toBe(
      "https://kerningai.vercel.app/portal/dashboard",
    );
  });

  it("preserves allow-listed absolute URLs", async () => {
    const { safeRedirectUrl } = await import("@/lib/auth/redirects");
    expect(safeRedirectUrl("https://kerningai.eu/portal")).toBe(
      "https://kerningai.eu/portal",
    );
  });

  it("falls back to SITE_URL root for unsafe input", async () => {
    const { safeRedirectUrl } = await import("@/lib/auth/redirects");
    expect(safeRedirectUrl("https://evil.example/")).toBe(
      "https://kerningai.vercel.app/",
    );
  });
});
