import "server-only";
import { cache } from "react";
import { cookies } from "next/headers";

export const KERNING_SITE_ID = process.env.KERNING_SITE_ID || "";
export const PREVIEW_COOKIE = "kerning-preview-" + KERNING_SITE_ID;
export type KerningImage = { mediaId: string; alt: string; caption?: string };
type BlockBase = { id: string; version: 1 };
export type KerningBlock =
  | (BlockBase & { type: "richText"; heading: string; body: string })
  | (BlockBase & { type: "image" } & KerningImage)
  | (BlockBase & {
      type: "services";
      heading: string;
      items: { title: string; description: string; link?: string }[];
    })
  | (BlockBase & {
      type: "testimonials";
      heading: string;
      items: { quote: string; name: string; role: string }[];
    })
  | (BlockBase & {
      type: "faq";
      heading: string;
      items: { question: string; answer: string }[];
    })
  | (BlockBase & { type: "gallery"; heading: string; images: KerningImage[] });
export type KerningContent = {
  eyebrow: string;
  headline: string;
  description: string;
  buttonText: string;
  buttonLink: string;
  seoTitle: string;
  seoDescription: string;
  blocks?: KerningBlock[];
  contentKind?: "page" | "blog" | "service";
  excerpt?: string;
  publishedDate?: string;
};
export type KerningPage = {
  slug: string;
  title: string;
  content: KerningContent;
};
export type KerningSnapshot = {
  site: { id: string; name: string };
  release: { id: string; number: number } | null;
  pages: KerningPage[];
};
export type KerningRelease = KerningSnapshot & { preview: boolean };
export const isID = (value: unknown): value is string =>
  typeof value === "string" &&
  /^[a-f0-9]{8}-[a-f0-9]{4}-[a-f0-9]{4}-[a-f0-9]{4}-[a-f0-9]{12}$/i.test(value);
export const isPreviewToken = (value: unknown): value is string =>
  typeof value === "string" && /^[a-f0-9]{64}$/.test(value);

/** Only this server-controlled HTTPS origin can receive network requests. */
export function portalURL(path: string): URL {
  if (!isID(KERNING_SITE_ID))
    throw new Error("KERNING_SITE_ID must be a valid portal site ID.");
  const origin = process.env.KERNING_PORTAL_ORIGIN;
  if (!origin)
    throw new Error(
      "Set KERNING_PORTAL_ORIGIN to the deployed Kerning portal origin.",
    );
  const base = new URL(origin);
  if (
    base.protocol !== "https:" ||
    base.username ||
    base.password ||
    base.search ||
    base.hash ||
    base.pathname !== "/" ||
    base.port ||
    !base.hostname.includes(".") ||
    /^[\d.]+$/.test(base.hostname) ||
    /(?:^|\.)(?:localhost|local|internal|test|invalid)$/.test(base.hostname)
  )
    throw new Error(
      "KERNING_PORTAL_ORIGIN must be a trusted public HTTPS origin, without a path or credentials.",
    );
  if (!path.startsWith("/api/") || path.includes("\\") || path.includes("#"))
    throw new Error("Unexpected portal path.");
  const url = new URL(path, base);
  if (url.origin !== base.origin) throw new Error("Unexpected portal origin.");
  return url;
}
export function safeLink(value: string): boolean {
  if (!value || /[\s\\\u0000-\u001f\u007f]/.test(value)) return false;
  try {
    if (value.startsWith("/") || value.startsWith("#"))
      return (
        !value.startsWith("//") &&
        !/%(?:2f|5c|00)/i.test(value) &&
        new URL(value, "https://kerning.invalid").origin ===
          "https://kerning.invalid"
      );
    const url = new URL(value);
    return (
      url.protocol === "https:" &&
      !url.username &&
      !url.password &&
      Boolean(url.hostname)
    );
  } catch {
    return false;
  }
}

const object = (v: unknown): v is Record<string, unknown> =>
  Boolean(v) && typeof v === "object" && !Array.isArray(v);
const text = (v: unknown, max: number): v is string =>
  typeof v === "string" &&
  v.length <= max &&
  !/[\u0000-\u0008\u000b\u000c\u000e-\u001f\u007f]/.test(v);
const image = (v: unknown): boolean =>
  object(v) &&
  isID(v.mediaId) &&
  text(v.alt, 300) &&
  (v.caption === undefined || text(v.caption, 500));
const items = (v: unknown, max: number, check: (item: unknown) => boolean) =>
  Array.isArray(v) && v.length > 0 && v.length <= max && v.every(check);
function block(v: unknown): boolean {
  if (!object(v) || !isID(v.id) || v.version !== 1) return false;
  if (v.type === "image") return image(v);
  if (!text(v.heading, 180)) return false;
  switch (v.type) {
    case "richText":
      return text(v.body, 12000);
    case "services":
      return items(
        v.items,
        12,
        (item) =>
          object(item) &&
          text(item.title, 160) &&
          text(item.description, 1200) &&
          (item.link === undefined ||
            (text(item.link, 300) && safeLink(item.link))),
      );
    case "testimonials":
      return items(
        v.items,
        12,
        (item) =>
          object(item) &&
          text(item.quote, 2000) &&
          text(item.name, 160) &&
          text(item.role, 200),
      );
    case "faq":
      return items(
        v.items,
        20,
        (item) =>
          object(item) && text(item.question, 300) && text(item.answer, 4000),
      );
    case "gallery":
      return items(v.images, 12, image);
    default:
      return false;
  }
}
function content(v: unknown): boolean {
  if (
    !object(v) ||
    ![
      "eyebrow",
      "headline",
      "description",
      "buttonText",
      "buttonLink",
      "seoTitle",
      "seoDescription",
    ].every((key) => text(v[key], 12000))
  )
    return false;
  if (v.buttonLink && !safeLink(String(v.buttonLink))) return false;
  if (
    v.contentKind !== undefined &&
    !["page", "blog", "service"].includes(String(v.contentKind))
  )
    return false;
  if (v.excerpt !== undefined && !text(v.excerpt, 400)) return false;
  if (
    v.publishedDate !== undefined &&
    (!text(v.publishedDate, 10) ||
      (v.publishedDate !== "" && !/^\d{4}-\d{2}-\d{2}$/.test(v.publishedDate)))
  )
    return false;
  if (
    v.blocks !== undefined &&
    (!Array.isArray(v.blocks) ||
      v.blocks.length > 30 ||
      !v.blocks.every(block) ||
      new Set(v.blocks.map((b) => b.id)).size !== v.blocks.length)
  )
    return false;
  return true;
}
function snapshot(value: unknown, preview: boolean): KerningSnapshot {
  if (
    !object(value) ||
    !object(value.site) ||
    value.site.id !== KERNING_SITE_ID ||
    !text(value.site.name, 300) ||
    !Array.isArray(value.pages) ||
    value.pages.length > 100
  )
    throw new Error("Unexpected Kerning content response.");
  if (
    preview
      ? value.release !== null
      : !object(value.release) ||
        !isID(value.release.id) ||
        !Number.isSafeInteger(value.release.number) ||
        Number(value.release.number) < 1
  )
    throw new Error("Unexpected Kerning release response.");
  if (
    !value.pages.every(
      (page) =>
        object(page) &&
        text(page.slug, 300) &&
        /^\/(?:[a-z0-9-]+\/?)*$/.test(page.slug) &&
        text(page.title, 300) &&
        content(page.content),
    ) ||
    new Set(value.pages.map((p) => p.slug)).size !== value.pages.length
  )
    throw new Error("Unexpected Kerning page response.");
  return value as KerningSnapshot;
}
/** Bounded streaming avoids buffering arbitrary responses before checking their size. */
export async function boundedBytes(
  response: Response,
  maximum: number,
): Promise<Uint8Array> {
  if (Number(response.headers.get("content-length")) > maximum)
    throw new Error("Kerning response is too large.");
  const reader = response.body?.getReader();
  if (!reader) throw new Error("Kerning response has no body.");
  const chunks: Uint8Array[] = [];
  let size = 0;
  try {
    for (;;) {
      const { done, value } = await reader.read();
      if (done) break;
      size += value.byteLength;
      if (size > maximum) throw new Error("Kerning response is too large.");
      chunks.push(value);
    }
  } catch (error) {
    await reader.cancel();
    throw error;
  } finally {
    reader.releaseLock();
  }
  const output = new Uint8Array(size);
  let offset = 0;
  for (const part of chunks) {
    output.set(part, offset);
    offset += part.byteLength;
  }
  return output;
}
async function fetchSnapshot(
  path: string,
  preview: boolean,
): Promise<KerningSnapshot> {
  const response = await fetch(portalURL(path), {
    cache: "no-store",
    redirect: "error",
    signal: AbortSignal.timeout(10000),
    headers: { Accept: "application/json" },
  });
  if (!response.ok)
    throw new Error(
      preview
        ? "This private preview expired or is unavailable. Exit preview and open a new link from Kerning."
        : "Kerning published content is unavailable.",
    );
  return snapshot(
    JSON.parse(
      new TextDecoder().decode(await boundedBytes(response, 16 * 1024 * 1024)),
    ),
    preview,
  );
}
export async function getKerningPublishedRelease(): Promise<KerningRelease> {
  return {
    ...(await fetchSnapshot("/api/delivery/" + KERNING_SITE_ID, false)),
    preview: false,
  };
}
export async function getKerningPreview(
  token: string,
): Promise<KerningRelease> {
  if (!isPreviewToken(token)) throw new Error("Invalid preview token.");
  return {
    ...(await fetchSnapshot("/api/preview?token=" + token, true)),
    preview: true,
  };
}
export async function previewToken(): Promise<string | undefined> {
  const token = (await cookies()).get(PREVIEW_COOKIE)?.value;
  if (token !== undefined && !isPreviewToken(token))
    throw new Error("Invalid preview cookie. Exit preview to continue.");
  return token;
}
// React cache deduplicates this immutable snapshot within one server render, not across users.
export const getKerningRelease = cache(async (): Promise<KerningRelease> => {
  const token = await previewToken();
  return token ? getKerningPreview(token) : getKerningPublishedRelease();
});
export async function getKerningPage(
  slug: string,
): Promise<KerningPage | null> {
  return (
    (await getKerningRelease()).pages.find((page) => page.slug === slug) ?? null
  );
}
export function mediaIDs(release: KerningSnapshot): string[] {
  return [
    ...new Set(
      release.pages.flatMap((page) =>
        (page.content.blocks || []).flatMap((block) =>
          block.type === "image"
            ? [block.mediaId]
            : block.type === "gallery"
              ? block.images.map((image) => image.mediaId)
              : [],
        ),
      ),
    ),
  ];
}
export function getKerningMediaURL(id: string): string {
  if (!isID(id)) throw new Error("Invalid media ID.");
  // Same-origin proxy keeps private preview credentials out of image URLs and browser JavaScript.
  return "/api/kerning/media?id=" + encodeURIComponent(id);
}
