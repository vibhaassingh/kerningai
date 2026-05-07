export type MagneticOptions = {
  strength?: number;
  radius?: number;
};

/**
 * Magnetic hover. Caches the element's bounding rect (refreshed on
 * scroll/resize only) so we don't trigger a forced layout on every
 * mousemove. Skips the lerp loop entirely when the cursor is outside
 * an extended bail-out radius.
 */
export function attachMagnetic(
  el: HTMLElement,
  { strength = 0.35, radius = 120 }: MagneticOptions = {},
): () => void {
  let raf = 0;
  let target = { x: 0, y: 0 };
  const current = { x: 0, y: 0 };
  let rect = el.getBoundingClientRect();
  const bail = radius * 1.6; // skip work when the cursor is far away

  const lerp = (a: number, b: number, t: number) => a + (b - a) * t;

  const refreshRect = () => {
    rect = el.getBoundingClientRect();
  };

  const tick = () => {
    current.x = lerp(current.x, target.x, 0.18);
    current.y = lerp(current.y, target.y, 0.18);
    el.style.transform = `translate3d(${current.x.toFixed(2)}px, ${current.y.toFixed(2)}px, 0)`;
    if (
      Math.abs(target.x - current.x) > 0.05 ||
      Math.abs(target.y - current.y) > 0.05
    ) {
      raf = requestAnimationFrame(tick);
    } else {
      raf = 0;
    }
  };

  const handleMove = (e: MouseEvent) => {
    const cx = rect.left + rect.width / 2;
    const cy = rect.top + rect.height / 2;
    const dx = e.clientX - cx;
    const dy = e.clientY - cy;

    // Cheap AABB-ish bail. If we're well outside the magnetic field, do
    // nothing at all — no hypot, no rAF, no transform write.
    if (Math.abs(dx) > bail || Math.abs(dy) > bail) {
      if (target.x !== 0 || target.y !== 0) {
        target = { x: 0, y: 0 };
        if (!raf) raf = requestAnimationFrame(tick);
      }
      return;
    }

    const dist = Math.hypot(dx, dy);
    if (dist > radius) {
      target = { x: 0, y: 0 };
    } else {
      const falloff = 1 - dist / radius;
      target = { x: dx * strength * falloff, y: dy * strength * falloff };
    }
    if (!raf) raf = requestAnimationFrame(tick);
  };

  const handleLeave = () => {
    target = { x: 0, y: 0 };
    if (!raf) raf = requestAnimationFrame(tick);
  };

  window.addEventListener("mousemove", handleMove, { passive: true });
  window.addEventListener("scroll", refreshRect, { passive: true });
  window.addEventListener("resize", refreshRect);
  el.addEventListener("mouseleave", handleLeave);

  return () => {
    window.removeEventListener("mousemove", handleMove);
    window.removeEventListener("scroll", refreshRect);
    window.removeEventListener("resize", refreshRect);
    el.removeEventListener("mouseleave", handleLeave);
    if (raf) cancelAnimationFrame(raf);
    el.style.transform = "";
  };
}
