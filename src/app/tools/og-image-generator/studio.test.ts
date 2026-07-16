import { describe, expect, it } from "vitest";
import { DEFAULT_OG_INPUT } from "./presets";
import type { OgGeneratedAsset } from "./types";
import {
  MAX_OG_PROJECT_BYTES,
  OG_PROJECT_TOOL,
  contrastRatio,
  createInputFingerprint,
  createOgAuditMarkdown,
  createOgMetricsCsv,
  createOgProductionChecks,
  createOgProject,
  createOgProjectJson,
  normalizeOgInput,
  parseOgProjectJson,
  summarizeOgProduction,
} from "./studio";

function asset(filename: string, options: Partial<OgGeneratedAsset> = {}): OgGeneratedAsset {
  const blob = new Blob(["content"], { type: "text/plain" });
  return {
    filename,
    mimeType: "text/plain",
    blob,
    kind: "snippet",
    size: blob.size,
    ...options,
  };
}

const readyAssets = [
  asset("opengraph-image.png", { kind: "image", mimeType: "image/png", width: 1200, height: 630 }),
  asset("html-meta-tags.txt"),
];

describe("OG project files", () => {
  it("creates a compact settings-only project", () => {
    const input = { ...DEFAULT_OG_INPUT, logoDataUrl: "data:image/png;base64,secret", backgroundImageDataUrl: "data:image/png;base64,large" };
    const project = createOgProject(input, "2026-07-14T00:00:00.000Z");
    expect(project.tool).toBe(OG_PROJECT_TOOL);
    expect(project.input.logoDataUrl).toBe("");
    expect(project.input.backgroundImageDataUrl).toBe("");
    expect(project.assetPolicy.embeddedAssets).toBe(false);
    expect(createOgProjectJson(input).length).toBeLessThan(MAX_OG_PROJECT_BYTES);
  });

  it("round-trips a valid settings project", () => {
    const input = { ...DEFAULT_OG_INPUT, title: "Launch card", titleSize: 83, safeArea: false };
    const parsed = parseOgProjectJson(createOgProjectJson(input));
    expect(parsed.input.title).toBe("Launch card");
    expect(parsed.input.titleSize).toBe(83);
    expect(parsed.input.safeArea).toBe(false);
  });

  it("rejects unrelated and unsupported project files", () => {
    expect(() => parseOgProjectJson('{"tool":"other","version":1,"input":{}}')).toThrow(/not exported/i);
    expect(() => parseOgProjectJson(`{"tool":"${OG_PROJECT_TOOL}","version":2,"input":{}}`)).toThrow(/unsupported/i);
    expect(() => parseOgProjectJson("not json")).toThrow(/valid JSON/i);
  });

  it("normalizes unsafe or malformed fields", () => {
    const normalized = normalizeOgInput({
      templateId: "unknown",
      title: "x".repeat(300),
      foregroundColor: "red",
      gradientAngle: 999,
      titleSize: -10,
      backgroundImageDataUrl: "data:image/png;base64,do-not-import",
    });
    expect(normalized.templateId).toBe(DEFAULT_OG_INPUT.templateId);
    expect(normalized.title).toHaveLength(180);
    expect(normalized.foregroundColor).toBe(DEFAULT_OG_INPUT.foregroundColor);
    expect(normalized.gradientAngle).toBe(360);
    expect(normalized.titleSize).toBe(42);
    expect(normalized.backgroundImageDataUrl).toBe("");
  });
});

describe("OG production analysis", () => {
  it("calculates known contrast ratios", () => {
    expect(contrastRatio("#000000", "#ffffff")).toBeCloseTo(21, 2);
    expect(contrastRatio("#ffffff", "#ffffff")).toBeCloseTo(1, 2);
    expect(contrastRatio("invalid", "#ffffff")).toBe(0);
  });

  it("creates stable fingerprints and changes them with design settings", () => {
    const first = createInputFingerprint(DEFAULT_OG_INPUT);
    expect(first).toBe(createInputFingerprint({ ...DEFAULT_OG_INPUT }));
    expect(first).not.toBe(createInputFingerprint({ ...DEFAULT_OG_INPUT, title: "Different" }));
  });

  it("reports ready packages when assets match the design", () => {
    const fingerprint = createInputFingerprint(DEFAULT_OG_INPUT);
    const summary = summarizeOgProduction(DEFAULT_OG_INPUT, readyAssets, fingerprint);
    expect(summary.assetCount).toBe(2);
    expect(summary.counts.error).toBe(0);
    expect(summary.ready).toBe(true);
    expect(summary.statusLabel).toBe("Ready");
  });

  it("flags stale generated assets", () => {
    const checks = createOgProductionChecks(DEFAULT_OG_INPUT, readyAssets, "old-fingerprint");
    expect(checks).toContainEqual(expect.objectContaining({ id: "assets", severity: "warning" }));
  });

  it("blocks empty titles and low contrast", () => {
    const input = { ...DEFAULT_OG_INPUT, title: "", foregroundColor: "#ffffff", backgroundColor: "#ffffff", backgroundMode: "solid" as const };
    const checks = createOgProductionChecks(input, [], undefined);
    expect(checks.filter((check) => check.severity === "error").map((check) => check.id)).toEqual(expect.arrayContaining(["title", "contrast"]));
  });

  it("requires manual contrast review for image backgrounds", () => {
    const checks = createOgProductionChecks({ ...DEFAULT_OG_INPUT, backgroundMode: "image" }, readyAssets, createInputFingerprint({ ...DEFAULT_OG_INPUT, backgroundMode: "image" }));
    expect(checks).toContainEqual(expect.objectContaining({ id: "contrast", severity: "info" }));
  });

  it("documents excluded uploaded assets", () => {
    const input = { ...DEFAULT_OG_INPUT, logoDataUrl: "data:image/png;base64,logo" };
    const checks = createOgProductionChecks(input, readyAssets, createInputFingerprint(input));
    expect(checks).toContainEqual(expect.objectContaining({ id: "project-assets", severity: "info" }));
  });
});

describe("OG reports", () => {
  it("generates a Markdown audit without embedding binary data", () => {
    const input = { ...DEFAULT_OG_INPUT, logoDataUrl: "data:image/png;base64,private-logo" };
    const markdown = createOgAuditMarkdown(input, readyAssets, createInputFingerprint(input));
    expect(markdown).toContain("# Open Graph production audit");
    expect(markdown).toContain("Readiness: Ready");
    expect(markdown).not.toContain("private-logo");
  });

  it("generates a one-row CSV summary", () => {
    const csv = createOgMetricsCsv(DEFAULT_OG_INPUT, readyAssets, createInputFingerprint(DEFAULT_OG_INPUT));
    const lines = csv.trim().split("\n");
    expect(lines).toHaveLength(2);
    expect(lines[0]).toContain("contrast_ratio");
    expect(lines[1]).toContain('"Ready"');
  });
});
