import { describe, expect, it } from "vitest";
import { presetToState, presets } from "./presets";
import { generateParticleData } from "./generateParticleData";
import { generateCss } from "./generateCss";
import { generateHtml } from "./generateHtml";
import {
  ANIMATED_BACKGROUND_PROJECT_TOOL,
  ANIMATED_BACKGROUND_PROJECT_VERSION,
  buildAnimatedBackgroundAudit,
  buildAnimatedBackgroundMetrics,
  buildAnimatedBackgroundSummary,
  createAnimatedBackgroundProject,
  getAnimatedBackgroundPerformanceScore,
  normalizeAnimatedBackgroundState,
  parseAnimatedBackgroundProject,
  summarizeAnimatedBackgroundAudit,
} from "./studio";

const baseState = presetToState(presets[0]);
const particles = generateParticleData(baseState);
const css = generateCss(baseState, particles);
const html = generateHtml(particles);

describe("animated background production studio", () => {
  it("normalizes imported values and disables paused export state", () => {
    const normalized = normalizeAnimatedBackgroundState({
      ...baseState,
      particleCount: 999,
      minSize: 100,
      maxSize: 50,
      speed: -3,
      colors: ["invalid", "#ABCDEF"],
      isPaused: true,
    });
    expect(normalized.particleCount).toBe(44);
    expect(normalized.maxSize).toBeGreaterThan(normalized.minSize);
    expect(normalized.speed).toBe(0.3);
    expect(normalized.colors[1]).toBe("#abcdef");
    expect(normalized.isPaused).toBe(false);
  });

  it("rejects non-object states", () => {
    expect(() => normalizeAnimatedBackgroundState(null)).toThrow("Project state must be an object");
  });

  it("creates a versioned project", () => {
    const project = createAnimatedBackgroundProject(baseState, "2026-07-14T00:00:00.000Z");
    expect(project.tool).toBe(ANIMATED_BACKGROUND_PROJECT_TOOL);
    expect(project.schemaVersion).toBe(ANIMATED_BACKGROUND_PROJECT_VERSION);
    expect(project.exportedAt).toBe("2026-07-14T00:00:00.000Z");
  });

  it("round-trips a project", () => {
    const project = createAnimatedBackgroundProject({ ...baseState, seed: 42 });
    const parsed = parseAnimatedBackgroundProject(JSON.stringify(project));
    expect(parsed.state.seed).toBe(42);
    expect(parsed.state.colors).toEqual(baseState.colors.map((color) => color.toLowerCase()));
  });

  it("rejects empty and malformed projects", () => {
    expect(() => parseAnimatedBackgroundProject("  ")).toThrow("empty");
    expect(() => parseAnimatedBackgroundProject("{" )).toThrow("not valid JSON");
  });

  it("rejects projects from another tool", () => {
    expect(() => parseAnimatedBackgroundProject(JSON.stringify({ tool: "other", schemaVersion: 1, state: baseState }))).toThrow("not created by");
  });

  it("rejects unsupported project versions", () => {
    expect(() => parseAnimatedBackgroundProject(JSON.stringify({ tool: ANIMATED_BACKGROUND_PROJECT_TOOL, schemaVersion: 2, state: baseState }))).toThrow("Unsupported project version");
  });

  it("reports reduced-motion support as a pass", () => {
    const checks = buildAnimatedBackgroundAudit(baseState, css, html);
    expect(checks.find((check) => check.id === "reduced-motion")?.severity).toBe("pass");
  });

  it("warns about dense, expensive configurations", () => {
    const state = { ...baseState, particleCount: 44, blur: 120, glow: 110, maxSize: 720 };
    const denseParticles = generateParticleData(state);
    const checks = buildAnimatedBackgroundAudit(state, generateCss(state, denseParticles), generateHtml(denseParticles));
    expect(checks.some((check) => check.severity === "warning")).toBe(true);
    expect(getAnimatedBackgroundPerformanceScore(state)).toBeGreaterThanOrEqual(85);
  });

  it("blocks invalid size ranges passed directly to the audit", () => {
    const checks = buildAnimatedBackgroundAudit({ ...baseState, minSize: 100, maxSize: 50 }, css, html);
    expect(checks.find((check) => check.id === "size-order")?.severity).toBe("error");
  });

  it("warns when readability content is hidden", () => {
    const checks = buildAnimatedBackgroundAudit({ ...baseState, showContent: false, previewMode: "empty" }, css, html);
    expect(checks.find((check) => check.id === "content-preview")?.severity).toBe("warning");
  });

  it("summarizes audit counts", () => {
    const counts = summarizeAnimatedBackgroundAudit(buildAnimatedBackgroundAudit(baseState, css, html));
    expect(counts.pass).toBeGreaterThan(0);
    expect(counts.error).toBe(0);
  });

  it("builds deterministic metrics", () => {
    const checks = buildAnimatedBackgroundAudit(baseState, css, html);
    const metrics = buildAnimatedBackgroundMetrics(baseState, css, html, checks);
    expect(metrics.particleCount).toBe(baseState.particleCount);
    expect(metrics.totalBytes).toBe(metrics.cssBytes + metrics.htmlBytes);
    expect(metrics.readinessScore).toBeGreaterThan(0);
  });

  it("builds exactly four summary cards", () => {
    const checks = buildAnimatedBackgroundAudit(baseState, css, html);
    const summary = buildAnimatedBackgroundSummary(baseState, css, html, checks);
    expect(summary).toHaveLength(4);
    expect(summary.map((card) => card.label)).toEqual(["Motion intensity", "Render cost", "Export size", "Production status"]);
  });
});
