"use client";

import { Canvas } from "@react-three/fiber";
import { useEffect, useRef, useState } from "react";
import { OntologyGraph } from "./OntologyGraph";
import { detectPerfTier, TIER_DPR, type PerfTier } from "@/lib/three/perf";
import { prefersReducedMotion } from "@/lib/animations/reducedMotion";

const TIER_NODE_COUNT: Record<PerfTier, number> = {
  low: 28,
  mid: 48,
  high: 72,
};

export default function HeroCanvas() {
  const wrapRef = useRef<HTMLDivElement>(null);
  const [tier, setTier] = useState<PerfTier>("mid");
  const [enabled, setEnabled] = useState(true);
  const [active, setActive] = useState(true);

  useEffect(() => {
    if (prefersReducedMotion()) {
      setEnabled(false);
      return;
    }
    setTier(detectPerfTier());
  }, []);

  // Pause the canvas entirely when scrolled out of view. Saves the cost
  // of the per-frame render pass (vertex + fragment shaders + draw calls)
  // for the entire time the hero isn't visible.
  useEffect(() => {
    const el = wrapRef.current;
    if (!el) return;
    const io = new IntersectionObserver(
      (entries) => {
        const entry = entries[0];
        if (!entry) return;
        setActive(entry.isIntersecting);
      },
      { threshold: 0, rootMargin: "100px" },
    );
    io.observe(el);
    return () => io.disconnect();
  }, []);

  if (!enabled) return null;

  const dpr = TIER_DPR[tier];
  const nodeCount = TIER_NODE_COUNT[tier];

  return (
    <div ref={wrapRef} className="h-full w-full">
      <Canvas
        dpr={dpr}
        camera={{ position: [0, 0, 6.5], fov: 42 }}
        frameloop={active ? "always" : "never"}
        gl={{
          antialias: true,
          powerPreference: "high-performance",
          alpha: true,
        }}
        style={{ width: "100%", height: "100%" }}
      >
        <OntologyGraph nodeCount={nodeCount} connectRadius={1.05} />
      </Canvas>
    </div>
  );
}
