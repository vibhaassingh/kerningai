import "server-only";
import { cache } from "react";
import { cookies } from "next/headers";
import {
  getKerningRelease,
  PREVIEW_COOKIE,
  type KerningPage,
  type KerningRelease,
} from "./content";

export type HomepageContent =
  | { kind: "mapped"; snapshot: KerningRelease; page: KerningPage }
  | { kind: "fallback" }
  | { kind: "preview-unavailable" };

/** Public outages keep the established site available. A private preview never substitutes public content. */
export const readHomepage = cache(async (): Promise<HomepageContent> => {
  const privatePreview = Boolean((await cookies()).get(PREVIEW_COOKIE)?.value);
  try {
    const snapshot = await getKerningRelease();
    const page = snapshot.pages.find((page) => page.slug === "/");
    if (!page)
      return { kind: privatePreview ? "preview-unavailable" : "fallback" };
    return { kind: "mapped", snapshot, page };
  } catch {
    return { kind: privatePreview ? "preview-unavailable" : "fallback" };
  }
});
