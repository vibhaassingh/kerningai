/**
 * Cinematic media registry for Kerning AI.
 *
 * Stills come from Unsplash CDN (`images.unsplash.com/photo-{id}`) and
 * are server-cropped at request time. Videos come from Pexels CDN
 * (`videos.pexels.com/video-files/{id}/...`). Every consumer goes
 * through `<CinematicImage />` or `<CinematicVideo />` so the brand
 * treatment (grayscale + contrast + dark scrim) is applied in one place.
 *
 * If any URL 404s, the consumer falls through:
 *   • CinematicVideo → its poster still
 *   • CinematicImage → the dark `bg-bg-elev` placeholder rendered by
 *                      its wrapper border + grid
 * — so the page never breaks.
 */

export type CinematicAsset = {
  src: string;
  alt: string;
  focal?: "centre" | "top" | "bottom" | "left" | "right";
  credit?: string;
};

export type CinematicVideoAsset = {
  src: string;
  /** Always paired with a still poster for instant first paint and
   *  reduced-motion / load-failure fallback. */
  poster: string;
  alt: string;
  focal?: CinematicAsset["focal"];
};

const UNSPLASH = (id: string, w = 2400) =>
  `https://images.unsplash.com/photo-${id}?auto=format&fit=crop&q=80&w=${w}`;

// ─── Hero video ────────────────────────────────────────────────────
// Robotic arms placing solar cells on conveyor belts — self-hosted
// out of `public/videos/` so we control the bitrate, the loop point,
// and CDN behaviour. Codec is H.264 in an ISO Media container, served
// from Vercel with `video/mp4` MIME — plays cleanly in every modern
// browser. No audio track (silent loop).
export const HERO_VIDEO: CinematicVideoAsset = {
  src: "/videos/hero-industry.mp4",
  poster: UNSPLASH("1518709268805-4e9042af9f23", 2400),
  alt: "Robotic arms placing solar cells on a manufacturing conveyor",
};

// ─── Per-service hero stills ───────────────────────────────────────
export const SERVICE_MEDIA: Record<string, CinematicAsset> = {
  "operational-ontology": {
    src: UNSPLASH("1518709268805-4e9042af9f23"),
    alt: "Macro detail of precision-engineered metallic surface",
  },
  "agentic-workflows": {
    src: UNSPLASH("1518770660439-4636190af475"),
    alt: "Sequential circuitry, abstract logic flow",
  },
  "predictive-maintenance": {
    src: UNSPLASH("1565793298595-6a879b1d9492"),
    alt: "Industrial bearing assembly, monochromatic",
  },
  "energy-utility-emissions": {
    src: UNSPLASH("1473341304170-971dccb5ac1e"),
    alt: "Industrial chillers / utility stack at dusk",
    focal: "bottom",
  },
  "hygiene-safety-compliance": {
    src: UNSPLASH("1556909114-f6e7ad7d3136"),
    alt: "Stainless commercial kitchen, motion blur",
  },
  "decision-intelligence": {
    src: UNSPLASH("1551288049-bebda4e38f71"),
    alt: "Architectural data visualisation surface",
  },
};

// ─── Per-industry hero stills ──────────────────────────────────────
export const INDUSTRY_MEDIA: Record<string, CinematicAsset> = {
  hospitality: {
    src: UNSPLASH("1556909114-f6e7ad7d3136"),
    alt: "High-end commercial kitchen, stainless steel and motion blur",
  },
  manufacturing: {
    // Replaces a 404'd CNC photo; this one (steel / industrial detail)
    // is a known-stable Unsplash ID that holds up under heavy grayscale.
    src: UNSPLASH("1517048676732-d65bc937f952"),
    alt: "Manufacturing floor, machined steel under rim lighting",
  },
  institutional: {
    src: UNSPLASH("1497366216548-37526070297c"),
    alt: "Brutalist institutional architecture",
  },
};

// ─── Industry / tech videos ────────────────────────────────────────
// Pexels CDN — autoplaying loops used as in-section atmospheric layers
// on industry + service detail pages. Each pairs with a poster that
// loads instantly and stands in if the mp4 fails to fetch.
export const INDUSTRY_VIDEOS: Record<string, CinematicVideoAsset> = {
  manufacturing: {
    src: "https://videos.pexels.com/video-files/3209828/3209828-uhd_3840_2160_25fps.mp4",
    poster: UNSPLASH("1517048676732-d65bc937f952"),
    alt: "Robotic arm operating in a manufacturing cell",
  },
  hospitality: {
    src: "https://videos.pexels.com/video-files/3196284/3196284-hd_1920_1080_25fps.mp4",
    poster: UNSPLASH("1556909114-f6e7ad7d3136"),
    alt: "Commercial kitchen brigade in motion",
  },
  institutional: {
    src: "https://videos.pexels.com/video-files/4990243/4990243-hd_1920_1080_24fps.mp4",
    poster: UNSPLASH("1497366216548-37526070297c"),
    alt: "Institutional architecture, slow pan",
  },
};

export const SERVICE_VIDEOS: Record<string, CinematicVideoAsset> = {
  "predictive-maintenance": {
    src: "https://videos.pexels.com/video-files/3045163/3045163-hd_1280_720_25fps.mp4",
    poster: UNSPLASH("1565793298595-6a879b1d9492"),
    alt: "Industrial machinery in operation",
  },
  "agentic-workflows": {
    src: "https://videos.pexels.com/video-files/3024084/3024084-hd_1920_1080_30fps.mp4",
    poster: UNSPLASH("1518770660439-4636190af475"),
    alt: "Abstract data flow, sequential circuitry",
  },
  "energy-utility-emissions": {
    src: "https://videos.pexels.com/video-files/4990243/4990243-hd_1920_1080_24fps.mp4",
    poster: UNSPLASH("1473341304170-971dccb5ac1e"),
    alt: "Utility infrastructure at dusk",
  },
};

// ─── Convenience accessors ────────────────────────────────────────
export function getServiceMedia(slug: string): CinematicAsset | undefined {
  return SERVICE_MEDIA[slug];
}
export function getIndustryMedia(slug: string): CinematicAsset | undefined {
  return INDUSTRY_MEDIA[slug];
}
export function getServiceVideo(slug: string): CinematicVideoAsset | undefined {
  return SERVICE_VIDEOS[slug];
}
export function getIndustryVideo(slug: string): CinematicVideoAsset | undefined {
  return INDUSTRY_VIDEOS[slug];
}
