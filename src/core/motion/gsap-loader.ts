export type LoadedGsap = {
  gsap: typeof import("gsap")["gsap"];
  ScrollTrigger: typeof import("gsap/ScrollTrigger")["ScrollTrigger"];
};

let loadingPromise: Promise<LoadedGsap> | null = null;

export function userPrefersReducedMotion() {
  return typeof window !== "undefined" && window.matchMedia("(prefers-reduced-motion: reduce)").matches;
}

export async function loadGsap(): Promise<LoadedGsap> {
  if (loadingPromise) return loadingPromise;

  loadingPromise = Promise.all([import("gsap"), import("gsap/ScrollTrigger")]).then(([gsapModule, triggerModule]) => {
    const gsap = gsapModule.gsap;
    const ScrollTrigger = triggerModule.ScrollTrigger;
    gsap.registerPlugin(ScrollTrigger);
    return { gsap, ScrollTrigger };
  });

  return loadingPromise;
}
