import type { Transition, Variants } from "framer-motion";

export const easings = {
  outQuint: [0.22, 1, 0.36, 1] as const,
  inOutCubic: [0.65, 0, 0.35, 1] as const,
  outExpo: [0.16, 1, 0.3, 1] as const,
} as const;

export const durations = {
  xs: 0.2,
  sm: 0.4,
  md: 0.7,
  lg: 1.2,
  xl: 2.0,
} as const;

export const fadeUp: Variants = {
  hidden: { opacity: 0, y: 24 },
  visible: {
    opacity: 1,
    y: 0,
    transition: { duration: durations.md, ease: easings.outQuint },
  },
};

export const fadeIn: Variants = {
  hidden: { opacity: 0 },
  visible: {
    opacity: 1,
    transition: { duration: durations.sm, ease: easings.outQuint },
  },
};

export const stagger = (delay = 0.06): Variants => ({
  hidden: {},
  visible: {
    transition: {
      staggerChildren: delay,
      delayChildren: 0.1,
    },
  },
});

export const baseTransition: Transition = {
  duration: durations.md,
  ease: easings.outQuint,
};
