import { describe, expect, it } from "vitest";
import { DEFAULT_MOCKUP_INPUT } from "./presets";
import type { GeneratedMockupAsset, MockupInput } from "./types";
import {
  MOCKUP_PROJECT_TOOL,
  MOCKUP_PROJECT_VERSION,
  createMockupFingerprint,
  createMockupMarkdownReport,
  createMockupMetricsCsv,
  createMockupProductionChecks,
  createMockupProject,
  createMockupProjectJson,
  normalizeMockupInput,
  parseMockupProjectJson,
  scoreMockupReadiness,
  summarizeMockupProduction,
} from "./studio";

function inputWithSource(patch: Partial<MockupInput> = {}): MockupInput {
  return {
    ...DEFAULT_MOCKUP_INPUT,
    screenshotDataUrl: "data:image/png;base64,AAAA",
    screenshotName: "dashboard.png",
    screenshotWidth: 1600,
    screenshotHeight: 1000,
    ...patch,
  };
}

function asset(filename: string, width = 1600, height = 1200, bytes = 4096): GeneratedMockupAsset {
  return {
    filename,
    width,
    height,
    mimeType: "image/png",
    blob: new Blob([new Uint8Array(bytes)], { type: "image/png" }),
    previewUrl: `blob:${filename}`,
  };
}

describe("mockup project files", () => {
  it("excludes uploaded image bytes while preserving source references", () => {
    const input = inputWithSource({ backgroundImageDataUrl: "data:image/png;base64,BBBB", backgroundMode: "image" });
    const project = createMockupProject(input, "2026-07-16T00:00:00.000Z");
    expect(project.input.screenshotDataUrl).toBe("");
    expect(project.input.backgroundImageDataUrl).toBe("");
    expect(project.input.screenshotWidth).toBe(0);
    expect(project.sourceReferences).toMatchObject({ screenshotName: "dashboard.png", screenshotWidth: 1600, screenshotHeight: 1000 });
    expect(JSON.stringify(project)).not.toContain("base64");
  });

  it("normalizes imported settings and clamps unsafe values", () => {
    const normalized = normalizeMockupInput({
      device: "spaceship",
      canvasWidth: 99999,
      canvasHeight: -20,
      rotate: 90,
      filePrefix: "a\0b",
      backgroundColor: "not-a-color",
      title: "x".repeat(400),
    });
    expect(normalized.device).toBe(DEFAULT_MOCKUP_INPUT.device);
    expect(normalized.canvasWidth).toBe(4096);
    expect(normalized.canvasHeight).toBe(480);
    expect(normalized.rotate).toBe(20);
    expect(normalized.filePrefix).toBe("ab");
    expect(normalized.backgroundColor).toBe(DEFAULT_MOCKUP_INPUT.backgroundColor);
    expect(normalized.title).toHaveLength(180);
  });

  it("round-trips a valid project", () => {
    const source = createMockupProjectJson(inputWithSource({ device: "browser", exportPackId: "documentation" }));
    const parsed = parseMockupProjectJson(source);
    expect(parsed.tool).toBe(MOCKUP_PROJECT_TOOL);
    expect(parsed.version).toBe(MOCKUP_PROJECT_VERSION);
    expect(parsed.input.device).toBe("browser");
    expect(parsed.input.exportPackId).toBe("documentation");
    expect(parsed.input.screenshotDataUrl).toBe("");
  });

  it("rejects invalid JSON, tools, and versions", () => {
    expect(() => parseMockupProjectJson("{")) .toThrow(/valid JSON/i);
    expect(() => parseMockupProjectJson(JSON.stringify({ tool: "other", version: 1, input: {} }))).toThrow(/not exported/i);
    expect(() => parseMockupProjectJson(JSON.stringify({ tool: MOCKUP_PROJECT_TOOL, version: 99, input: {} }))).toThrow(/unsupported project version/i);
  });
});

describe("mockup fingerprints and audits", () => {
  it("changes the fingerprint when settings or local assets change", () => {
    const base = inputWithSource();
    expect(createMockupFingerprint(base)).not.toBe(createMockupFingerprint({ ...base, rotate: base.rotate + 1 }));
    expect(createMockupFingerprint(base)).not.toBe(createMockupFingerprint({ ...base, screenshotDataUrl: `${base.screenshotDataUrl}BBBB` }));
  });

  it("marks a fresh complete landing pack as current", () => {
    const input = inputWithSource();
    const assets = [asset("app-mockup-hero-wide.png"), asset("app-mockup-hero-16x9.png", 1920, 1080), asset("app-mockup-feature-card.png", 1200, 900)];
    const fingerprint = createMockupFingerprint(input);
    const summary = summarizeMockupProduction(input, assets, fingerprint);
    expect(summary.isFresh).toBe(true);
    expect(summary.statusLabel).toBe("Ready");
    expect(summary.checks.some((check) => check.id === "freshness" && check.severity === "pass")).toBe(true);
  });

  it("blocks missing sources and stale packages", () => {
    const input = DEFAULT_MOCKUP_INPUT;
    const assets = [asset("old.png")];
    const checks = createMockupProductionChecks(input, assets, "old-fingerprint");
    expect(checks).toEqual(expect.arrayContaining([
      expect.objectContaining({ id: "source", severity: "error" }),
      expect.objectContaining({ id: "freshness", severity: "error" }),
    ]));
    expect(scoreMockupReadiness(checks)).toBeLessThan(50);
  });

  it("flags image background mode without an attached background", () => {
    const checks = createMockupProductionChecks(inputWithSource({ backgroundMode: "image", backgroundImageDataUrl: "" }), [], "");
    expect(checks).toContainEqual(expect.objectContaining({ id: "background", severity: "error" }));
  });

  it("detects duplicate generated filenames", () => {
    const input = inputWithSource();
    const fingerprint = createMockupFingerprint(input);
    const checks = createMockupProductionChecks(input, [asset("same.png"), asset("same.png"), asset("third.png")], fingerprint);
    expect(checks).toContainEqual(expect.objectContaining({ id: "duplicates", severity: "error" }));
  });
});

describe("mockup reports", () => {
  it("creates a Markdown report without embedded source data", () => {
    const input = inputWithSource();
    const report = createMockupMarkdownReport(input, [], "");
    expect(report).toContain("# App Screenshot Mockup Production Report");
    expect(report).toContain("Screenshot source is ready");
    expect(report).not.toContain(input.screenshotDataUrl);
  });

  it("creates spreadsheet-safe CSV metrics", () => {
    const input = inputWithSource({ filePrefix: "=cmd" });
    const csv = createMockupMetricsCsv(input, [], "");
    expect(csv.split("\n")[0]).toBe("metric,value");
    expect(csv).toContain('"readiness_score"');
    expect(csv).not.toContain("data:image");
  });
});
