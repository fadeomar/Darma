import { describe, expect, it } from "vitest";
import { DEFAULT_FAVICON_INPUT } from "./presets";
import { createHtmlHeadSnippet, createManifestSnippet } from "./snippets";
import type { GeneratedAsset } from "./types";
import {
  bestReadableColor,
  contrastRatio,
  createReadinessChecks,
  isHexColor,
  scoreReadiness,
  validateFaviconInput,
  validateGeneratedAssets,
  validateHtmlHeadText,
  validateManifestText,
  validateWebsiteUrlInput,
} from "./validation";

function textAsset(filename: string, text: string, mimeType = "text/plain"): GeneratedAsset {
  const blob = new Blob([text], { type: mimeType });
  return { filename, mimeType, blob, kind: "snippet", size: blob.size, text };
}

function imageAsset(filename: string): GeneratedAsset {
  const blob = new Blob([filename], { type: "image/png" });
  return { filename, mimeType: "image/png", blob, kind: "image", size: blob.size };
}

function completeAssets(): GeneratedAsset[] {
  return [
    imageAsset("favicon.ico"),
    imageAsset("favicon-16x16.png"),
    imageAsset("favicon-32x32.png"),
    imageAsset("favicon-48x48.png"),
    imageAsset("apple-touch-icon.png"),
    imageAsset("android-chrome-192x192.png"),
    imageAsset("android-chrome-512x512.png"),
    imageAsset("maskable-icon-192x192.png"),
    imageAsset("maskable-icon-512x512.png"),
    textAsset("site.webmanifest", createManifestSnippet(DEFAULT_FAVICON_INPUT), "application/manifest+json"),
    textAsset("html-head-snippet.txt", createHtmlHeadSnippet(DEFAULT_FAVICON_INPUT)),
    textAsset("README.md", "# Install", "text/markdown"),
  ];
}

describe("favicon validation", () => {
  it("validates supported hex colors", () => {
    expect(isHexColor("#fff")).toBe(true);
    expect(isHexColor("#0f172a")).toBe(true);
    expect(isHexColor("red")).toBe(false);
  });

  it("calculates contrast and a readable foreground", () => {
    expect(contrastRatio("#000000", "#ffffff")).toBeCloseTo(21, 2);
    expect(contrastRatio("bad", "#ffffff")).toBeNull();
    expect(bestReadableColor("#ffffff")).toBe("#000000");
    expect(bestReadableColor("#000000")).toBe("#ffffff");
  });

  it("rejects unsafe SVG and invalid colors", () => {
    const issues = validateFaviconInput({
      ...DEFAULT_FAVICON_INPUT,
      sourceMode: "svg",
      svgText: "<svg><script>alert(1)</script></svg>",
      themeColor: "blue",
    });
    expect(issues).toContainEqual(expect.objectContaining({ id: "svg-unsafe", level: "error" }));
    expect(issues).toContainEqual(expect.objectContaining({ id: "theme-invalid", level: "error" }));
  });

  it("warns about small non-square image sources", () => {
    const issues = validateFaviconInput({
      ...DEFAULT_FAVICON_INPUT,
      sourceMode: "image",
      imageDataUrl: "data:image/png;base64,x",
      imageMeta: { width: 300, height: 200, type: "image/png" },
    });
    expect(issues.map((issue) => issue.id)).toEqual(expect.arrayContaining(["source-small", "source-not-square"]));
  });

  it("scores a complete package higher than an empty package", () => {
    const emptyScore = scoreReadiness(createReadinessChecks(DEFAULT_FAVICON_INPUT, []));
    const fullScore = scoreReadiness(createReadinessChecks(DEFAULT_FAVICON_INPUT, completeAssets()));
    expect(fullScore).toBeGreaterThan(emptyScore);
  });

  it("finds duplicate and empty generated files", () => {
    const emptyBlob = new Blob([]);
    const issues = validateGeneratedAssets(DEFAULT_FAVICON_INPUT, [
      { filename: "favicon.ico", mimeType: "image/x-icon", blob: emptyBlob, kind: "image", size: 0 },
      { filename: "favicon.ico", mimeType: "image/x-icon", blob: emptyBlob, kind: "image", size: 0 },
    ]);
    expect(issues).toContainEqual(expect.objectContaining({ id: "generated-empty-assets", level: "error" }));
    expect(issues).toContainEqual(expect.objectContaining({ id: "generated-duplicates", level: "warning" }));
  });

  it("accepts the generated manifest and HTML snippet", () => {
    expect(validateManifestText(createManifestSnippet(DEFAULT_FAVICON_INPUT)).some((issue) => issue.level === "error")).toBe(false);
    expect(validateHtmlHeadText(createHtmlHeadSnippet(DEFAULT_FAVICON_INPUT)).some((issue) => issue.level === "error")).toBe(false);
  });

  it("rejects non-http website checker URLs", () => {
    expect(validateWebsiteUrlInput("javascript:alert(1)")).toContainEqual(expect.objectContaining({ level: "error" }));
    expect(validateWebsiteUrlInput("https://example.com").some((issue) => issue.level === "error")).toBe(false);
  });
});
