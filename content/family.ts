/**
 * Cross-brand cards rendered in the footer "Looking for another
 * Kerning brand?" module. The wordings come straight from the
 * sister-site signatures so the cross-link reads as one family.
 */
export const FAMILY_BRANDS = [
  {
    name: "Hospitality",
    href: "https://hospitality.kerning.ooo",
    tagline: "Culinary consulting, end to end.",
  },
  {
    name: "Architecture",
    href: "https://arch.kerning.ooo",
    tagline: "Architecture, shaped by craft.",
  },
  {
    name: "Studio",
    href: "https://studio.kerning.ooo",
    tagline: "Ideas, kerned into form.",
  },
] as const;

export type FamilyBrand = (typeof FAMILY_BRANDS)[number];
