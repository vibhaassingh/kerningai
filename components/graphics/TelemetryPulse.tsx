"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { cn } from "@/lib/cn";

type TelemetryStream = {
  /** Mono label rendered above the value, e.g. "Compressor cluster". */
  label: string;
  /** Final stable value the scramble settles on. */
  value: string;
  /** Optional unit shown to the right of the value. */
  unit?: string;
};

type Props = {
  streams?: TelemetryStream[];
  /** Height of the SVG sine line. */
  waveformHeight?: number;
  className?: string;
};

const DEFAULT_STREAMS: TelemetryStream[] = [
  { label: "Plant 04 · Compressor cluster", value: "−12.4%", unit: "mtd" },
  { label: "Combi oven #07", value: "T−19d", unit: "forecast" },
  { label: "FSMS variance · Line 2", value: "Live", unit: "agent" },
];

const SCRAMBLE_CHARS = "█▓▒░0123456789▮▪▫•";

/**
 * TelemetryPulse — three-line live-data ticker over a continuously
 * scrolling SVG sine waveform. The values briefly scramble (every
 * ~4s) before re-settling on the canonical reading. Looks like a
 * high-end ops dashboard, not a chaotic terminal.
 *
 * Designed to drop into any section as an ambient detail strip. The
 * rAF loop only runs while the component is in the viewport.
 */
export function TelemetryPulse({
  streams = DEFAULT_STREAMS,
  waveformHeight = 80,
  className,
}: Props) {
  const wrapRef = useRef<HTMLDivElement>(null);
  const pathRef = useRef<SVGPathElement>(null);
  const dotRef = useRef<SVGCircleElement>(null);
  const [scrambled, setScrambled] = useState<string[]>(() =>
    streams.map((s) => s.value),
  );

  const width = 800;
  const height = waveformHeight;

  // ── Waveform animation ────────────────────────────────────────
  useEffect(() => {
    const path = pathRef.current;
    const dot = dotRef.current;
    const wrap = wrapRef.current;
    if (!path || !dot || !wrap) return;

    const reduced = window.matchMedia(
      "(prefers-reduced-motion: reduce)",
    ).matches;

    let raf = 0;
    let inView = true;

    const obs = new IntersectionObserver(
      (entries) => {
        const e = entries[0];
        if (!e) return;
        inView = e.isIntersecting;
      },
      { threshold: 0 },
    );
    obs.observe(wrap);

    const start = performance.now();
    const segments = 80;
    const draw = (now: number) => {
      if (inView && !reduced) {
        const t = (now - start) / 1000;
        const points: string[] = [];
        for (let i = 0; i <= segments; i++) {
          const x = (i / segments) * width;
          // Two superposed sines — gives a richer telemetry-like
          // waveform without going chaotic
          const y =
            height / 2 +
            Math.sin(i * 0.18 + t * 1.8) * (height * 0.18) +
            Math.sin(i * 0.07 + t * 0.9) * (height * 0.12);
          points.push(`${i === 0 ? "M" : "L"} ${x.toFixed(1)} ${y.toFixed(1)}`);
        }
        path.setAttribute("d", points.join(" "));

        // Pulsing read-head — moves slightly, opacity throbs
        const headX =
          width * 0.84 + Math.sin(t * 0.6) * (width * 0.04);
        const headY =
          height / 2 +
          Math.sin(headX * 0.18 / (width / segments) + t * 1.8) *
            (height * 0.18) +
          Math.sin(headX * 0.07 / (width / segments) + t * 0.9) *
            (height * 0.12);
        dot.setAttribute("cx", headX.toFixed(1));
        dot.setAttribute("cy", headY.toFixed(1));
        const pulse = 0.55 + 0.45 * Math.abs(Math.sin(t * 2.4));
        dot.setAttribute("opacity", pulse.toFixed(3));
      }
      raf = requestAnimationFrame(draw);
    };
    raf = requestAnimationFrame(draw);

    return () => {
      cancelAnimationFrame(raf);
      obs.disconnect();
    };
  }, [height]);

  // ── Scramble the value labels every ~4s ───────────────────────
  useEffect(() => {
    const reduced = window.matchMedia(
      "(prefers-reduced-motion: reduce)",
    ).matches;
    if (reduced) {
      setScrambled(streams.map((s) => s.value));
      return;
    }

    let cancelled = false;

    const cycleOne = (idx: number) => {
      const target = streams[idx]?.value ?? "";
      const cyclesPerChar = 3;
      let step = 0;
      const total = target.length * cyclesPerChar;

      const tick = () => {
        if (cancelled) return;
        step += 1;
        const settled = Math.floor(step / cyclesPerChar);
        let next = "";
        for (let c = 0; c < target.length; c++) {
          if (c < settled) next += target[c];
          else if (target[c] === " ") next += " ";
          else next += SCRAMBLE_CHARS.charAt(
            Math.floor(Math.random() * SCRAMBLE_CHARS.length),
          );
        }
        setScrambled((cur) => {
          const copy = [...cur];
          copy[idx] = next;
          return copy;
        });
        if (step < total) {
          setTimeout(tick, 32);
        } else {
          setScrambled((cur) => {
            const copy = [...cur];
            copy[idx] = target;
            return copy;
          });
        }
      };
      tick();
    };

    // Trigger a scramble pass on a stagger every ~5s
    const interval = window.setInterval(() => {
      if (cancelled) return;
      streams.forEach((_, idx) => {
        window.setTimeout(() => cycleOne(idx), idx * 350);
      });
    }, 5200);

    // Run one immediately on mount so the values feel alive
    streams.forEach((_, idx) => {
      window.setTimeout(() => cycleOne(idx), 200 + idx * 350);
    });

    return () => {
      cancelled = true;
      window.clearInterval(interval);
    };
  }, [streams]);

  // Stable initial path so SSR matches first paint
  const initialPath = useMemo(() => {
    const segments = 80;
    const points: string[] = [];
    for (let i = 0; i <= segments; i++) {
      const x = (i / segments) * width;
      const y = height / 2 + Math.sin(i * 0.18) * (height * 0.18);
      points.push(`${i === 0 ? "M" : "L"} ${x.toFixed(1)} ${y.toFixed(1)}`);
    }
    return points.join(" ");
  }, [height]);

  return (
    <div
      ref={wrapRef}
      className={cn(
        "telemetry-pulse w-full text-[var(--color-text)]",
        className,
      )}
    >
      <ul className="space-y-1.5">
        {streams.map((s, i) => (
          <li
            key={s.label}
            className="grid items-baseline gap-3 grid-cols-[1fr_auto_auto] font-mono text-[12px] tracking-[0.04em]"
          >
            <span className="truncate text-[var(--color-text-muted)]">
              {s.label}
            </span>
            <span className="tabular-nums text-[var(--color-text)]">
              {scrambled[i] ?? s.value}
            </span>
            {s.unit && (
              <span className="text-[var(--color-text-faint)]">{s.unit}</span>
            )}
          </li>
        ))}
      </ul>

      <svg
        viewBox={`0 0 ${width} ${height}`}
        preserveAspectRatio="none"
        role="presentation"
        aria-hidden
        className="mt-4 block h-[80px] w-full"
      >
        {/* Hairline midline */}
        <line
          x1="0"
          y1={height / 2}
          x2={width}
          y2={height / 2}
          stroke="currentColor"
          strokeWidth="1"
          opacity="0.12"
        />
        {/* Waveform */}
        <path
          ref={pathRef}
          d={initialPath}
          stroke="currentColor"
          strokeWidth="1.25"
          fill="none"
          strokeLinecap="round"
          strokeLinejoin="round"
          opacity="0.75"
        />
        {/* Pulsing read-head */}
        <circle
          ref={dotRef}
          cx={width * 0.84}
          cy={height / 2}
          r="2.5"
          fill="currentColor"
          opacity="0.9"
        />
      </svg>
    </div>
  );
}
