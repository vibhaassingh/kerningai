"use client";

import { MotionConfig } from "framer-motion";
import { easings, durations } from "@/lib/motion";

export function MotionConfigProvider({ children }: { children: React.ReactNode }) {
  return (
    <MotionConfig
      reducedMotion="user"
      transition={{ duration: durations.md, ease: easings.outQuint }}
    >
      {children}
    </MotionConfig>
  );
}
