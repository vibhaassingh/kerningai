"use client";

import { useEffect, useMemo, useRef } from "react";
import { cn } from "@/lib/cn";

type Props = {
  /** Logical node count. Lower for ambient backdrops, higher for hero. */
  nodeCount?: number;
  /** Pointer-influence radius in SVG units. */
  pointerRadius?: number;
  /** Number of nearest nodes to wire to the cursor when the pointer is in. */
  cursorWires?: number;
  /** Override the SVG viewBox aspect. Defaults to 16:10. */
  width?: number;
  height?: number;
  /** Optional class name for the wrapper. */
  className?: string;
  /** When false, the rAF loop never starts (use for screenshots / SSR debug). */
  animated?: boolean;
};

type Node = {
  /** Stable origin */
  ox: number;
  oy: number;
  /** Drift amplitude */
  ax: number;
  ay: number;
  /** Drift phase + speed */
  px: number;
  py: number;
  sx: number;
  sy: number;
  /** Current rendered position (mutated each frame) */
  cx: number;
  cy: number;
};

/**
 * OntologyGraph — schematic constellation of nodes connected by
 * hairline edges. Ambient drift via a single rAF loop; pointer-
 * reactive when the cursor is within `pointerRadius`. Pure SVG —
 * each node + edge is a real DOM element so it inherits `currentColor`
 * and respects the surrounding palette.
 *
 * Performance contract:
 *  - All per-frame work is `setAttribute` against a fixed set of
 *    refs. No React re-renders after mount.
 *  - Edges are pre-computed once (k-nearest neighbours).
 *  - Pointer-wires reuse a fixed pool of <line> elements so we don't
 *    grow / shrink the DOM on every move.
 */
export function OntologyGraph({
  nodeCount = 22,
  pointerRadius = 28,
  cursorWires = 3,
  width = 800,
  height = 500,
  className,
  animated = true,
}: Props) {
  const svgRef = useRef<SVGSVGElement>(null);
  const nodeElsRef = useRef<SVGCircleElement[]>([]);
  const edgeElsRef = useRef<SVGLineElement[]>([]);
  const wireElsRef = useRef<SVGLineElement[]>([]);
  const nodesRef = useRef<Node[]>([]);
  const edgesRef = useRef<Array<[number, number]>>([]);
  const pointerRef = useRef<{
    x: number;
    y: number;
    inside: boolean;
  }>({ x: -9999, y: -9999, inside: false });

  // ── Build nodes + edges (deterministic, stable across renders) ──
  const { layout, edges } = useMemo(() => {
    let seed = 47;
    const rand = () => {
      seed = (seed * 9301 + 49297) % 233280;
      return seed / 233280;
    };

    const padX = width * 0.08;
    const padY = height * 0.12;
    const layout: Node[] = Array.from({ length: nodeCount }, () => {
      const ox = padX + rand() * (width - padX * 2);
      const oy = padY + rand() * (height - padY * 2);
      // Drift amplitude — small enough to feel ambient
      const ax = 6 + rand() * 8;
      const ay = 4 + rand() * 6;
      const sx = 0.0004 + rand() * 0.0004;
      const sy = 0.0004 + rand() * 0.0004;
      const px = rand() * Math.PI * 2;
      const py = rand() * Math.PI * 2;
      return { ox, oy, ax, ay, sx, sy, px, py, cx: ox, cy: oy };
    });

    // k-nearest edges, with a cap so the graph stays sparse
    const k = 2;
    const edges: Array<[number, number]> = [];
    const seen = new Set<string>();
    for (let i = 0; i < layout.length; i++) {
      const distances: Array<{ j: number; d: number }> = [];
      const a = layout[i]!;
      for (let j = 0; j < layout.length; j++) {
        if (i === j) continue;
        const b = layout[j]!;
        const d = Math.hypot(a.ox - b.ox, a.oy - b.oy);
        distances.push({ j, d });
      }
      distances.sort((a, b) => a.d - b.d);
      for (const { j } of distances.slice(0, k)) {
        const key = i < j ? `${i}-${j}` : `${j}-${i}`;
        if (!seen.has(key)) {
          seen.add(key);
          edges.push([i, j]);
        }
      }
    }

    return { layout, edges };
  }, [nodeCount, width, height]);

  // Cache nodes/edges arrays for the rAF loop
  useEffect(() => {
    nodesRef.current = layout.map((n) => ({ ...n }));
    edgesRef.current = edges;
  }, [layout, edges]);

  // ── Animation loop ──────────────────────────────────────────────
  useEffect(() => {
    if (!animated) return;
    if (typeof window === "undefined") return;

    const reduced = window.matchMedia("(prefers-reduced-motion: reduce)")
      .matches;
    if (reduced) return;

    let raf = 0;
    const start = performance.now();

    // Track pointer in SVG-space coordinates
    const svg = svgRef.current;
    if (!svg) return;
    const onMove = (e: PointerEvent) => {
      const rect = svg.getBoundingClientRect();
      // Map client coords to SVG viewBox coords
      const x = ((e.clientX - rect.left) / rect.width) * width;
      const y = ((e.clientY - rect.top) / rect.height) * height;
      pointerRef.current.x = x;
      pointerRef.current.y = y;
      pointerRef.current.inside = true;
    };
    const onLeave = () => {
      pointerRef.current.inside = false;
    };
    svg.addEventListener("pointermove", onMove, { passive: true });
    svg.addEventListener("pointerleave", onLeave);

    const tick = (now: number) => {
      const t = now - start;
      const nodes = nodesRef.current;
      const edges = edgesRef.current;
      const ptr = pointerRef.current;

      // Drift each node along a slow Lissajous-ish path, blended with
      // a tiny pointer-attraction when inside the radius.
      for (let i = 0; i < nodes.length; i++) {
        const n = nodes[i]!;
        let cx = n.ox + Math.sin(t * n.sx + n.px) * n.ax;
        let cy = n.oy + Math.cos(t * n.sy + n.py) * n.ay;

        if (ptr.inside) {
          const dx = ptr.x - cx;
          const dy = ptr.y - cy;
          const dist = Math.hypot(dx, dy);
          if (dist < pointerRadius * 4) {
            const fall = Math.max(0, 1 - dist / (pointerRadius * 4));
            cx += dx * 0.08 * fall;
            cy += dy * 0.08 * fall;
          }
        }

        n.cx = cx;
        n.cy = cy;
        const el = nodeElsRef.current[i];
        if (el) {
          el.setAttribute("cx", cx.toFixed(2));
          el.setAttribute("cy", cy.toFixed(2));
        }
      }

      // Update edges
      for (let i = 0; i < edges.length; i++) {
        const [a, b] = edges[i]!;
        const el = edgeElsRef.current[i];
        if (!el) continue;
        const na = nodes[a]!;
        const nb = nodes[b]!;
        el.setAttribute("x1", na.cx.toFixed(2));
        el.setAttribute("y1", na.cy.toFixed(2));
        el.setAttribute("x2", nb.cx.toFixed(2));
        el.setAttribute("y2", nb.cy.toFixed(2));
      }

      // Cursor wires — pick the k closest in-range nodes
      const wires = wireElsRef.current;
      if (ptr.inside) {
        const ranked: Array<{ i: number; d: number }> = [];
        for (let i = 0; i < nodes.length; i++) {
          const n = nodes[i]!;
          const d = Math.hypot(ptr.x - n.cx, ptr.y - n.cy);
          if (d < pointerRadius * 6) ranked.push({ i, d });
        }
        ranked.sort((a, b) => a.d - b.d);
        const top = ranked.slice(0, cursorWires);
        for (let w = 0; w < wires.length; w++) {
          const el = wires[w]!;
          const slot = top[w];
          if (slot) {
            const n = nodes[slot.i]!;
            // Fade by proximity
            const fall = Math.max(0, 1 - slot.d / (pointerRadius * 6));
            el.setAttribute("x1", n.cx.toFixed(2));
            el.setAttribute("y1", n.cy.toFixed(2));
            el.setAttribute("x2", ptr.x.toFixed(2));
            el.setAttribute("y2", ptr.y.toFixed(2));
            el.setAttribute(
              "opacity",
              (0.55 * fall * fall).toFixed(3),
            );
          } else {
            el.setAttribute("opacity", "0");
          }
        }

        // Highlight nearby nodes via a CSS var the parent reads
        for (let i = 0; i < nodes.length; i++) {
          const el = nodeElsRef.current[i];
          if (!el) continue;
          const n = nodes[i]!;
          const d = Math.hypot(ptr.x - n.cx, ptr.y - n.cy);
          const fall = Math.max(0, 1 - d / (pointerRadius * 4));
          el.style.setProperty("--node-glow", fall.toFixed(3));
        }
      } else {
        for (let w = 0; w < wires.length; w++) {
          wires[w]?.setAttribute("opacity", "0");
        }
        for (let i = 0; i < nodes.length; i++) {
          const el = nodeElsRef.current[i];
          el?.style.setProperty("--node-glow", "0");
        }
      }

      raf = requestAnimationFrame(tick);
    };
    raf = requestAnimationFrame(tick);

    return () => {
      cancelAnimationFrame(raf);
      svg.removeEventListener("pointermove", onMove);
      svg.removeEventListener("pointerleave", onLeave);
    };
  }, [animated, cursorWires, height, pointerRadius, width]);

  return (
    <svg
      ref={svgRef}
      viewBox={`0 0 ${width} ${height}`}
      preserveAspectRatio="xMidYMid slice"
      role="presentation"
      aria-hidden
      className={cn(
        "ontology-graph block h-full w-full text-[var(--color-text)]",
        className,
      )}
    >
      {/* Edges */}
      <g
        stroke="currentColor"
        strokeWidth="1"
        strokeLinecap="square"
        opacity="0.18"
      >
        {edges.map(([a, b], i) => {
          const na = layout[a]!;
          const nb = layout[b]!;
          return (
            <line
              key={`e-${i}`}
              ref={(el) => {
                if (el) edgeElsRef.current[i] = el;
              }}
              x1={na.ox}
              y1={na.oy}
              x2={nb.ox}
              y2={nb.oy}
            />
          );
        })}
      </g>

      {/* Cursor wires (fixed pool) */}
      <g
        stroke="currentColor"
        strokeWidth="1"
        strokeDasharray="2 3"
        strokeLinecap="round"
      >
        {Array.from({ length: cursorWires }).map((_, i) => (
          <line
            key={`w-${i}`}
            ref={(el) => {
              if (el) wireElsRef.current[i] = el;
            }}
            x1="0"
            y1="0"
            x2="0"
            y2="0"
            opacity="0"
          />
        ))}
      </g>

      {/* Nodes */}
      <g>
        {layout.map((n, i) => (
          <circle
            key={`n-${i}`}
            ref={(el) => {
              if (el) nodeElsRef.current[i] = el;
            }}
            cx={n.ox}
            cy={n.oy}
            r="2.4"
            fill="currentColor"
            stroke="currentColor"
            strokeOpacity="0"
            className="ontology-node"
          />
        ))}
      </g>

      <style>{`
        .ontology-node {
          --node-glow: 0;
          transition: r 350ms cubic-bezier(0.22, 1, 0.36, 1);
          filter: drop-shadow(0 0 calc(var(--node-glow) * 6px) currentColor);
          opacity: calc(0.65 + var(--node-glow) * 0.35);
        }
      `}</style>
    </svg>
  );
}
