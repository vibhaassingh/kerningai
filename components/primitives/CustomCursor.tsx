"use client";

import { useEffect, useRef } from "react";
import { isFinePointer, prefersReducedMotion } from "@/lib/animations/reducedMotion";

type Variant = "default" | "link" | "view" | "drag" | "hidden";

const VARIANT_SCALE: Record<Variant, number> = {
  default: 1,
  link: 1.7,
  view: 2.6,
  drag: 2.1,
  hidden: 0,
};

/**
 * Viewfinder cursor — four corner brackets framing a hairline crosshair.
 * Reads as engineering / camera / measurement, mirroring the Hero frame
 * brackets. Fully imperative (no React state per frame, no context, no
 * mix-blend-mode). The position div gets per-frame translates; the
 * inner scale wrapper gets a CSS-transitioned `scale()` driven by a
 * custom property — so the visual response to hover is GPU-cheap.
 */
export function CustomCursor() {
  const frameRef = useRef<HTMLDivElement>(null);
  const innerRef = useRef<HTMLDivElement>(null);
  const dotRef = useRef<HTMLDivElement>(null);
  const labelRef = useRef<HTMLSpanElement>(null);

  useEffect(() => {
    if (!isFinePointer() || prefersReducedMotion()) return;

    const frame = frameRef.current;
    const inner = innerRef.current;
    const dot = dotRef.current;
    const label = labelRef.current;
    if (!frame || !inner || !dot || !label) return;

    const target = { x: window.innerWidth / 2, y: window.innerHeight / 2 };
    const framePos = { x: target.x, y: target.y };
    let raf = 0;

    let currentVariant: Variant = "default";
    let currentLabel = "";
    let lastTarget: Element | null = null;

    const lerp = (a: number, b: number, t: number) => a + (b - a) * t;

    const applyVariant = (v: Variant, l: string) => {
      inner.style.setProperty("--cursor-scale", String(VARIANT_SCALE[v]));
      inner.style.opacity = v === "hidden" ? "0" : "1";
      if (l !== currentLabel) {
        label.textContent = l;
        label.style.opacity = l ? "1" : "0";
        currentLabel = l;
      }
      currentVariant = v;
    };

    const onMove = (e: MouseEvent) => {
      target.x = e.clientX;
      target.y = e.clientY;

      // Skip the closest() walk if the underlying DOM target hasn't
      // changed — this is the primary CPU win on mousemove.
      const t = e.target as Element | null;
      if (t === lastTarget) return;
      lastTarget = t;

      const cursorEl = t?.closest("[data-cursor]") as HTMLElement | null;
      const v = (cursorEl?.dataset.cursor as Variant) || "default";
      const l = cursorEl?.dataset.cursorLabel || "";
      if (v !== currentVariant || l !== currentLabel) applyVariant(v, l);
    };

    const tick = () => {
      framePos.x = lerp(framePos.x, target.x, 0.22);
      framePos.y = lerp(framePos.y, target.y, 0.22);
      dot.style.transform = `translate3d(${target.x}px, ${target.y}px, 0) translate(-50%, -50%)`;
      frame.style.transform = `translate3d(${framePos.x}px, ${framePos.y}px, 0) translate(-50%, -50%)`;
      raf = requestAnimationFrame(tick);
    };

    const onLeave = () => {
      frame.style.opacity = "0";
      dot.style.opacity = "0";
    };
    const onEnter = () => {
      frame.style.opacity = "1";
      dot.style.opacity = "1";
    };

    window.addEventListener("mousemove", onMove, { passive: true });
    document.addEventListener("mouseleave", onLeave);
    document.addEventListener("mouseenter", onEnter);
    raf = requestAnimationFrame(tick);

    return () => {
      window.removeEventListener("mousemove", onMove);
      document.removeEventListener("mouseleave", onLeave);
      document.removeEventListener("mouseenter", onEnter);
      cancelAnimationFrame(raf);
    };
  }, []);

  return (
    <>
      {/* Hairline centre dot — true pointer position. */}
      <div
        ref={dotRef}
        aria-hidden
        style={{
          position: "fixed",
          top: 0,
          left: 0,
          width: 3,
          height: 3,
          background: "#ffffff",
          pointerEvents: "none",
          zIndex: 100,
          transition: "opacity 200ms ease",
          willChange: "transform",
        }}
      />

      {/* Viewfinder frame — outer div gets the imperative translate. */}
      <div
        ref={frameRef}
        aria-hidden
        style={{
          position: "fixed",
          top: 0,
          left: 0,
          width: 28,
          height: 28,
          pointerEvents: "none",
          zIndex: 99,
          transition: "opacity 200ms ease",
          willChange: "transform",
        }}
      >
        {/* Inner scale wrapper — CSS-transitioned via --cursor-scale. */}
        <div
          ref={innerRef}
          style={
            {
              position: "absolute",
              inset: 0,
              color: "#ffffff",
              transform: "scale(var(--cursor-scale, 1))",
              transformOrigin: "center",
              transition:
                "transform 350ms cubic-bezier(0.22,1,0.36,1), opacity 200ms ease",
              "--cursor-scale": 1,
            } as React.CSSProperties
          }
        >
          <span style={bracketStyle("tl")} />
          <span style={bracketStyle("tr")} />
          <span style={bracketStyle("bl")} />
          <span style={bracketStyle("br")} />
        </div>

        {/* Label sits below the cursor, doesn't scale with the frame. */}
        <span
          ref={labelRef}
          style={{
            position: "absolute",
            left: "50%",
            top: "calc(100% + 16px)",
            transform: "translateX(-50%)",
            whiteSpace: "nowrap",
            fontSize: 9,
            letterSpacing: "0.28em",
            textTransform: "uppercase",
            fontFamily: "var(--font-body)",
            color: "#ffffff",
            opacity: 0,
            transition: "opacity 200ms ease",
            textShadow: "0 0 6px rgba(0,0,0,0.9)",
          }}
        />
      </div>
    </>
  );
}

function bracketStyle(corner: "tl" | "tr" | "bl" | "br"): React.CSSProperties {
  const size = 6;
  const stroke = "1px solid currentColor";
  const base: React.CSSProperties = {
    position: "absolute",
    width: size,
    height: size,
    pointerEvents: "none",
  };
  switch (corner) {
    case "tl":
      return { ...base, top: 0, left: 0, borderTop: stroke, borderLeft: stroke };
    case "tr":
      return { ...base, top: 0, right: 0, borderTop: stroke, borderRight: stroke };
    case "bl":
      return { ...base, bottom: 0, left: 0, borderBottom: stroke, borderLeft: stroke };
    case "br":
      return { ...base, bottom: 0, right: 0, borderBottom: stroke, borderRight: stroke };
  }
}
