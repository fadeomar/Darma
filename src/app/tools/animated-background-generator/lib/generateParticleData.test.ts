import { describe, expect, it } from "vitest";
import { presetToState, presets } from "./presets";
import { generateParticleData } from "./generateParticleData";
import { generateCss } from "./generateCss";
import { generateHtml } from "./generateHtml";

const baseState = presetToState(presets[0]);

describe("animated background generators", () => {
  it("creates the requested number of particles", () => {
    expect(generateParticleData({ ...baseState, particleCount: 12 })).toHaveLength(12);
  });

  it("clamps particle counts to the supported range", () => {
    expect(generateParticleData({ ...baseState, particleCount: 0 })).toHaveLength(1);
    expect(generateParticleData({ ...baseState, particleCount: 100 })).toHaveLength(44);
  });

  it("is deterministic for the same seed", () => {
    expect(generateParticleData(baseState)).toEqual(generateParticleData(baseState));
  });

  it("changes layouts when the seed changes", () => {
    expect(generateParticleData({ ...baseState, seed: 1 })).not.toEqual(generateParticleData({ ...baseState, seed: 2 }));
  });

  it("uses sequential one-based particle IDs", () => {
    expect(generateParticleData({ ...baseState, particleCount: 3 }).map((particle) => particle.id)).toEqual([1, 2, 3]);
  });

  it("keeps generated sizes inside the configured range", () => {
    const particles = generateParticleData({ ...baseState, minSize: 20, maxSize: 40, particleCount: 30 });
    expect(particles.every((particle) => particle.size >= 20 && particle.size <= 40)).toBe(true);
  });

  it("cycles through configured colors", () => {
    const particles = generateParticleData({ ...baseState, colors: ["#111111", "#222222"], particleCount: 4 });
    expect(particles.map((particle) => particle.color)).toEqual(["#111111", "#222222", "#111111", "#222222"]);
  });

  it("caps particle opacity", () => {
    const particles = generateParticleData({ ...baseState, opacity: 0.95, particleCount: 44 });
    expect(Math.max(...particles.map((particle) => particle.opacity))).toBeLessThanOrEqual(0.95);
  });

  it("generates scoped CSS and particle selectors", () => {
    const particles = generateParticleData({ ...baseState, particleCount: 3 });
    const css = generateCss(baseState, particles);
    expect(css).toContain(".darma-animated-bg");
    expect(css).toContain("span:nth-child(3)");
    expect(css).toContain("@keyframes darma-float");
  });

  it("includes reduced-motion handling", () => {
    const css = generateCss(baseState, generateParticleData(baseState));
    expect(css).toContain("prefers-reduced-motion");
    expect(css).toContain("animation: none !important");
  });

  it("can generate paused CSS when requested", () => {
    const css = generateCss(baseState, generateParticleData(baseState), { paused: true });
    expect(css).toContain("animation-play-state: paused");
  });

  it("generates matching HTML children", () => {
    const html = generateHtml(generateParticleData({ ...baseState, particleCount: 5 }));
    expect(html.match(/<span><\/span>/g)).toHaveLength(5);
  });
});
