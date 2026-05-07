import type { Transition } from "framer-motion";

/**
 * Family spring presets — synced with Kerning Arch / Hospitality.
 * Spring physics on every interaction, no linear or bezier on
 * hover / tap / page changes.
 */
export const springs = {
  soft:   { type: "spring", stiffness: 200, damping: 30, mass: 0.9 } as const,
  firm:   { type: "spring", stiffness: 400, damping: 25, mass: 0.7 } as const,
  snappy: { type: "spring", stiffness: 520, damping: 32, mass: 0.5 } as const,
  bouncy: { type: "spring", stiffness: 320, damping: 18, mass: 0.7 } as const,
  page:   { type: "spring", stiffness: 220, damping: 28, mass: 1 }   as const,
  apple:  { type: "spring", stiffness: 400, damping: 30, mass: 0.8 } as const,
} satisfies Record<string, Transition>;

export const HOVER_SCALE = 1.02;
export const TAP_SCALE = 0.95;
export const MAGNETIC_RADIUS = 120;
export const MAGNETIC_PULL = 28;
