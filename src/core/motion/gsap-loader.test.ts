import { readFileSync } from "node:fs";
import { resolve } from "node:path";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

import {
  loadGsap,
  reportMotionFailure,
  resetGsapLoaderForTests,
  restoreInlineStyles,
  userPrefersReducedMotion,
  withGsap,
} from "./gsap-loader";

/**
 * The loader imports "gsap" and "gsap/ScrollTrigger" dynamically. Mocking the
 * modules lets us drive success and failure without a real browser.
 */
const registerPlugin = vi.fn();
let shouldFailImport = false;

vi.mock("gsap", () => ({
  get gsap() {
    if (shouldFailImport) throw new Error("chunk load failed");
    return { registerPlugin };
  },
}));

vi.mock("gsap/ScrollTrigger", () => ({
  get ScrollTrigger() {
    if (shouldFailImport) throw new Error("chunk load failed");
    return { name: "ScrollTrigger" };
  },
}));

beforeEach(() => {
  resetGsapLoaderForTests();
  registerPlugin.mockClear();
  shouldFailImport = false;
});

afterEach(() => {
  vi.restoreAllMocks();
});

describe("loadGsap caching", () => {
  it("caches a successful load and registers ScrollTrigger once", async () => {
    const first = await loadGsap();
    const second = await loadGsap();

    expect(second).toBe(first);
    expect(registerPlugin).toHaveBeenCalledTimes(1);
  });

  it("clears the cached promise when the import rejects", async () => {
    shouldFailImport = true;

    await expect(loadGsap()).rejects.toThrow("chunk load failed");

    // A cached rejection would make every later caller fail forever.
    shouldFailImport = false;
    await expect(loadGsap()).resolves.toBeDefined();
  });

  it("retries after a rejection and propagates the error to the caller", async () => {
    shouldFailImport = true;
    await expect(loadGsap()).rejects.toThrow("chunk load failed");
    await expect(loadGsap()).rejects.toThrow("chunk load failed");

    shouldFailImport = false;
    const loaded = await loadGsap();

    expect(loaded.gsap).toBeDefined();
    expect(loaded.ScrollTrigger).toBeDefined();
  });
});

describe("withGsap", () => {
  it("runs the setup when GSAP loads", async () => {
    const setup = vi.fn();

    await withGsap(setup);

    expect(setup).toHaveBeenCalledTimes(1);
  });

  it("resolves instead of throwing when the import fails", async () => {
    shouldFailImport = true;
    const setup = vi.fn();

    await expect(withGsap(setup)).resolves.toBeUndefined();
    expect(setup).not.toHaveBeenCalled();
  });
});

/**
 * These tests run in the default node environment (jsdom is not a project
 * dependency), so element stubs stand in for real DOM nodes. `restoreInlineStyles`
 * only assigns to `element.style[property]`, which this models faithfully.
 */
const styleStub = (initial: Record<string, string> = {}) =>
  ({ style: { ...initial } }) as unknown as HTMLElement;

describe("restoreInlineStyles", () => {
  it("clears every inline property used to pre-hide content", () => {
    const element = styleStub({
      opacity: "0",
      transform: "translate3d(0, 28px, 0)",
      visibility: "hidden",
      filter: "blur(4px)",
      clipPath: "inset(50%)",
    });

    restoreInlineStyles([element]);

    expect(element.style.opacity).toBe("");
    expect(element.style.transform).toBe("");
    expect(element.style.visibility).toBe("");
    expect(element.style.filter).toBe("");
    expect(element.style.clipPath).toBe("");
  });

  it("is safe to call twice, with empty input, and with holes in the list", () => {
    const element = styleStub({ opacity: "0" });

    restoreInlineStyles([element]);
    restoreInlineStyles([element]);
    restoreInlineStyles([]);
    restoreInlineStyles([undefined as unknown as HTMLElement]);

    expect(element.style.opacity).toBe("");
  });

  it("restores every element in the list", () => {
    const elements = [styleStub({ opacity: "0" }), styleStub({ opacity: "0" }), styleStub({ opacity: "0" })];

    restoreInlineStyles(elements);

    for (const element of elements) expect(element.style.opacity).toBe("");
  });
});

describe("failure path shared by pre-hiding components", () => {
  it("leaves content visible when the import rejects", async () => {
    shouldFailImport = true;
    const targets = [styleStub({ opacity: "0", transform: "translate3d(0, 28px, 0)" })];

    // Mirrors MotionSection / SplitTextReveal: hide, await, restore on failure.
    await loadGsap().catch(() => restoreInlineStyles(targets));

    expect(targets[0].style.opacity).toBe("");
    expect(targets[0].style.transform).toBe("");
  });
});

/**
 * Component-level guards. jsdom is not a project dependency, so these assert the
 * source contract; the rendered behaviour is verified in the browser during
 * Phase 1 validation (no "GSAP target not found" warnings on /tech-atlas).
 */
describe("empty target guards", () => {
  const read = (relativePath: string) => readFileSync(resolve(process.cwd(), relativePath), "utf8");

  it("guards the optional hero chip collection before animating it", () => {
    const source = read("src/components/motion/AtlasHeroScene.tsx");

    expect(source).toMatch(/chips\.length > 0/);
    // The chips tween must sit behind the guard, never called with an empty list.
    const guardIndex = source.indexOf("chips.length > 0");
    const tweenIndex = source.indexOf("gsap.fromTo(chips");
    expect(guardIndex).toBeGreaterThan(-1);
    expect(tweenIndex).toBeGreaterThan(guardIndex);
  });

  it("guards the optional hero image and glow queries", () => {
    const source = read("src/components/motion/AtlasHeroScene.tsx");

    expect(source).toMatch(/if \(image\)/);
    expect(source).toMatch(/if \(glow\)/);
  });

  it("skips split-text setup when no word targets exist", () => {
    const source = read("src/components/motion/SplitTextReveal.tsx");

    expect(source).toMatch(/targets\.length === 0/);
  });

  it("keeps reduced motion returning before any content is hidden", () => {
    for (const path of ["src/components/motion/MotionSection.tsx", "src/components/motion/SplitTextReveal.tsx"]) {
      const source = read(path);
      const guardIndex = source.indexOf("userPrefersReducedMotion()");
      const hideIndex = source.indexOf('style.opacity = "0"');

      expect(guardIndex, `${path} should check reduced motion`).toBeGreaterThan(-1);
      expect(hideIndex, `${path} should pre-hide content`).toBeGreaterThan(guardIndex);
    }
  });

  it("restores visibility on failure in every pre-hiding component", () => {
    for (const path of ["src/components/motion/MotionSection.tsx", "src/components/motion/SplitTextReveal.tsx"]) {
      const source = read(path);

      expect(source, `${path} should handle rejection`).toMatch(/\.catch\(/);
      expect(source, `${path} should restore inline styles`).toMatch(/restoreInlineStyles/);
      expect(source, `${path} should arm a visibility failsafe`).toMatch(/VISIBILITY_FAILSAFE_MS/);
    }
  });

  it("leaves no GSAP consumer without rejection handling", () => {
    const consumers = [
      "src/components/details/DetailHeroScene.tsx",
      "src/components/landing/DarmaHeroExperience.tsx",
      "src/components/landing/LandingIntentNavigator.tsx",
      "src/components/landing/LandingProofWorkflow.tsx",
      "src/components/landing/LandingSectionRail.tsx",
      "src/components/landing/LandingWorkbenchDemo.tsx",
      "src/components/landing/ModernWebRadar.tsx",
      "src/components/motion/AtlasHeroScene.tsx",
      "src/components/motion/AtlasScrollStory.tsx",
      "src/components/motion/MotionSection.tsx",
      "src/components/motion/RouteMotion.tsx",
      "src/components/motion/SplitTextReveal.tsx",
      "src/components/navigation/SiteHeader.tsx",
      "src/components/portals/PortalHeroScene.tsx",
      "src/features/career-pathfinder/components/CareerPathfinder.tsx",
    ];

    for (const path of consumers) {
      const source = read(path);
      const handled = /withGsap\(/.test(source) || /\.catch\(/.test(source);

      expect(handled, `${path} must handle a failed GSAP import`).toBe(true);
    }
  });
});

describe("reportMotionFailure", () => {
  it("does not throw for an arbitrary failure value", () => {
    const debug = vi.spyOn(console, "debug").mockImplementation(() => {});

    expect(() => reportMotionFailure(new Error("boom"))).not.toThrow();

    debug.mockRestore();
  });
});

describe("userPrefersReducedMotion", () => {
  it("reports the reduce preference from matchMedia", () => {
    vi.stubGlobal("window", { matchMedia: (query: string) => ({ matches: query.includes("reduce") }) });

    expect(userPrefersReducedMotion()).toBe(true);

    vi.stubGlobal("window", { matchMedia: () => ({ matches: false }) });

    expect(userPrefersReducedMotion()).toBe(false);

    vi.unstubAllGlobals();
  });

  it("is false during server rendering, so no GSAP import is triggered", () => {
    vi.stubGlobal("window", undefined);

    expect(userPrefersReducedMotion()).toBe(false);

    vi.unstubAllGlobals();
  });
});
