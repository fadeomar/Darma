import { describe, it, expect } from "vitest";
import { generateParticleData } from "./generateParticleData";
import { generateCss } from "./generateCss";
import type { AnimatedBackgroundState } from "../types";

function makeState(overrides: Partial<AnimatedBackgroundState> = {}): AnimatedBackgroundState {
  return {
    presetId: "default",
    seed: 42,
    colors: ["#38bdf8", "#8b5cf6"],
    background: "#0f172a",
    shape: "circle",
    borderRadius: 50,
    particleCount: 8,
    minSize: 20,
    maxSize: 60,
    speed: 1,
    intensity: 0.5,
    opacity: 0.6,
    blur: 0,
    glow: 4,
    blendMode: "screen",
    gradientStyle: "mesh",
    isPaused: false,
    ...overrides,
  };
}

// ─── generateParticleData ────────────────────────────────────────────────────

describe("generateParticleData", () => {
  it("returns the requested number of particles", () => {
    const particles = generateParticleData(makeState({ particleCount: 8 }));
    expect(particles).toHaveLength(8);
  });

  it("clamps particleCount to max of 44", () => {
    const particles = generateParticleData(makeState({ particleCount: 100 }));
    expect(particles).toHaveLength(44);
  });

  it("clamps particleCount to minimum of 1", () => {
    const particles = generateParticleData(makeState({ particleCount: 0 }));
    expect(particles).toHaveLength(1);
  });

  it("is deterministic for the same seed", () => {
    const a = generateParticleData(makeState({ seed: 123 }));
    const b = generateParticleData(makeState({ seed: 123 }));
    expect(a).toEqual(b);
  });

  it("produces different results for different seeds", () => {
    const a = generateParticleData(makeState({ seed: 1 }));
    const b = generateParticleData(makeState({ seed: 2 }));
    // At least one particle should differ
    expect(a[0].x).not.toBe(b[0].x);
  });

  it("assigns sequential IDs starting from 1", () => {
    const particles = generateParticleData(makeState({ particleCount: 3 }));
    expect(particles[0].id).toBe(1);
    expect(particles[1].id).toBe(2);
    expect(particles[2].id).toBe(3);
  });

  it("assigns colors from the colors array cycling", () => {
    const particles = generateParticleData(makeState({
      particleCount: 3,
      colors: ["#ff0000", "#00ff00"],
    }));
    expect(particles[0].color).toBe("#ff0000");
    expect(particles[1].color).toBe("#00ff00");
    expect(particles[2].color).toBe("#ff0000"); // wraps
  });

  it("sizes are between minSize and maxSize (approximately)", () => {
    const state = makeState({ particleCount: 20, minSize: 10, maxSize: 50 });
    const particles = generateParticleData(state);
    for (const p of particles) {
      expect(p.size).toBeGreaterThanOrEqual(10 - 0.01);
      expect(p.size).toBeLessThanOrEqual(50 + 0.01);
    }
  });

  it("opacity is capped at 0.95", () => {
    const particles = generateParticleData(makeState({ opacity: 1.0, particleCount: 20 }));
    for (const p of particles) {
      expect(p.opacity).toBeLessThanOrEqual(0.95 + 0.001);
    }
  });
});

// ─── generateCss ─────────────────────────────────────────────────────────────

describe("generateCss", () => {
  const state = makeState();
  const particles = generateParticleData(state);

  it("returns a non-empty CSS string", () => {
    const css = generateCss(state, particles);
    expect(css.trim().length).toBeGreaterThan(0);
  });

  it("contains the .darma-animated-bg selector", () => {
    const css = generateCss(state, particles);
    expect(css).toContain(".darma-animated-bg");
  });

  it("contains animation-play-state: running when not paused", () => {
    const css = generateCss(state, particles, { paused: false });
    expect(css).toContain("animation-play-state: running");
  });

  it("contains animation-play-state: paused when paused", () => {
    const css = generateCss(state, particles, { paused: true });
    expect(css).toContain("animation-play-state: paused");
  });

  it("contains @keyframes darma-float", () => {
    const css = generateCss(state, particles);
    expect(css).toContain("@keyframes darma-float");
  });

  it("contains a reduced-motion media query", () => {
    const css = generateCss(state, particles);
    expect(css).toContain("prefers-reduced-motion");
  });

  it("contains nth-child rules for each particle", () => {
    const css = generateCss(state, particles);
    for (const p of particles) {
      expect(css).toContain(`nth-child(${p.id})`);
    }
  });

  it("uses border-radius: 999px for circle shape", () => {
    const css = generateCss(makeState({ shape: "circle" }), particles);
    expect(css).toContain("border-radius: 999px");
  });

  it("uses rotate(45deg) for diamond shape", () => {
    const css = generateCss(makeState({ shape: "diamond" }), particles);
    expect(css).toContain("rotate(45deg)");
  });

  it("uses border-radius% for soft-square shape", () => {
    const css = generateCss(makeState({ shape: "soft-square", borderRadius: 12 }), particles);
    expect(css).toContain("border-radius: 12%");
  });

  it("includes mix-blend-mode from state", () => {
    const css = generateCss(makeState({ blendMode: "overlay" }), particles);
    expect(css).toContain("mix-blend-mode: overlay");
  });
});
