import type Lenis from "lenis";

export type ScrollTriggerCtor = typeof import("gsap/ScrollTrigger").ScrollTrigger;

export function syncLenisWithScrollTrigger(
  lenis: Lenis,
  gsap: typeof import("gsap").default,
  ScrollTrigger: ScrollTriggerCtor,
): () => void {
  const onScroll = () => ScrollTrigger.update();
  lenis.on("scroll", onScroll);

  const ticker = (time: number) => {
    lenis.raf(time * 1000);
  };

  gsap.ticker.add(ticker);
  gsap.ticker.lagSmoothing(0);

  // Refresh ScrollTrigger once webfonts have settled — otherwise a pin
  // section measured before font swap can land on a stale offset.
  let fontsRefresh: (() => void) | null = null;
  if (typeof document !== "undefined" && document.fonts?.ready) {
    fontsRefresh = () => ScrollTrigger.refresh();
    document.fonts.ready.then(fontsRefresh).catch(() => {});
  }

  // And refresh on viewport resize. ScrollTrigger does this internally
  // already, but adding an idle-debounced extra refresh covers the case
  // where DOM heights settle a frame after resize fires (e.g. responsive
  // grid switching column counts).
  let resizeRaf = 0;
  const onResize = () => {
    if (resizeRaf) cancelAnimationFrame(resizeRaf);
    resizeRaf = requestAnimationFrame(() => ScrollTrigger.refresh());
  };
  window.addEventListener("resize", onResize, { passive: true });

  return () => {
    lenis.off("scroll", onScroll);
    gsap.ticker.remove(ticker);
    window.removeEventListener("resize", onResize);
    if (resizeRaf) cancelAnimationFrame(resizeRaf);
  };
}
