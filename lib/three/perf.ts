export type PerfTier = "low" | "mid" | "high";

export function detectPerfTier(): PerfTier {
  if (typeof window === "undefined") return "mid";

  const isMobile = window.matchMedia("(pointer: coarse)").matches;
  const cores = navigator.hardwareConcurrency ?? 4;
  const memory = (navigator as Navigator & { deviceMemory?: number }).deviceMemory ?? 4;

  if (isMobile && (cores < 6 || memory < 4)) return "low";
  if (isMobile) return "mid";

  if (cores >= 8 && memory >= 8) return "high";
  if (cores >= 4) return "mid";
  return "low";
}

export const TIER_PARTICLE_COUNT: Record<PerfTier, number> = {
  low: 3500,
  mid: 9000,
  high: 18000,
};

export const TIER_DPR: Record<PerfTier, [number, number]> = {
  low: [1, 1],
  mid: [1, 1.5],
  high: [1, 1.75],
};
