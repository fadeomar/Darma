import { describe, expect, it } from "vitest";
import { presetToState, presets } from "./presets";
import { generateCss } from "./generateCss";
import { generateParticleData } from "./generateParticleData";
import {
  buildAnimatedBackgroundColorSamples,
  getAnimatedBackgroundReadability,
  rgbaFromHex,
} from "./readability";

const baseState = presetToState(presets[0]);

describe("animated background readability", () => {
  it("selects a light foreground for a dark background", () => {
    const analysis = getAnimatedBackgroundReadability({
      ...baseState,
      background: "#020617",
      colors: ["#0f172a", "#1e293b"],
      foregroundMode: "auto",
      readabilityProtection: true,
    });

    expect(analysis.resolvedTone).toBe("light");
    expect(analysis.meetsNormalTextAA).toBe(true);
    expect(analysis.protectedMinContrast).toBeGreaterThanOrEqual(4.5);
  });

  it("selects a dark foreground for a light background", () => {
    const analysis = getAnimatedBackgroundReadability({
      ...baseState,
      background: "#f8fafc",
      colors: ["#ffffff", "#e2e8f0"],
      foregroundMode: "auto",
      readabilityProtection: true,
    });

    expect(analysis.resolvedTone).toBe("dark");
    expect(analysis.meetsNormalTextAA).toBe(true);
  });

  it("adds the minimum protective scrim when forced foreground contrast is weak", () => {
    const unprotected = getAnimatedBackgroundReadability({
      ...baseState,
      background: "#f8fafc",
      colors: ["#ffffff", "#e2e8f0"],
      foregroundMode: "light",
      readabilityProtection: false,
    });
    const protectedAnalysis = getAnimatedBackgroundReadability({
      ...baseState,
      background: "#f8fafc",
      colors: ["#ffffff", "#e2e8f0"],
      foregroundMode: "light",
      readabilityProtection: true,
    });

    expect(unprotected.meetsNormalTextAA).toBe(false);
    expect(protectedAnalysis.protectionApplied).toBe(true);
    expect(protectedAnalysis.scrimOpacity).toBeGreaterThan(0);
    expect(protectedAnalysis.protectedMinContrast).toBeGreaterThanOrEqual(4.5);
  });

  it("builds multiple conservative samples from the palette", () => {
    const samples = buildAnimatedBackgroundColorSamples(baseState);
    expect(samples.length).toBeGreaterThan(baseState.colors.length);
    expect(new Set(samples).size).toBe(samples.length);
  });

  it("exports foreground variables and a readability layer", () => {
    const state = { ...baseState, foregroundMode: "auto" as const, readabilityProtection: true };
    const css = generateCss(state, generateParticleData(state));
    expect(css).toContain("--darma-content-color");
    expect(css).toContain("--darma-content-muted");
    expect(css).toContain("linear-gradient(rgba(");
  });

  it("formats alpha colors for generated CSS", () => {
    expect(rgbaFromHex("#ffffff", 0.5)).toBe("rgba(255, 255, 255, 0.500)");
  });
});
