import { describe, expect, it } from "vitest";
import { DEFAULT_FAVICON_INPUT } from "./presets";
import type { GeneratedAsset } from "./types";
import {
  FAVICON_PROJECT_TOOL,
  MAX_EMBEDDED_SVG_BYTES,
  createFaviconAuditMarkdown,
  createFaviconHandoffAssets,
  createFaviconInputFingerprint,
  createFaviconMetricsCsv,
  createFaviconProductionChecks,
  createFaviconProject,
  createFaviconProjectJson,
  normalizeFaviconInput,
  parseFaviconProjectJson,
  summarizeFaviconProduction,
} from "./studio";

function asset(filename: string, mimeType = "image/png"): GeneratedAsset {
  const blob = new Blob([filename], { type: mimeType });
  return { filename, mimeType, blob, kind: mimeType.startsWith("image/") ? "image" : "snippet", size: blob.size };
}

const readyAssets = [
  asset("favicon.ico", "image/x-icon"),
  asset("favicon-16x16.png"),
  asset("favicon-32x32.png"),
  asset("apple-touch-icon.png"),
  asset("android-chrome-192x192.png"),
  asset("android-chrome-512x512.png"),
  asset("maskable-icon-192x192.png"),
  asset("maskable-icon-512x512.png"),
  asset("site.webmanifest", "application/manifest+json"),
  asset("html-head-snippet.txt", "text/plain"),
  asset("README.md", "text/markdown"),
];

describe("favicon project files", () => {
  it("excludes uploaded image data from portable projects", () => {
    const project = createFaviconProject({
      ...DEFAULT_FAVICON_INPUT,
      sourceMode: "image",
      imageDataUrl: "data:image/png;base64,private",
      imageMeta: { width: 1024, height: 1024, type: "image/png", name: "logo.png" },
    }, "2026-07-14T00:00:00.000Z");
    expect(project.tool).toBe(FAVICON_PROJECT_TOOL);
    expect(project.input.imageDataUrl).toBe("");
    expect(project.input.imageMeta).toBeNull();
    expect(project.sourcePolicy.imageEmbedded).toBe(false);
    expect(JSON.stringify(project)).not.toContain("private");
  });

  it("keeps a safe compact SVG source", () => {
    const svg = '<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 10 10"><path d="M0 0h10v10H0z"/></svg>';
    const project = createFaviconProject({ ...DEFAULT_FAVICON_INPUT, sourceMode: "svg", svgText: svg });
    expect(project.input.svgText).toBe(svg);
    expect(project.sourcePolicy.svgEmbedded).toBe(true);
  });

  it("excludes oversized or unsafe SVG markup", () => {
    const oversized = `<svg>${"x".repeat(MAX_EMBEDDED_SVG_BYTES + 1)}</svg>`;
    expect(createFaviconProject({ ...DEFAULT_FAVICON_INPUT, sourceMode: "svg", svgText: oversized }).input.svgText).toBe("");
    expect(createFaviconProject({ ...DEFAULT_FAVICON_INPUT, sourceMode: "svg", svgText: "<svg><script>alert(1)</script></svg>" }).input.svgText).toBe("");
  });

  it("round-trips a versioned settings project", () => {
    const input = { ...DEFAULT_FAVICON_INPUT, text: "PX", padding: 28, includeMonochrome: true };
    const parsed = parseFaviconProjectJson(createFaviconProjectJson(input));
    expect(parsed.input.text).toBe("PX");
    expect(parsed.input.padding).toBe(28);
    expect(parsed.input.includeMonochrome).toBe(true);
  });

  it("rejects unrelated, unsupported, and malformed files", () => {
    expect(() => parseFaviconProjectJson("not json")).toThrow(/valid JSON/i);
    expect(() => parseFaviconProjectJson('{"tool":"other","version":1,"input":{}}')).toThrow(/not exported/i);
    expect(() => parseFaviconProjectJson(`{"tool":"${FAVICON_PROJECT_TOOL}","version":2,"input":{}}`)).toThrow(/unsupported/i);
  });

  it("normalizes malformed values and strips binary data", () => {
    const normalized = normalizeFaviconInput({
      sourceMode: "unknown",
      imageDataUrl: "data:image/png;base64,private",
      text: "x".repeat(100),
      padding: 999,
      foregroundColor: "red",
      shape: "triangle",
      fontFamily: "url(evil)",
      sourceTransform: { zoom: -5, offsetX: 900, fitMode: "bad" },
    });
    expect(normalized.sourceMode).toBe(DEFAULT_FAVICON_INPUT.sourceMode);
    expect(normalized.imageDataUrl).toBe("");
    expect(normalized.text).toHaveLength(16);
    expect(normalized.padding).toBe(45);
    expect(normalized.foregroundColor).toBe(DEFAULT_FAVICON_INPUT.foregroundColor);
    expect(normalized.shape).toBe(DEFAULT_FAVICON_INPUT.shape);
    expect(normalized.fontFamily).toBe(DEFAULT_FAVICON_INPUT.fontFamily);
    expect(normalized.sourceTransform.zoom).toBe(25);
    expect(normalized.sourceTransform.offsetX).toBe(100);
  });
});

describe("favicon production analysis", () => {
  it("creates stable fingerprints and changes them with source settings", () => {
    const first = createFaviconInputFingerprint(DEFAULT_FAVICON_INPUT);
    expect(first).toBe(createFaviconInputFingerprint({ ...DEFAULT_FAVICON_INPUT }));
    expect(first).not.toBe(createFaviconInputFingerprint({ ...DEFAULT_FAVICON_INPUT, text: "Z" }));
    expect(first).not.toBe(createFaviconInputFingerprint({ ...DEFAULT_FAVICON_INPUT, imageDataUrl: "data:image/png;base64,a" }));
  });

  it("flags stale generated files", () => {
    const checks = createFaviconProductionChecks(DEFAULT_FAVICON_INPUT, readyAssets, "old-fingerprint");
    expect(checks).toContainEqual(expect.objectContaining({ id: "assets", severity: "warning" }));
  });

  it("reports a fresh complete package", () => {
    const fingerprint = createFaviconInputFingerprint(DEFAULT_FAVICON_INPUT);
    const summary = summarizeFaviconProduction(DEFAULT_FAVICON_INPUT, readyAssets, fingerprint);
    expect(summary.assetCount).toBe(readyAssets.length);
    expect(summary.fresh).toBe(true);
    expect(summary.readinessScore).toBeGreaterThan(0);
  });

  it("blocks low-contrast text icons", () => {
    const input = { ...DEFAULT_FAVICON_INPUT, foregroundColor: "#ffffff", backgroundColor: "#ffffff" };
    const checks = createFaviconProductionChecks(input, readyAssets, createFaviconInputFingerprint(input));
    expect(checks).toContainEqual(expect.objectContaining({ id: "contrast", severity: "error" }));
  });

  it("documents image-source portability", () => {
    const input = { ...DEFAULT_FAVICON_INPUT, sourceMode: "image" as const, imageDataUrl: "data:image/png;base64,private" };
    const checks = createFaviconProductionChecks(input, readyAssets, createFaviconInputFingerprint(input));
    expect(checks).toContainEqual(expect.objectContaining({ id: "project", severity: "info" }));
  });
});

describe("favicon production reports", () => {
  it("generates Markdown without embedded source data", () => {
    const input = { ...DEFAULT_FAVICON_INPUT, sourceMode: "image" as const, imageDataUrl: "data:image/png;base64,private-source" };
    const markdown = createFaviconAuditMarkdown(input, readyAssets, createFaviconInputFingerprint(input));
    expect(markdown).toContain("# Favicon and app icon production audit");
    expect(markdown).not.toContain("private-source");
  });

  it("generates a one-row CSV summary", () => {
    const csv = createFaviconMetricsCsv(DEFAULT_FAVICON_INPUT, readyAssets, createFaviconInputFingerprint(DEFAULT_FAVICON_INPUT));
    expect(csv.trim().split("\n")).toHaveLength(2);
    expect(csv).toContain("readiness_score");
  });

  it("creates three portable handoff assets", async () => {
    const assets = createFaviconHandoffAssets(DEFAULT_FAVICON_INPUT, readyAssets, createFaviconInputFingerprint(DEFAULT_FAVICON_INPUT));
    expect(assets.map((item) => item.filename)).toEqual(["favicon-project.json", "production-audit.md", "production-metrics.csv"]);
    expect(JSON.parse(await assets[0].blob.text()).tool).toBe(FAVICON_PROJECT_TOOL);
  });
});
