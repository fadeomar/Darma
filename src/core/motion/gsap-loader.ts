export type LoadedGsap = {
  gsap: typeof import("gsap")["gsap"];
  ScrollTrigger: typeof import("gsap/ScrollTrigger")["ScrollTrigger"];
};

let loadingPromise: Promise<LoadedGsap> | null = null;
let pluginRegistered = false;

export function userPrefersReducedMotion() {
  return typeof window !== "undefined" && window.matchMedia("(prefers-reduced-motion: reduce)").matches;
}

export async function loadGsap(): Promise<LoadedGsap> {
  if (loadingPromise) return loadingPromise;

  loadingPromise = Promise.all([import("gsap"), import("gsap/ScrollTrigger")])
    .then(([gsapModule, triggerModule]) => {
      const gsap = gsapModule.gsap;
      const ScrollTrigger = triggerModule.ScrollTrigger;

      // registerPlugin is idempotent in GSAP, but skipping the repeat call keeps
      // the loader cheap for the many components that await it.
      if (!pluginRegistered) {
        gsap.registerPlugin(ScrollTrigger);
        pluginRegistered = true;
      }

      return { gsap, ScrollTrigger };
    })
    .catch((error: unknown) => {
      // Never cache a rejection: a chunk that failed once (offline, stale
      // deploy, blocked request) must be retryable on the next mount instead of
      // leaving every later caller permanently broken.
      loadingPromise = null;
      throw error;
    });

  return loadingPromise;
}

/**
 * Test-only reset so a suite can exercise the retry path without module state
 * leaking between cases.
 */
export function resetGsapLoaderForTests() {
  loadingPromise = null;
  pluginRegistered = false;
}

/**
 * Swallow a motion failure without noisy production logging.
 *
 * Animation is progressive enhancement: when it cannot load, the only
 * requirement is that content stays readable. Consumers that hide content
 * before awaiting GSAP must restore it themselves (see `restoreInlineStyles`).
 */
export function reportMotionFailure(error: unknown) {
  if (process.env.NODE_ENV !== "production") {
    console.debug("[darma/motion] animation skipped, content left visible:", error);
  }
}

/**
 * Run an animation setup once GSAP is available, swallowing load failures.
 *
 * Use this for components whose content is visible until GSAP applies a
 * from-state: if the import fails the setup simply never runs and the markup
 * stays readable. Components that pre-hide content before awaiting GSAP must
 * instead handle rejection themselves and call `restoreInlineStyles`.
 */
export function withGsap(setup: (loaded: LoadedGsap) => void): Promise<void> {
  return loadGsap().then(setup).catch(reportMotionFailure);
}

type InlineStyleName = "opacity" | "transform" | "visibility" | "filter" | "clipPath";

const RESTORED_PROPERTIES: InlineStyleName[] = ["opacity", "transform", "visibility", "filter", "clipPath"];

/**
 * Clear the inline styles a component set to pre-hide content, so the element
 * falls back to whatever the stylesheet says (i.e. visible).
 *
 * Safe to call more than once and safe to call on unmounted elements.
 */
export function restoreInlineStyles(elements: readonly HTMLElement[]) {
  for (const element of elements) {
    if (!element) continue;
    for (const property of RESTORED_PROPERTIES) {
      element.style[property] = "";
    }
  }
}

/** True when any part of the element is inside the viewport. */
function isInViewport(element: HTMLElement) {
  if (typeof window === "undefined") return false;
  const rect = element.getBoundingClientRect();
  return rect.bottom > 0 && rect.top < window.innerHeight;
}

/**
 * Reveal pre-hidden content that no animation ever claimed.
 *
 * Content below the fold is legitimately held at `opacity: 0` until its
 * ScrollTrigger fires, so only elements already inside the viewport are
 * restored - those should have animated immediately. An element whose inline
 * opacity is no longer exactly "0" has been picked up by GSAP, so it is left
 * alone and a running animation is never interrupted.
 *
 * This covers the case a rejection handler cannot: GSAP loads fine but the
 * trigger never fires (mis-measured layout, no scroll events, a suspended
 * renderer), which would otherwise leave a hero heading permanently invisible.
 *
 * Returns a cancel function; call it on unmount.
 */
export function armVisibilityFailsafe(elements: readonly HTMLElement[], delayMs: number) {
  if (typeof window === "undefined" || elements.length === 0) return () => {};

  const timer = setTimeout(() => {
    const stranded = elements.filter((element) => element && element.style.opacity === "0" && isInViewport(element));
    if (stranded.length > 0) restoreInlineStyles(stranded);
  }, delayMs);

  return () => clearTimeout(timer);
}
